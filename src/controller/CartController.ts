import { Get, JsonController, Res, Post, Body, Authorized, HeaderParam, QueryParam } from 'routing-controllers';
import { Response } from 'express';
import { BaseController } from './BaseController';
import { logger } from '../logger';
import { User } from '../models/User';



@JsonController('/cart')
export class CartController extends BaseController {
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
                return res.send(cart);
            } else {
                return res.status(212).send({ name: 'found_error', message: `Cart not found.` });
            }
        } catch (err) {
            logger.info(err)
            return res.status(212).send({ name: 'found_error', message: err.message });
        }
    }

    @Authorized()
    @Post('/add')
    async addToCart(
        @HeaderParam("authorization") user: User,
        @Body() data: any,
        @Res() res: Response
    ) {
        try {
            const condition = 'product.id = :id AND product.isDeleted = 0';
            const product = await this.productService.getOne(condition, { id: data.productId });
            if (!product) {
                return res.status(212).send({ name: 'found_error', message: `Product not found.` });
            }
            let sku;
            if (data.skuId) {
                sku = await this.skuService.findById(data.skuId);
            } else {
                sku = await this.skuService.getSKUByProductId(data.productId);
            }
            if (!sku) {
                return res.status(212).send({ name: 'found_error', message: `SKU not found.` });
            }
            const cart = await this.cartService.addToCart(data, product, sku, user.id);
            return res.status(200).send(cart);
        } catch (err) {
            logger.info(err)
            return res.status(212).send({ name: 'add_to_cart_error', message: err.message });
        }
    }

}
