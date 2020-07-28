import { Get, JsonController, Res, Post, Body, QueryParams, Authorized, HeaderParam, Put, QueryParam } from 'routing-controllers';
import { Response } from 'express';
import { BaseController } from './BaseController';
import { logger } from '../logger';
import { User } from '../models/User';
import { paginationData, stringTONumber, isArrayPopulated } from '../utils/Utils';
import * as fastcsv from 'fast-csv';
import OrganisationService from '../services/OrganisationService';

export interface OrderListQueryParams {
  name: string;
  year: string;
  product: 'all' | 'direct';
  paymentStatus: 'not paid' | 'paid' | 'refunded' | 'partially refunded';
  fulfilmentStatus: 'to be sent' | 'awaiting pickup' | 'in transit' | 'completed';
  organisationUniqueKey: string;
  limit: number;
  offset: number;
}

export interface OrderSummaryQueryParams {
  search: string;
  year: string;
  postcode: number;
  organisationId: number;
  paymentMethod: 'cash' | 'credit card' | 'direct debit';
  sorterBy: string;
  order: string;
  limit: number;
  offset: number;
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
      const organisationService = new OrganisationService();
      const organisation = await organisationService.findById(data.organisationId);
      if (organisation) {
        const order = await this.orderService.createOrder(data, user.id);
        return res.send(order);
      }
    } catch (err) {
      logger.info(err)
      return res.send(err.message);
    }
  }

  @Authorized()
  @Get('/list')
  async getOrderStatusList(
    @QueryParams() params: OrderListQueryParams,
    @Res() res: Response
  ) {
    try {
      const pagination = {
        limit: params.limit ? params.limit : 8,
        offset: params.offset ? params.offset : 0
      }
      const organisationId = await this.organisationService.findByUniquekey(params.organisationUniqueKey);
      const orderList = await this.orderService.getOrderStatusList(params, organisationId, pagination);
      if (orderList) {
        const { ordersStatus, numberOfOrders } = orderList;
        let totalCount = numberOfOrders;
        let responseObject = paginationData(stringTONumber(totalCount), pagination.limit, pagination.offset);
        responseObject["orders"] = ordersStatus;
        return res.status(200).send(responseObject);
      }
      return res.send(orderList);
    } catch (err) {
      logger.info(err)
      return res.send(err.message);
    }
  }

  @Authorized()
  @Get('/summary')
  async getOrdersSummary(
    @QueryParams() params: OrderSummaryQueryParams,
    @Res() res: Response
  ) {
    try {
      const { sorterBy, order } = params;
      const sort = {
        sortBy: sorterBy,
        order: order === 'desc' ? 'DESC' : 'ASC'
      };
      const limit = params.limit ? params.limit : 8;
      const offset = params.offset ? params.offset : 0;
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
  async updateOrdertStatus(
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

  @Authorized()
  @Get('/export/summary')
  async exportTeamAttendance(
    @QueryParams() params: OrderSummaryQueryParams,
    @Res() response: Response) {
    const sort = {
      sortBy: 'createdOn',
      order: 'DESC'
    };
    const count = await this.orderService.getOrderCount(params.search, params.year, params.paymentMethod, params.postcode, params.organisationId);
    const result = await this.orderService.getOrdersSummary(params, sort, 0, count);
    let orders: any = result.orders;
    if (isArrayPopulated(orders)) {
      orders.map(e => {
        e['Date'] = e.date;
        e['Name'] = e.name;
        e['Affiliate'] = e.affiliate;
        e['Postcode'] = e.postcode;
        e['Order ID'] = e.id
        e['Fee Paid'] = e.paid;
        e['Net profit'] = e.netProfit;
        e['Payment Method'] = e.paymentMethod;
        delete e.date;
        delete e.paymentMethod;
        delete e.name;
        delete e.affiliate;
        delete e.postcode;
        delete e.id;
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

    response.setHeader('Content-disposition', 'attachment; filename=order_summary.csv');
    response.setHeader('content-type', 'text/csv');
    fastcsv.write(orders, { headers: true })
      .on("finish", function () { })
      .pipe(response);
  }
}
