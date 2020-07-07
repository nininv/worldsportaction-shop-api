import { Get, JsonController, Res, Post, Body, QueryParams, Authorized, HeaderParam } from 'routing-controllers';
import { Response } from 'express';
import { BaseController } from './BaseController';
import { logger } from '../logger';
import { User } from '../models/User';

export interface OrderListQueryParams {
  name: string,
  year: string,
  product: 'all' | 'direct',
  paymentStatus: 'not paid' | 'paid' | 'refunded' | 'partially refunded',
  fulfilmentStatus: 'to be sent' | 'awaiting pickup' | 'in transit' | 'completed',
}

@JsonController('/order')
export class OrderController extends BaseController {

  @Authorized()
  @Post('')
  async createOrder(
    @HeaderParam("authorization") user: User,
    @Body() data: any,
    @Res() res: Response
  ) {
    try {
      const order = await this.orderService.createOrder(data, user.id);
      return res.send(order);
    } catch (err) {
      logger.info(err)
      return res.send(err.message);
    }
  }

  @Authorized()
  @Get('/list')
  async getOrderList(
    @QueryParams() params: OrderListQueryParams,
    @Res() res: Response
  ) {
    try {
      const orderList = await this.orderService.getOrderList(params);
      return res.send(orderList);
    } catch (err) {
      logger.info(err)
      return res.send(err.message);
    }
  }
}

