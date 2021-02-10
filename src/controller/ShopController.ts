import { Get, JsonController, Res, Post, Body, Authorized, HeaderParam, QueryParam } from 'routing-controllers';
import { Response } from 'express';
import Stripe from 'stripe';
import { BaseController } from './BaseController';
import { logger } from '../logger';
import { User } from '../models/User';
import AppConstants from '../validation/AppConstants';
import {feeIsNull, formatFeeForStripe1, isArrayPopulated, isNotNullAndUndefined, isNullOrEmpty} from "../utils/Utils";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, { apiVersion: '2020-08-27' });

export interface cartProduct {
    amount: number,
    inventoryTracking: number,
    optionName: string,
    organisationId: string,
    productId: number,
    productImgUrl: string,
    productName: string,
    quantity: number,
    skuId: number,
    tax: number,
    totalAmt: number
    variantId: number,
    variantName: string,
    variantOptionId: number,
}

export interface GetProductQueryParams {
    typeId: number,
    paging: {
        limit: number,
        offset: number,
    }
    organisationUniqueKey: number | string,
}

export interface UpdateCartQueryParams {
    cartProducts: [cartProduct],
    securePaymentOptions: [
        {securePaymentOptionRefId: number}
    ],
    total: {
        gst: 0,
        total: 0,
        shipping: 0,
        subTotal: 0,
        targetValue: 0,
        transactionFee: 0
    }
    shopUniqueKey: string,
}

@JsonController('/api/shop')
export class CartController extends BaseController {
    @Authorized()
    @Get('/cart')
    async getCartInformation(
        @HeaderParam("authorization") user: User,
        @QueryParam('shopUniqueKey') shopUniqueKey: string,
        @Res() res: Response
    ) {
        try {
            const cartProducts = await this.shopService.getCartInformation(shopUniqueKey, user.id);

            return res.status(200).send(cartProducts);
        } catch (err) {
            logger.info(err);
            return res.status(212).send({ name: 'found_error', message: err.message });
        }
    }

    @Authorized()
    @Post('/cart/update')
    async updateCartProducts(
        @HeaderParam("authorization") user: User,
        @Body() {shopUniqueKey, cartProducts}: UpdateCartQueryParams,
        @Res() res: Response
    ) {
        try {
            const updatedCartProducts = await this.shopService.updateCartProducts(shopUniqueKey, cartProducts)

            return res.send(updatedCartProducts)
        } catch (err) {
            logger.info(err);
            return res.status(212).send({ name: 'found_error', message: err.message });
        }
    }


    @Authorized()
    @Post('/product')
    async getShopProducts(
        @HeaderParam("authorization") user: User,
        @Body() requestBody: GetProductQueryParams,
        @Res() res: Response
    ) {
        try {
            const result = await this.productService.getShopProducts(requestBody)
            return res.status(200).send(result);
        } catch (err) {
            logger.info(err);
            return res.status(500).send("Something went wrong. Please contact administrator" + err.message);
        }
    }

    @Authorized()
    @Get('/organisations')
    async getShopOrganisations(
        @HeaderParam("authorization") user: User,
        @Res() res: Response
    ) {
        try {
            const result = await this.organisationService.getShopOrganisations();
            return res.status(200).send(result);
        } catch (err) {
            logger.info(err);
            return res.status(500).send("Something went wrong. Please contact administrator" + err.message);
        }
    }

    @Authorized()
    @Post('/payment')
    async paymentSubmit(
        @HeaderParam("authorization") user: User,
        @Body() {payload}: any,
        @Res() res: Response
    ) {
        try {
            const result = await this.paymentService.paymentSubmit(payload);
            //@ts-ignore
            const invoice = await this.invoiceService.getInvoice(result.cart);
            let totalFee = 0;
            const PAYMENT_STATUS = invoice.paymentStatus;
            const INVOICE_ID = invoice.id
            console.log("PAYMENT_STATUS" + PAYMENT_STATUS + "**" + INVOICE_ID);
            if (PAYMENT_STATUS === 'success') {
                return res.status(200).send({ success: true, message: "no need to pay, as its already paid" });
            }
            else if(PAYMENT_STATUS === 'pending'){
                return res.status(212).send({ success: true, message: "no need to pay, as its already paid" });
            }
            else {
                //@ts-ignore
                const account = await this.organisationService.checkOrganisationStripeAccount(result.cartProducts);

                if (!account.stripeAccountIdError) {
                    const CURRENCY_TYPE: string = "aud";
                    const STRIPE_EXTRA_CHARGES: number = 0; // TODO: needs discussion
                    //@ts-ignore
                    totalFee = feeIsNull(result.total.targetValue);
                    if(totalFee == 0){
                        totalFee = 1;
                    }
                    const TOTAL_FEE_STRIPE_PAY: number = formatFeeForStripe1(totalFee + STRIPE_EXTRA_CHARGES);
                    let paymentIntent = null;
                    if (payload.paymentType != null) {
                        paymentIntent = await this.getStripePaymentIntent(payload,
                            //@ts-ignore
                            TOTAL_FEE_STRIPE_PAY, CURRENCY_TYPE, result.cart, payload.paymentType,
                            AppConstants.shop);
                    }

                    else if (payload.paymentType === AppConstants.card) {
                        if (paymentIntent.status === "succeeded") {

                            // await this.saveRegistrationInfo(registration, registrationProduct);
                            // this.performCCInvoicePayment(registrationProduct,paymentIntent, CURRENCY_TYPE, registration, INVOICE_ID,
                            //     paymentBody.paymentType, transArr, totalFee,paidBy, null);

                            //await this.performPaymentOperation(registrationProduct, registration, INVOICE_ID, transArr, totalFee, paymentIntent,
                            //  paymentBody.paymentType, paidBy);

                        } else {
                            return res.status(212).send({ success: false, message: "cannot create payment, an error occured" });
                        }
                    }
                } else {
                    const message = `Please contact ${account.orgName} organisation regarding integration with Stripe`;
                    return res.status(212).send({success: false, message});
                }
            }


            return res.status(200).send(result);
        } catch (err) {

            if (err.type === 'StripeCardError') {
                switch (err.code) {
                    case 'processing_error':
                    case 'expired_card':
                    case 'card_declined': // with declination due to fraudulent, this is the code that returns
                    case 'incorrect_number': // unlikely, since this will not pass the frontend
                    case 'incorrect_cvc':
                    default:
                        return res.status(400).json({success: false, message: AppConstants.cardErrDefault});
                }
            }

            logger.error(`Exception occurred in Create Payments ` + err);

            return res.status(500).send("Something went wrong. Please contact administrator" + err.message);
        }
    }


    async getStripePaymentIntent(paymentBody, totalStripeFee, currencyType, cart, paymentType, transferGroupPrefix) {
        let PAYMENT_INTENT_ID = '';

        try {
            let paymentIntentObject = Object.assign({});
            let email = null;
            let name = null;
            let stripeCustomerId = null;
            let userInfo = await this.userService.findById(cart.createdBy);
            if (isNotNullAndUndefined(userInfo)) {
                email = userInfo.email;
                name = userInfo.firstName + ' ' + userInfo.lastName;
                stripeCustomerId = userInfo.stripeCustomerAccountId;
                if (userInfo.isInActive == 1) {
                    let parentEmailString = await this.userService.getParentEmail(userInfo.email);
                    email = parentEmailString;
                }
            }

            let paymentIntent = null;

            if(totalStripeFee > 0){
                if (isNotNullAndUndefined(paymentBody.token) && isNotNullAndUndefined(paymentBody.token.id) &&
                    (paymentType == AppConstants.card))
                {
                    paymentIntentObject['confirm'] = true;
                    paymentIntentObject['setup_future_usage'] = "off_session";
                    if(isNullOrEmpty(stripeCustomerId)) {
                        let customerObject = {
                            description: name,
                            email: email,
                            name: name,
                            source: paymentBody.token.id
                        }
                        const createCustomer = await stripe.customers.create(customerObject);
                        stripeCustomerId = createCustomer.id;
                        userInfo.stripeCustomerAccountId = stripeCustomerId;
                        await this.userService.updateUser(userInfo, cart.createdBy);
                    }
                    else{
                        const paymentMethods = await stripe.paymentMethods.list({
                            customer: stripeCustomerId,
                            type: 'card',
                        });
                        if(!isArrayPopulated(paymentMethods.data)){
                            await stripe.customers.update(stripeCustomerId, {source: paymentBody.token.id});
                        }
                    }

                }
                paymentIntentObject['customer'] = stripeCustomerId;
                paymentIntentObject['amount'] = totalStripeFee;
                paymentIntentObject['currency'] = currencyType;
                paymentIntentObject['metadata'] = { integration_check: 'accept_a_payment' };
                paymentIntentObject['description'] = "Shop Payment";
                paymentIntentObject['confirmation_method'] = "automatic";
                if(transferGroupPrefix == AppConstants.shop){
                    paymentIntentObject['transfer_group'] = transferGroupPrefix + "#" +cart.shopUniqueKey;
                }
                paymentIntentObject['payment_method_types'] = ['card', 'au_becs_debit'];

                logger.info(`***** paymentIntentObject+ ${JSON.stringify(paymentIntentObject)}`);

                paymentIntent = await stripe.paymentIntents.create(paymentIntentObject);
                PAYMENT_INTENT_ID = paymentIntent.id;
            }

            const updateTransaction = await this.invoiceService
                .updateErrorMessageAndPaymentTypeWithTransaction(cart.id, paymentType, null, PAYMENT_INTENT_ID);
            console.log('updateTransaction  :::: '+ updateTransaction)
            return paymentIntent;
        } catch (error) {
            logger.info(`Error occurred in getStripePaymentIntent" ${error}`);
            const updateTransaction = await this.invoiceService
                .updateErrorMessageAndPaymentTypeWithTransaction(cart.id, paymentType, error.message, PAYMENT_INTENT_ID);
            console.log('updateTransaction  :::: '+ updateTransaction);
            throw error;
        }
    }
}
