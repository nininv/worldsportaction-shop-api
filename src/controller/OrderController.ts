import { Get, JsonController, Res, Post, Body, QueryParams, Authorized, HeaderParam, Put, QueryParam } from 'routing-controllers';
import { Response } from 'express';
import { BaseController } from './BaseController';
import { logger } from '../logger';
import { User } from '../models/User';
import { paginationData, stringTONumber, isArrayPopulated } from '../utils/Utils';
import * as fastcsv from 'fast-csv';

export interface OrderListQueryParams {
  name: string;
  year: string;
  product: 'all' | 'direct';
  paymentStatus: 'not paid' | 'paid' | 'refunded' | 'partially refunded';
  fulfilmentStatus: 'to be sent' | 'awaiting pickup' | 'in transit' | 'completed';
  organisationUniqueKey: string;
}

export interface OrderSummaryQueryParams {
  name: string;
  orderNumber: number;
  year: string;
  postcode: number; 
  affiliate: string;
  paymentMethod: 'cash' | 'credit card' | 'direct debit';
}

@JsonController('/order')
export class OrderController extends BaseController {

  // @Authorized()
  @Post('')
  async createOrder(
    @HeaderParam("authorization") user: User,
    @Body() data: any,
    @Res() res: Response
  ) {
    try {
      const order = await this.orderService.createOrder(data, 1);
      return res.send(order);
    } catch (err) {
      logger.info(err)
      return res.send(err.message);
    }
  }

  // @Authorized()
  @Get('/list')
  async getOrderList(
    @QueryParams() params: OrderListQueryParams,
    @Res() res: Response
  ) {
    try {
      const organisationId = await this.organisationService.findByUniquekey(params.organisationUniqueKey);
      const orderList = await this.orderService.getOrderList(params, organisationId);
      return res.send(orderList);
    } catch (err) {
      logger.info(err)
      return res.send(err.message);
    }
  }

  // @Authorized()
  @Get('/summary')
  async getOrdersSummary(
    @QueryParams() params: OrderSummaryQueryParams,
    @QueryParam('sorterBy') sortBy: string,
    @QueryParam('order') order: string,
    @QueryParam('limit') limitT: string,
    @QueryParam('offset') offsetT: string,
    @Res() res: Response
  ) {
    try {
      const sort = {
        sortBy,
        order: order === 'desc' ? 'DESC' : 'ASC'
      };
      const limit = limitT ? +limitT : 8;
      const offset = offsetT ? offsetT : 0;
      const found = await this.orderService.getOrdersSummary(params, sort, offset, limit);

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
  async getOrderById(
    @QueryParam('id') id: string,
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

  // @Authorized()
  @Get('/export/summary')
  async exportTeamAttendance(
    @QueryParams() params: OrderSummaryQueryParams,
    @Res() response: Response) {
    const count = await this.orderService.getOrderCount(params.name, params.orderNumber, params.year, params.paymentMethod, params.postcode);
    const result = await this.orderService.getOrdersSummary( params, {}, 0, count);
​    let orders = result.orders;
    if (isArrayPopulated(orders)) {
      orders.map(e => {
        e['Date'] = e.date;
        e['Name'] = e.name;
        e['Affiliate'] = e.affiliate;
        e['Postcode'] = e.postcode;
        e['Order ID'] = e.orderId
        e['Fee Paid'] = e.paid;
        e['Net profit'] = e.netProfit;
        e['Payment Method'] = e.paymentMethod;
        delete e.date;
        delete e.paymentMethod;
        delete e.name;
        delete e.affiliate;
        delete e.postcode;
        delete e.orderId;
        delete e.paid;
        delete e.netProfit;
        return e;
      });
    } else {
      orders.push({
        ['Date']: 'N/A',
        ['Name']: 'N/A',
        ['Affilate']: 'N/A',
        ['Postcode']: 'N/A',
        ['Order ID']: 'N/A',
        ['Fee Paid']: 'N/A',
        ['Net profit']: 'N/A',
        ['Payment Method']: 'N/A',
      });
    }
​
    response.setHeader('Content-disposition', 'attachment; filename=order_summary.csv');
    response.setHeader('content-type', 'text/csv');
    fastcsv.write(orders, { headers: true })
      .on("finish", function () { })
      .pipe(response);
  }
}
