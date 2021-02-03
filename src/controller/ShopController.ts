import { Get, JsonController, Res, Post, Body, Authorized, HeaderParam, QueryParam } from 'routing-controllers';
import { Response } from 'express';
import { BaseController } from './BaseController';
import { logger } from '../logger';
import { User } from '../models/User';

@JsonController('/shop')
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

            return res.send(cartProducts);
        } catch (err) {
            logger.info(err);
            return res.status(212).send({ name: 'found_error', message: err.message });
        }
    }

    @Authorized()
    @Post('/cart/update')
    async updateCartProducts(
        @HeaderParam("authorization") user: User,
        @Body() {shopUniqueKey, cartProducts}: any,
        @Res() res: Response
    ) {

        const updatedCartProducts = await this.shopService.updateCartProducts(shopUniqueKey, cartProducts)

        return res.send(updatedCartProducts)

        // add and delete element from cart in one request for each cart changes.

    }

    // clear cart

}