import { Get, JsonController, Res, Post, Body, Authorized, HeaderParam, Put, QueryParam } from 'routing-controllers';
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
    @Get('/')
    async get(
        @QueryParam('id') id: number,
        @Res() res: Response
    ) {
        try {
            const condition = "cart.id = :id "
            const cart = await this.cartService.getOne(condition, { id });
            return res.send(cart);
        } catch (err) {
            logger.info(err)
            return res.send(err.message);
        }
    }

    @Authorized()
    @Get('')
    async getCart(
        @HeaderParam("authorization") user: User,
        @QueryParam('id') id: number,
        @Res() res: Response
    ) {
        try {
            let condition, variables;
            if (id) {
                condition = "cart.id = :id "
                variables = { id };
            } else {
                condition = "cart.createdBy = :userId";
                variables = { userId: user.id };
            }
            const cart = await this.cartService.getOne(condition, variables);
            if (cart) {
                return res.status(200).send(cart);
            } else {
                return res.status(404).send({ message: 'The cart not found' });
            }
        } catch (err) {
            logger.info(err)
            return res.send(err.message);
        }
    }

    @Authorized()
    @Post('')
    async addToCart(
        @HeaderParam("authorization") user: User,
        @Body() data: any,
        @Res() res: Response
    ) {
        try {
            const condition = 'product.id = :id AND product.isDeleted = 0';
            const product = await this.productService.getOne(condition, { id: data.productId });
            const sku = await this.skuService.findById(data.skuId);
            const cart = await this.cartService.addToCart(data, product, sku, 1);
            return res.send(cart);
        } catch (err) {
            logger.info(err)
            return res.send(err.message);
        }
    }

}
