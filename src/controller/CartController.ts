import { Get, JsonController, Res, Post, Body, QueryParams, Authorized, HeaderParam, Put, QueryParam } from 'routing-controllers';
import { Response } from 'express';
import { BaseController } from './BaseController';
import { logger } from '../logger';
import { User } from '../models/User';



@JsonController('/cart')
export class CartController extends BaseController {

    @Authorized()
    @Post('')
    async createCart(
        @HeaderParam("authorization") user: User,
        @Body() data: any,
        @Res() res: Response
    ) {
        try {
            const cart = await this.cartService.createCart(data, user.id);
            return res.send(cart);
        } catch (err) {
            logger.info(err)
            return res.send(err.message);
        }
    }

    @Authorized()
    @Get('/list')
    async getCartist(

        @Res() res: Response
    ) {
        try {
            const cartList = await this.cartService.getCartList();
            return res.send(cartList);
        } catch (err) {
            logger.info(err)
            return res.send(err.message);
        }
    }

    @Authorized()
    @Get('')
    async getOrder(
        @QueryParam('id') id: string,
        @Res() res: Response
    ) {
        try {
            const cart = await this.cartService.getCartById(id);
            // if (cart) {
                return res.status(200).send(cart);
            // } else {
            //     return res.status(404).send({ message: 'The cart not found' });
            // }
        } catch (err) {
            logger.info(err)
            return res.send(err.message);
        }
    }

    @Authorized()
    @Put('')
    async updateORdertStatus(
        @HeaderParam("authorization") user: User,
        @Body() data: any,
        @Res() res: Response
    ) {
        try {
            const cart = await this.cartService.updateCart(data, user.id);
            return res.send(cart);
        } catch (err) {
            logger.info(err)
            return res.send(err.message);
        }
    }

}
