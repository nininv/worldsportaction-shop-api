import { Get, JsonController, Res, Post, Body, QueryParams, Authorized, HeaderParam, HeaderParams, Put, QueryParam } from 'routing-controllers';
import { Response } from 'express';
import * as fastcsv from 'fast-csv';
import moment from "moment";

import { BaseController } from './BaseController';
import { logger } from '../logger';
import { User } from '../models/User';
import {
  paginationData,
  stringTONumber,
  isArrayPopulated,
  isNotNullAndUndefined,
  getFastCSVTableData,
  getOrderKeyword
} from '../utils/Utils';
import OrganisationService from '../services/OrganisationService';
import { SortData } from '../services/ProductService';
import axios from 'axios';
import OrderStatus from '../enums/orderStatus.enum'

export interface OrderListQueryParams {
  name: string;
  year: string;
  product: 'all' | 'direct';
  paymentStatus: 1 | 2 | 3 | 4;
  fulfilmentStatus: 5 | 6 | 7 | 8;
  organisationUniqueKey: string;
  userId?: number;
  limit: number;
  offset: number;
  sorterBy: string;
  order: string;
  search?: string;
}

export interface OrderUserListQueryParams {
  id: number,
  limit: number;
  offset: number;
}

export interface OrderSummaryQueryParams {
  search: string;
  year: string;
  postcode: number;
  organisationUniqueKey: string;
  paymentMethod: 'cash' | 'credit card' | 'direct debit';
  currentOrganisation?: string;
  sorterBy: string;
  order: string;
  limit: number;
  offset: number;
}

export interface IOrderStatusQueryParams {
  search: string;
  year: string;
  organisationUniqueKey: string;
  sorterBy: string;
  order: string;
  limit: number;
  offset: number;
  paymentStatus: string;
  fulfilmentStatus: string;
  product: string;
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
      let orders = [];
      const orderGroup = await this.orderGroupService.createOrderGroup(user.id);
      for (const req of data) {
        const organisationService = new OrganisationService();
        const organisation = await organisationService.findById(req.organisationId);
        if (organisation) {
          const order = await this.orderService.createOrder(req, orderGroup, user.id);
          orders = [...orders, order];
          const confirmedBooking = await this.transdirectService.confirmBooking(req.courier.bookingId, req.courier.name, req.courier.pickupDate);
        }
      }
      return res.send(orders);
    } catch (err) {
      logger.info(err)
      return res.status(212).send({ name: 'create_error', message: err.message });
    }
  }

  @Authorized()
  @Post('/createBooking')
  async createBooking(
    @Body() data: any,
    @Res() res: Response
  ) {
    try {
      const { address, email, name, postcode, phone, state, suburb, country, sellProducts } = data;
      const orgProducts = await this.orderService.parseSellProducts(sellProducts);
      let resultArray = [];
      for (const orgProduct of orgProducts) {
        const response = await this.transdirectService.createBooking(orgProduct, name, address, email, postcode, phone, state, suburb, country);
        resultArray = [...resultArray, {
          order: {
            bookingId: response.data.id, reciever: { name, address, state, suburb, postcode, email, phone },
            products: orgProduct.items, couriers: response.data.quotes
          }
        }]
      }
      return res.send(resultArray);
    } catch (err) {
      logger.info(err)
      return res.status(212).send({ name: 'post_error', message: err.message });
    }
  }

  @Authorized()
  @Get('/statusList')
  async getOrderStatusList(
    @QueryParams() params: OrderListQueryParams,
    @Res() res: Response
  ) {
    try {
      const pagination = {
        limit: params.limit ? params.limit : 8,
        offset: params.offset ? params.offset : 0
      };
      const sort: SortData = {
        sortBy: params.sorterBy,
        order: params.order === ''? 'DESC' :params.order === 'desc' ? 'DESC' : 'ASC'
      };

      if(params.search === null||params.search === undefined) {
        delete params.search;
      }

      let organisationId;
      if(params.organisationUniqueKey!==undefined) {
        organisationId = await this.organisationService.findByUniquekey(params.organisationUniqueKey);
      }
      const orderList = await this.orderService.getOrderStatusList(params, organisationId, pagination, sort);
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
      return res.status(212).send({ name: 'found_error', message: err.message });
    }
  }

  @Authorized()
  @Get('/list')
  async getUserOrderList(
    @HeaderParam("authorization") user: User,
    @QueryParams() params: OrderUserListQueryParams,
    @Res() res: Response
  ) {
    try {
      const pagination = {
        limit: params.limit ? params.limit : 8,
        offset: params.offset ? params.offset : 0
      }
      const userId = params.id ? params.id : user.id;
      const orderList = await this.orderService.getUserOrderList(params, userId, pagination);
      if (orderList) {
        const { orders, numberOfOrders } = orderList;
        let totalCount = numberOfOrders;
        let responseObject = paginationData(stringTONumber(totalCount), pagination.limit, pagination.offset);
        responseObject["orders"] = orders;
        return res.status(200).send(responseObject);
      }
      return res.send(orderList);
    } catch (err) {
      logger.info(err)
      return res.status(212).send({ name: 'found_error', message: err.message });
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
      const sort: SortData = {
        sortBy: sorterBy,
        order: order === '' ? 'DESC': order === 'desc' ? 'DESC' : 'ASC'
      };
      const limit = params.limit ? params.limit : 8;
      const offset = params.offset ? params.offset : 0;
      let organisationId;
      let currentOrganisationId;
      if (params.organisationUniqueKey && +params.organisationUniqueKey !== -1) {
        organisationId = await this.organisationService.findByUniquekey(params.organisationUniqueKey);
      }

      if (isNotNullAndUndefined(params.currentOrganisation)) {
        currentOrganisationId = await this.organisationService.findByUniquekey(params.currentOrganisation);
      } else {
        return res.status(212).send({ name: 'org_not_found_error', message: 'pass current organisation key' });
      }

      const found = await this.orderService.getOrdersSummary({ organisationId,currentOrganisationId, ...params }, sort, offset, limit);

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
      return res.status(212).send({ name: 'found_error', message: err.message });
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
        return res.status(212).send({ name: 'found_error', message: 'The order not found' });
      }
    } catch (err) {
      logger.info(err)
      return res.status(212).send({ name: 'found_error', message: err.message });
    }
  }

  @Authorized()
  @Put('')
  async updateOrdertStatus(
    @HeaderParams() headers: any,
    @HeaderParam("authorization") user: User,
    @Body() data: any,
    @Res() res: Response
  ) {
    try {
      if (data.amount) {
        data.amount = parseFloat(data.amount)
      }
      const token = headers.authorizationRaw;
      const registrationServerUrl = process.env.REGISTRATION_API_URL;
      const { orderId } = data;
      let order: any = await this.orderService.getOrderById(orderId)
      if (!order) {
        return res.status(212).send({ name: 'found_error', message: 'Order not found' });
      }
      if (data.action === OrderStatus.FullRefund || data.action === OrderStatus.PartialRefund) {
        if (!order.sellProducts && order.sellProducts.length) {
          throw new Error('Order details not found')
        }
        let orderTotalAmount = 0;
        order.sellProducts.forEach(sp => {
          orderTotalAmount += sp.quantity * sp.price;
        })
        let amountToBeRefunded = 0;
        let alreadyRefundedAmount = parseFloat(order.refundedAmount) || 0;
        // Partial refund
        if (data.amount && data.action === OrderStatus.PartialRefund) {
          if (data.amount > orderTotalAmount) {
            throw new Error('Refund amount is greater than order total')
          } else if (data.amount > (orderTotalAmount - alreadyRefundedAmount)) {
            throw new Error('Refund amount is greater than total non refunded amount')
          }
          amountToBeRefunded = data.amount;
          if (data.amount === (orderTotalAmount - alreadyRefundedAmount)) {
            data.action = 3
          }
        } else {
          // Full refund
          amountToBeRefunded = orderTotalAmount - alreadyRefundedAmount;
        }
  
        if (amountToBeRefunded === 0) {
          throw new Error('This order have already been refunded')
        }
        const { data: refundResult } = await axios.post(
          `${registrationServerUrl}/api/payments/refundAPaymentIntent`, {
            payment_intent: order.paymentIntentId,
            transfer_id: order.stripeTransferId,
            amount: amountToBeRefunded * 100
          }, {
            headers: {
              Authorization: `${token}`
            }
          }
        )
        await this.orderService.updateRefundedAmount(orderId, amountToBeRefunded)
      }
      order = await this.orderService.updateOrderStatus(data, user.id);
      return res.status(200).send(order);
    } catch (err) {
      logger.info(err)
      return res.status(212).send({ name: 'put_error', message: err.message });
    }
  }

  @Authorized()
  @Get('/export/status')
  async exportOrderStatus(
      @QueryParams() params: IOrderStatusQueryParams,
      @Res() response: Response,
      @HeaderParams() headers: any,
  ) {
    const token = headers.authorizationRaw;
    const csvTableData = await this.orderService.exportOrderStatus({
      token,
      params
    })

    response.setHeader('Content-disposition', 'attachment; filename=order_status.csv');
    response.setHeader('content-type', 'text/csv');
    fastcsv.write(csvTableData, { headers: true })
        .on("finish", function () { })
        .pipe(response);
  }

  @Authorized()
  @Get('/export/summary')
  async exportTeamAttendance(
    @QueryParams() params: OrderSummaryQueryParams,
    @Res() response: Response) {
    const sort: SortData = {
      sortBy: 'createdOn',
      order: 'DESC'
    };
    let organisationId;
    if (params.organisationUniqueKey) {
      organisationId = await this.organisationService.findByUniquekey(params.organisationUniqueKey);
    }
    const count = await this.orderService.getSummaryOrderCount(organisationId, params);

    let currentOrganisationId;
    if (isNotNullAndUndefined(params.currentOrganisation)) {
      currentOrganisationId = await this.organisationService.findByUniquekey(params.currentOrganisation);
    }

    const result = await this.orderService.getOrdersSummary({ organisationId,currentOrganisationId, ...params }, sort, 0, count);
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
