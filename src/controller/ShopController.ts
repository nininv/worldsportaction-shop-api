import { Get, JsonController, Res, Post, Body, Authorized, HeaderParam, QueryParam } from 'routing-controllers';
import { Response } from 'express';
import { BaseController } from './BaseController';
import { logger } from '../logger';
import { User } from '../models/User';

export interface GetProductQueryParams {
    typeId: number,
    paging: {
        limit: number,
        offset: number,
    }
    organisationUniqueKey: number | string,
}

export interface UpdateCartQueryParams {
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
            return res.status(200).send(result);
        } catch (err) {
            logger.info(err);
            return res.status(500).send("Something went wrong. Please contact administrator" + err.message);
        }
    }
}
