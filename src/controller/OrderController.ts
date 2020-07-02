import { Get, JsonController, Res, Put, Body, QueryParams, Authorized, HeaderParam } from 'routing-controllers';
import { Response } from 'express';
import { BaseController } from './BaseController';
import { logger } from '../logger';
import { User } from '../models/User';

export interface OrderListQueryParams {
  name: string,
  year: string,
  product: 'all' | 'direct',
  paymentStatus: string,
  fulfilmentStatus: string,
}

@JsonController('/order')
export class OrderController extends BaseController {

  @Authorized()
  @Put('')
  async createOrder(
    @HeaderParam("authorization") currentUser: User,
    @Body() data: any,
    @Res() res: Response
  ) {
    try {
      const order = await this.orderService.createOrder(data, currentUser.id);
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

