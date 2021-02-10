import { Get, JsonController, Res, Post, Body, Authorized, HeaderParam, QueryParam } from 'routing-controllers';
import { Response } from 'express';
import Stripe from 'stripe';
import { BaseController } from './BaseController';
import { logger } from '../logger';
import { User } from '../models/User';
import AppConstants from '../validation/AppConstants';
import {feeIsNull, formatFeeForStripe1, isArrayPopulated, isNotNullAndUndefined, isNullOrEmpty, isNullOrUndefined} from "../utils/Utils";
import {Cart} from "../models/Cart";
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, { apiVersion: '2020-08-27' });

export interface resultParams {
    cartProducts: [
        {
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
    ],
    total: {
        gst: number,
        total: number,
        shipping: number,
        subTotal: number,
        targetValue: number,
        transactionFee: number
    },
    cart: Cart
}

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
    shopUniqueKey: string,
}

export interface PaymentSubmitQueryParams {
    payload: {
        cartProducts: [
            {
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
        ],
        total: {
            gst: number,
            total: number,
            shipping: number,
            subTotal: number,
            targetValue: number,
            transactionFee: number
        }
        shopUniqueKey: string,
        paymentType: string,
        token: {
            id: string
        }
    }
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
        @Body() {payload}: PaymentSubmitQueryParams,
        @Res() res: Response
    ) {
        try {

            // perform shop payment - create order
            const shopStripePayment = async (prod, paymentIntent, transferPrefix, registration, userInfo) => {
                try {
                    const orgName = prod.orgName;
                    const productName = prod.productName;
                    const CURRENCY_TYPE: string = "aud";
                    const STRIPE_TOTAL_FEE = formatFeeForStripe1(prod.totalAmt);
                    const orgAccountId = prod.organisationAccountId;
                    //const transferGroup = transferPrefix + "#" + registration.registrationUniqueKey;
                    const transferGroup = paymentIntent.transfer_group;

                    let userName = userInfo ? userInfo.firstName + ' ' + userInfo.lastName : "";
                    let  transferForMembershipFee = null;
                    if(STRIPE_TOTAL_FEE >= 1){
                        transferForMembershipFee = await stripe.transfers.create({
                            amount: STRIPE_TOTAL_FEE,
                            currency: CURRENCY_TYPE,
                            description: `${userName} - ${productName} - ${orgName}  - SHOP FEE`,
                            source_transaction: paymentIntent.charges.data.length > 0 ? paymentIntent.charges.data[0].id : paymentIntent.id,
                            destination: orgAccountId,
                            transfer_group: transferGroup
                        });
                    }


                    return transferForMembershipFee;
                } catch (error) {
                    logger.error(`Exception occurred in shopStripePayment ${error}`);
                    throw error;
                }
            }

            const performShopPayment = async (paymentIntent, registration, registrationProducts,
                                              INVOICE_ID, paymentType) => {
                try {
                    console.log("performShopPayment::" + JSON.stringify(registrationProducts.shopProducts));

                    if(isArrayPopulated(registrationProducts.shopProducts)){
                        let userInfo = await this.userService.findById(registration.createdBy);
                        let shopTotalFee = 0;
                        let accountError = false;
                        let paymentMethod = null;
                        let paymentStatus = '1';
                        if(paymentType == "card" || paymentType === AppConstants.cashCard){
                            paymentMethod = "Credit Card";
                            paymentStatus = '2';
                        }
                        else if(paymentType == "direct_debit"){
                            paymentMethod = "Direct debit";
                        }

                        for(let prod of registrationProducts.shopProducts){
                            shopTotalFee += feeIsNull(prod.totalAmt);
                            let mOrgData = await this.organisationService.findOrganisationByUniqueKey(prod.organisationId);
                            let mStripeAccountId = null;
                            if(isArrayPopulated(mOrgData)){
                                mStripeAccountId = mOrgData[0].stripeAccountID;
                                if(isNullOrUndefined(mStripeAccountId)){
                                    prod["organisationAccountId"] = mStripeAccountId;
                                    prod["orgId"] = mOrgData[0].id;
                                    prod["orgName"] = mOrgData[0].name;
                                }
                                else{
                                    logger.error(`Organisation doesn't have Stripe Account ${prod.organisationId}` )
                                    accountError = true;
                                    break;
                                }
                            }
                        }
                        if(!accountError){
                            console.log("Shop Total Fee" + shopTotalFee);
                            let orderGrpObj =  await this.orderGroupService.getOrderGroupObj(registration.createdBy,shopTotalFee);
                            let orderGrp = await this.orderGroupService.createOrUpdate(orderGrpObj);
                            let cartObj = await this.cartService.getCartObj(registration.createdBy);
                            let cart = await this.cartService.createOrUpdate(cartObj);

                            for(let prod of registrationProducts.shopProducts){
                                logger.debug(`Product Fee ${prod.totalAmt}`);

                                let transferForShopFee
                                if(paymentType!= AppConstants.directDebit){
                                    transferForShopFee = await shopStripePayment(prod, paymentIntent,AppConstants.registration,
                                        registration, userInfo);
                                    logger.debug(`transferForShop Fee ${JSON.stringify(transferForShopFee)}`);
                                }

                                let orderObj = await this.orderService.getOrderObj(paymentMethod, paymentStatus,
                                    registration, prod, orderGrp,INVOICE_ID, registrationProducts, paymentIntent, transferForShopFee)
                                let order = await this.orderService.createOrUpdate(orderObj);
                                logger.debug("order created" + order.id);

                                const sku = await this.skuService.findById(prod.skuId);
                                let sellProductObj = await this.sellProductService.getSellProductObj(cart, order, prod, sku, registration.createdBy);
                                let sellProduct = await this.sellProductService.createOrUpdate(sellProductObj);
                                logger.debug("sellproduct created" + sellProduct.id);

                                if (prod.inventoryTracking) {
                                    const newQuantity = sku.quantity - sellProductObj.quantity;
                                    await this.skuService.updateQuantity(prod.skuId,
                                        newQuantity < 0 ? 0 : newQuantity,
                                        registration.createdBy
                                    );

                                    logger.debug("sku updating" + prod.skuId);
                                }
                            }
                        }
                    }
                    console.log('SUCCESS');
                    // if(teamMemberRegId == null)
                    //     await this.registrationMail(registration, registrationProduct, 1, INVOICE_ID)
                    // else
                    //     await this.teamMemberRegMail(registration, teamMemberRegId)
                } catch (error) {
                    logger.error(`Exception occurred in performShopPayment ${error}`);
                    throw error;
                }
            }

            // validate & save total into cart
            const result: resultParams = await this.paymentService.paymentValidate(payload);
            // invoice

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

                const account = await this.organisationService.checkOrganisationStripeAccount(result.cartProducts);

                if (!account.stripeAccountIdError) {
                    const CURRENCY_TYPE: string = "aud";
                    const STRIPE_EXTRA_CHARGES: number = 0; // TODO: needs discussion

                    totalFee = feeIsNull(result.total.targetValue);
                    if(totalFee == 0){
                        totalFee = 1;
                    }
                    const TOTAL_FEE_STRIPE_PAY: number = formatFeeForStripe1(totalFee + STRIPE_EXTRA_CHARGES);
                    let paymentIntent = null;
                    if (payload.paymentType != null) {
                        paymentIntent = await this.getStripePaymentIntent(payload,

                            TOTAL_FEE_STRIPE_PAY, CURRENCY_TYPE, result.cart, payload.paymentType,
                            AppConstants.shop);
                    }

                    else if (payload.paymentType === AppConstants.card) {
                        if (paymentIntent.status === "succeeded") {

                            // await this.saveRegistrationInfo(registration, registrationProduct);
                            // this.performCCInvoicePayment(registrationProduct,paymentIntent, CURRENCY_TYPE, registration, INVOICE_ID,
                            //     paymentBody.paymentType, transArr, totalFee,paidBy, null);

                            if(totalFee == 0){

                                await this.invoiceService.updatePaymentStatusByRegistrationID(result.cart.id);
                            }

                            await performShopPayment(paymentIntent, result.cart, payload, INVOICE_ID, payload.paymentType);

                        } else {
                            return res.status(212).send({ success: false, message: "cannot create payment, an error occured" });
                        }
                    }
                } else {
                    const message = `Please contact ${account.orgName} organisation regarding integration with Stripe`;
                    return res.status(212).send({success: false, message});
                }
            }



            return res.status(200).send({test: "SUCCESS"});
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
