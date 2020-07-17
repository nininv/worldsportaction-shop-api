import { Get, JsonController, Res, Post, Body, QueryParams, Authorized, HeaderParam, Put, QueryParam } from 'routing-controllers';
import { Response } from 'express';
import { BaseController } from './BaseController';
import { logger } from '../logger';
import { User } from '../models/User';
import { paginationData, stringTONumber } from '../utils/Utils';

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

  @Authorized()
  @Get('/summary')
  async getOrdersSummary (
    @QueryParam('filter') filter: string,
    @QueryParam('sorterBy') sortBy: string,
    @QueryParam('order') order: string,
    @QueryParam('limit') limitT: string,
    @QueryParam('offset') offsetT: string,
    @Res() res: Response
  ) {
    try {
      const search = filter ? `%${filter}%` : '%%';
      const sort = {
        sortBy,
        order: order === 'desc' ? 'DESC' : 'ASC'
      };
      const limit = limitT ? +limitT : 8;
      const offset = offsetT ? offsetT : 0;
      const found = await this.orderService.getOrdersSummary(search, sort, offset, limit);
      
      if (found) {
        const { numberOfOrders, valueOfOrders, orders } = found;
        let totalCount = numberOfOrders;
        let responseObject = paginationData(stringTONumber(totalCount), limit, stringTONumber(offset ? offset : '0'));
        responseObject["numberOfOrders"] = numberOfOrders;
        responseObject["valueOfOrders"] = valueOfOrders;
        responseObject["orders"] = orders;
        return res.status(200).send(responseObject);
      }
    } catch (err) {
      logger.info(err)
      return res.send(err.message);
    }
  }

  @Authorized()
  @Get('')
  async getOrder(
    @QueryParam('id') id : string,
    @Res() res: Response
  ) {
    try {
      const order = await this.orderService.getOrderById(id);
      if (order) {
        return res.status(200).send(order);
      } else {
        return res.status(404).send({ message: 'The order not found' });
      }
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
      const order = await this.orderService.updateOrderStatus(data, user.id);
      return res.send(order);
    } catch (err) {
      logger.info(err)
      return res.send(err.message);
    }
  }
}
