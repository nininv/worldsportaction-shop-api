import { OrderGroup } from './../models/OrderGroup';
import { Service } from "typedi";
import { getRepository, getConnection } from "typeorm";
import BaseService from "./BaseService";
import { Order } from "../models/Order";
import UserService from './UserService';
import SellProductService from './SellProductService';
import OrganisationService from './OrganisationService';
import { SortData } from './ProductService';
import { isArrayPopulated, isNotNullAndUndefined } from '../utils/Utils';

interface OrderSummaryInterface {
  numberOfOrders: number;
  valueOfOrders: number;
  orders: {
    date: Date,
    name: string,
    affiliate: string,
    postcode: number,
    id: number,
    paid: number,
    netProfit: number,
    paymentMethod: string,
  }[];
}

interface IOrderStatus {
  orderId: number;
  date: Date;
  customer: string;
  products: number;
  paymentStatus: string;
  fulfilmentStatus: string;
  total: number;
}

interface OrderStatusListInterface {
  ordersStatus: IOrderStatus[];
  numberOfOrders: number;
}

enum Action {
  NotPaid = 1,
  Paid = 2,
  RefundFullAmount = 3,
  RefundPartialAmount = 4,
  ToBeSent = 5,
  AwaitingPickUp = 6,
  InTransit = 7,
  Completed = 8
};

@Service()
export default class OrderService extends BaseService<Order> {
  modelName(): string {
    return Order.name;
  }

  public async createOrder(data: any, orderGroup: OrderGroup, userId: number): Promise<Order> {
    try {
      let total = 0;
      const userService = new UserService();
      const sellProductService = new SellProductService();
      const user = await userService.findUserById.call(this, data.userId);
      const newOrder = new Order();
      newOrder.paymentStatus = data.paymentStatus;
      newOrder.paymentMethod = data.paymentMethod;
      newOrder.fulfilmentStatus = data.fulfilmentStatus;
      newOrder.deliveryType = data.deliveryType;
      newOrder.pickUpAddress = data.deliveryType === 'pickup' ? data.pickUpAddressId : null;
      newOrder.organisationId = data.organisationId;
      newOrder.suburb = data.suburb;
      newOrder.state = data.state;
      newOrder.address = data.address;
      newOrder.postcode = data.postcode;
      newOrder.user = user;
      newOrder.createdBy = userId;
      newOrder.createdOn = new Date();
      newOrder.courier = data.courier;
      newOrder.orderGroup = orderGroup;
      const order = await getRepository(Order).save(newOrder);
      for (const iterator of data.sellProducts) {
        const sellProduct = await sellProductService.findSellProductrById(iterator);
        sellProduct.order = order;
        sellProduct.cart = null;
        sellProduct.updatedBy = userId;
        sellProduct.updatedOn = new Date();
        total += sellProduct.SKU.price * sellProduct.quantity;
        await sellProduct.save();
      }
      total += data.courier.total;
      orderGroup.total += total;
      await getRepository(OrderGroup).save(orderGroup);
      return order;
    } catch (err) {
      throw err;
    }
  }

  public async parseSellProducts(sellProducts): Promise<any> {
    try {
      const organisationService = new OrganisationService();
      let products = [];
      let orgIds = [];
      let orgProducts = [];
      for (const idx in sellProducts) {
        const sellProductService = new SellProductService();
        const sellProduct = await sellProductService.findSellProductrById(sellProducts[idx]);
        const product = {
          organisationId: sellProduct.product.createByOrg,
          item: {
            weight: sellProduct.product.weight,
            height: sellProduct.product.height,
            width: sellProduct.product.width,
            length: sellProduct.product.length,
            quantity: sellProduct.quantity,
            description: "carton"
          }
        }
        products = [...products, product];
        orgIds = [...orgIds, sellProduct.product.createByOrg];
      }
      const uniqueOrgIds = orgIds.filter((value, index, self) => {
        return self.indexOf(value) === index;
      });
      for (const id of uniqueOrgIds) {
        let items = []
        const organisation = await organisationService.findById(id);
        const state = await this.entityManager.query(
          `select name from wsa_common.reference 
           where id = ? and referenceGroupId = 37`,
          [organisation.stateRefId]
        );
        if (state.length === 0) {
          throw new Error('Invalid state');
        }
        products.forEach((product) => {
          if (product.organisationId === id) {
            items = [...items, product.item];
          }
        })
        const result = {
          sender: {
            address: organisation.street1,
            company_name: organisation.name,
            email: organisation.email,
            name: organisation.name,
            postcode: organisation.postalCode,
            phone: organisation.phoneNo,
            state: state[0].name,
            suburb: organisation.suburb,
            type: "business",
            country: "AU"
          },
          items: items
        }
        orgProducts = [...orgProducts, result]
      }
      return orgProducts;
    } catch (err) {
      throw err;
    }
  }

  public calculateOrder(order: Order) {
    const sellProducts = order.sellProducts;
    let productsCount = 0;
    for (const iterator of sellProducts) {
      productsCount += iterator.quantity;
    }
    return productsCount;
  }

  public async getOrderStatusList(params: any, organisationId, paginationData, sort: SortData): Promise<any> {
    try {
      const { product, paymentStatus, fulfilmentStatus, userId } = params;
      const nameArray = params.search ? params.search.split(' ') : [];
      const search = nameArray[0] ? `%${nameArray[0]}%` : '%%';
      const search2 = nameArray[1] ? `%${nameArray[1]}%` : '%%';
      if (nameArray.length > 2) {
        return { ordersStatus: [], numberOfOrders: 0 }
      }
      const year = params.year && +params.year !== -1 ? `%${await this.getYear(params.year)}%` : '%%';
      const isAll = product === 'All' ? true : false;
      let orderIdsList = [];
      const condition = `order.id LIKE :orderId or (user.firstName LIKE :search AND user.lastName LIKE :search2  
      AND order.createdOn LIKE :year ) 
       ${paymentStatus && +paymentStatus !== -1 ? "AND order.paymentStatus = :paymentStatus" : ""}
       ${fulfilmentStatus && +fulfilmentStatus !== -1 ? "AND order.fulfilmentStatus = :fulfilmentStatus" : ""}
       ${!isAll ? "AND order.organisationId = :organisationId" : ""}
       ${isNotNullAndUndefined(userId) ? " AND order.userId = :userId" : ""}`;
      const variables = { orderId: params.search, search, search2, paymentStatus, fulfilmentStatus, year, organisationId, orderIdsList, userId };
      const parseSort: SortData = {
        sortBy: sort && sort.sortBy && sort.sortBy !== 'products' && sort.sortBy !== 'customer'
          ? sort.sortBy !== 'total'
            ? `order.${sort.sortBy}`
            : `orderGroup.total`
          : `order.id`,
        order: sort && sort.order ? sort.order : 'DESC'
      }
      const result = await this.getMany(condition, variables, paginationData, parseSort);
      const ordersStatusPromised = result.map((order:any) => {
      const products = this.calculateOrder(order);
      return this.getOrganisationDetails(order.id).then(org => {
          order.affiliateName = org;
          return {
            orderId: order.id,
            transactionId: order.id,
            date: order.createdOn,
            customer: `${order.user.firstName} ${order.user.lastName}`,
            products,
            orderDetails: order.sellProducts.map(e => e.product.productName),
            paymentStatus: order.paymentStatus,
            fulfilmentStatus: order.fulfilmentStatus,
            total: order.orderGroup.total,
            paymentMethod: order.paymentMethod,
            affiliate: order.sellProducts.map(e => e.product.affiliates),
            affiliateName: order.affiliateName,
            productName: order.sellProducts.map(e => e.product.productName)
          }
        });
      });
      const ordersStatus = await Promise.all(ordersStatusPromised)
      let ordersList = ordersStatus;
      if (sort.sortBy === 'products') {
        ordersList = ordersStatus.sort((a, b) => this.compareOrders(a, b, 'products', sort.order))
      }
      if (sort.sortBy === 'customer') {
        ordersList = ordersStatus.sort((a, b) => this.compareOrders(a, b, 'customer', sort.order))
      }
      const numberOfOrders = await this.getCount(condition, variables);
      return { ordersStatus: ordersList, numberOfOrders };
    } catch (err) {
      throw err;
    }
  }

  public async getUserOrderList(params: any, userId: number, paginationData): Promise<{ orders: Order[], numberOfOrders: number }> {
    try {
      const condition = 'user.id = :userId';
      const orders = await this.getMany(condition, { userId }, paginationData);
      const numberOfOrders = await this.getCount('user.id = :userId', { userId });
      return { orders, numberOfOrders };
    } catch (err) {
      throw err;
    }
  }

  public async getOrderById(id): Promise<Order> {
    try {
      const order = await getConnection()
        .getRepository(Order)
        .createQueryBuilder("order")
        .leftJoinAndSelect("order.sellProducts", "sellProduct")
        .leftJoinAndSelect("sellProduct.product", "product")
        .leftJoinAndSelect("order.orderGroup", "orderGroup")
        .leftJoinAndSelect("product.images", "images")
        .leftJoinAndSelect("sellProduct.SKU", "SKU")
        .leftJoinAndSelect("order.pickUpAddress", "address")
        .leftJoinAndSelect("order.user", "user")
        .where("order.id = :id", { id })
        .getOne();
      if (order) {
        if (order.deliveryType === "shipping") {
          const userService = new UserService();
          order['shippingAddress'] = {
            state: order.user.stateRefId,
            suburb: order.user.suburb,
            street: order.user.street1,
            postcode: order.user.postalCode
          };
        }
        return order;
      } else {
        throw new Error(`order with id = ${id} not found`)
      }
    } catch (err) {
      throw err;
    }
  }

  public async updateOrderStatus(data: any, userId: number): Promise<Order> {
    try {
      const { orderId, action, amount } = data;

      const P_NOT_PAID = Order.P_NOT_PAID;
      const P_PAID = Order.P_PAID;
      const P_REFUNDED = Order.P_REFUNDED;
      const P_PARTIALLY_REFUNDED = Order.P_PARTIALLY_REFUNDED;
      const F_TO_BE_SENT = Order.F_TO_BE_SENT;
      const F_AWAITING_PICKUP = Order.F_AWAITING_PICKUP;
      const F_IN_TRANSIT = Order.F_IN_TRANSIT;
      const F_COMPLETED = Order.F_COMPLETED;

      if (action === Action.NotPaid) {
        await getRepository(Order)
          .update(orderId, { paymentStatus: P_NOT_PAID, updatedBy: userId });
      }
      if (action === Action.Paid) {
        await getRepository(Order)
          .update(orderId, { paymentStatus: P_PAID, updatedBy: userId });
      }
      if (action === Action.RefundFullAmount) {
        await getRepository(Order)
          .update(orderId, { paymentStatus: P_REFUNDED, updatedBy: userId });
      }
      if (action === Action.RefundPartialAmount && amount) {
        await getRepository(Order)
          .update(orderId, { paymentStatus: P_PARTIALLY_REFUNDED, refundedAmount: amount, updatedBy: userId });
      }
      if (action === Action.AwaitingPickUp) {
        await getRepository(Order)
          .update(orderId, { fulfilmentStatus: F_AWAITING_PICKUP, updatedBy: userId });
      }
      if (action === Action.ToBeSent) {
        await getRepository(Order)
          .update(orderId, { fulfilmentStatus: F_TO_BE_SENT, updatedBy: userId });
      }

      if (action === Action.InTransit) {
        await getRepository(Order)
          .update(orderId, { fulfilmentStatus: F_IN_TRANSIT, updatedBy: userId });
      }

      if (action === Action.Completed) {
        await getRepository(Order)
          .update(orderId, { fulfilmentStatus: F_COMPLETED, updatedBy: userId });
      }

      const updatedOrder = await getRepository(Order).findOne(orderId);
      return updatedOrder;
    } catch (err) {
      throw err;
    }
  }

  public async getYear(yearRefId: number): Promise<string> {
    try {
      const year = await this.entityManager.query(
        `select name from wsa_common.reference 
       where id = ? and referenceGroupId = 12`,
        [yearRefId]);
      return year[0].name;
    } catch (error) {
      throw error;
    }
  }

  public async getOrdersSummary(params, sort: SortData, offset, limit): Promise<OrderSummaryInterface> {
    try {
      let { paymentMethod, currentOrganisationId, postcode, organisationId } = params;
      const searchArray = params.search ? params.search.split(' ') : [];
      if (searchArray.length > 2) {
        return { numberOfOrders: 0, valueOfOrders: 0, orders: [] }
      }
      const search = searchArray[0] ? `%${searchArray[0]}%` : '%%';
      const search2 = searchArray[1] ? `%${searchArray[1]}%` : '%%';
      const year = params.year && +params.year !== -1 ? `%${await this.getYear(params.year)}%` : '%%';
      let myOrganisations;
      if(organisationId==undefined) {

        let result = await this.entityManager.query("call wsa_users.usp_affiliateToOrg(?,?)", [currentOrganisationId,null]);

        myOrganisations = [...result[1],...result[2], ...result[3]].map(e=>e.orgId);
        myOrganisations.push(currentOrganisationId);
      }

      const variables = {
        year,
        search,
        search2,
        paymentMethod,
        postcode,
        organisationId
      };
      
      if(organisationId==undefined) variables.organisationId = [...myOrganisations];

      const parseSort: SortData = {
        sortBy: sort && sort.sortBy && sort.sortBy !== '' && sort.sortBy !== 'netProfit' && sort.sortBy !== 'name'
          ? sort.sortBy !== 'paid' && sort.sortBy !== 'total'
            ? `order.${sort.sortBy}`
            : `orderGroup.total`
          : `order.id`,
        order: sort && sort.order ? sort.order : 'ASC'
      }
      const condition = `${searchArray.length === 2
        ? "( user.firstName LIKE :search AND user.lastName LIKE :search2 )"
        : "( user.firstName LIKE :search OR user.lastName LIKE :search OR order.id LIKE :search )"}
       AND order.createdOn LIKE :year
      ${organisationId !== undefined ? " AND order.organisationId = :organisationId" : " AND order.organisationId in ( :...organisationId ) "}   
      ${paymentMethod && +paymentMethod !== -1 ? "AND order.paymentMethod = :paymentMethod" : ""}
      ${postcode ? "AND order.postcode = :postcode" : ""}
    `;
      const orders = await this.getMany(condition, variables, { offset, limit }, parseSort);
      const numberOfOrders = await this.getCount(
        condition,
        variables
      );

      const parsedOrders = await this.parseOrdersStatusList(orders, sort && sort.sortBy && (sort.sortBy === 'netProfit' || sort.sortBy === 'name') ? sort : null);

      const allOrders = await this.getMany(condition, variables, { offset:0, limit:numberOfOrders }, parseSort);

      const parseAllOrders = await this.parseOrdersStatusList(allOrders, sort && sort.sortBy && (sort.sortBy === 'netProfit' || sort.sortBy === 'name') ? sort : null);
      
      const valueOfOrders = isArrayPopulated(parseAllOrders) ? parseAllOrders.reduce((a, b) => a+ (b['paid'] || 0), 0) : 0;

      return { numberOfOrders, valueOfOrders, orders: parsedOrders };
    } catch (err) {
      throw err;
    }
  }

  public async getMany(condition: string, variables, pagination, sort?: any): Promise<Order[]> {
    try {
      const orders = await getConnection()
        .getRepository(Order)
        .createQueryBuilder("order")
        .leftJoinAndSelect("order.orderGroup", "orderGroup")
        .leftJoinAndSelect("order.sellProducts", "sellProduct")
        .leftJoinAndSelect("sellProduct.product", "product")
        .leftJoinAndSelect("sellProduct.SKU", "SKU")
        .leftJoinAndSelect("order.user", "user")
        .where(condition, variables)
        .orderBy(sort && sort.sortBy
          ? sort.sortBy
          : null, sort && sort.order ? sort.order : 'ASC')
        .skip(pagination.offset)
        .take(pagination.limit)
        .getMany();
      return orders;
    } catch (error) {
      throw error;
    }
  }

  public async getCount(condition: string, variables): Promise<number> {
    try {
      const orderCount = await getConnection()
        .getRepository(Order)
        .createQueryBuilder("order")
        .leftJoinAndSelect("order.sellProducts", "sellProduct")
        .leftJoinAndSelect("sellProduct.product", "product")
        .leftJoinAndSelect("sellProduct.SKU", "SKU")
        .leftJoinAndSelect("order.user", "user")
        .where(condition, variables)
        .getCount();
      return orderCount;
    } catch (error) {
      throw error;
    }
  }

  public async getOrderCount(searchArg, year, paymentMethod, postcode, organisationId): Promise<number> {
    try {
      const searchArray = searchArg ? searchArg.split(' ') : [];
      if (searchArray.length > 2) {
        return 0;
      }
      const search = searchArray[0] ? `%${searchArray[0]}%` : '%%';
      const search2 = searchArray[1] ? `%${searchArray[1]}%` : '%%';
      const condition = `${searchArray.length === 2
        ? "( user.firstName LIKE :search AND user.lastName LIKE :search2 )"
        : "( user.firstName LIKE :search OR user.lastName LIKE :search OR order.id LIKE :search )"}
       AND order.createdOn LIKE :year
      ${paymentMethod && +paymentMethod !== -1 ? "AND order.paymentMethod = :paymentMethod" : ""}
      ${postcode ? "AND order.postcode = :postcode" : ""}
      ${organisationId ? "AND order.organisationId = :organisationId" : ""}`;
      const variables = { year, search, search2, paymentMethod, postcode, organisationId };
      const orderCount = await this.getCount(condition, variables);
      return orderCount;
    } catch (error) {
      throw error;
    }
  }

  public compareOrders(a, b, sortField, order) {
    if (a[sortField] < b[sortField]) {
      return order === 'DESC' ? 1 : -1;
    }
    if (a[sortField] > b[sortField]) {
      return order === 'DESC' ? -1 : 1;
    }
    return 0;
  }

  public async parseOrdersStatusList(orders, sort?: SortData) {
    try {
      let resultObject = [];
      for (const key in orders) {
        const order = orders[key];
        const { organisationId, createdOn, user, postcode, id, paymentMethod } = order;
        let price = 0;
        let cost = 0;
        if(isArrayPopulated(order.sellProducts)) {
          order.sellProducts.forEach(element => {
            price += element?.SKU?.price * element?.quantity;
            cost += element?.SKU?.cost * element?.quantity;
          });
        }
        const paid = order.orderGroup ? order.orderGroup.total:0;
        const netProfit = price - cost;
        const organisationService = new OrganisationService();
        const organisation = await organisationService.findById(organisationId);
        resultObject = [...resultObject, {
          date: createdOn,
          name: `${user.firstName} ${user.lastName}`,
          affiliate: organisation.name,
          postcode,
          id,
          paid,
          netProfit,
          paymentMethod,
        }];
      }
      let result = resultObject;
      if (sort) {
        result = resultObject.sort((a, b) => this.compareOrders(a, b, sort.sortBy, sort.order));
      }
      return result;
    } catch (err) {
      throw err;
    }
  }

  public async getOrganisationDetails(organisationId:number):Promise<any> {
    const organisationDetails = await this.entityManager.query('select o.name from wsa_users.organisation as o where o.id = ?',[organisationId])
    return new Promise((resolve, reject) => {
      try {
        let orgName = '';
        if(isArrayPopulated(organisationDetails)) {
          orgName = organisationDetails[0]['name'];
        }
        resolve(orgName);
      }catch(err) {
        reject(err);
      }
    });
  } 
};
