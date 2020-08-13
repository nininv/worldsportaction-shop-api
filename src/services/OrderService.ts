import { OrderGroup } from './../models/OrderGroup';
import { Service } from "typedi";
import { getRepository, getConnection } from "typeorm";
import BaseService from "./BaseService";
import { Order } from "../models/Order";
import UserService from './UserService';
import SellProductService from './SellProductService';
import OrganisationService from './OrganisationService';
import { SortData } from './ProductService';

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
  Paid = 'Paid',
  RefundFullAmount = 'Refund Full Amount',
  RefundPartialAmount = 'Refund Partial Amount',
  Pickedup = 'Picked up',
  Shipped = 'In Transit'
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

  public async getOrderStatusList(params: any, organisationId, paginationData, sort: SortData): Promise<OrderStatusListInterface> {
    try {
      const { product, paymentStatus, fulfilmentStatus } = params;
      const nameArray = params.search ? params.search.split(' ') : [];
      const search = nameArray[0] ? `%${nameArray[0]}%` : '%%';
      const search2 = nameArray[1] ? `%${nameArray[1]}%` : '%%';
      if (nameArray.length > 2) {
        return { ordersStatus: [], numberOfOrders: 0 }
      }
      const year = params.year && +params.year !== -1 ? `%${await this.getYear(params.year)}%` : '%%';
      const isAll = product === 'All' ? true : false;
      let orderIdsList = [];
      const condition = `user.firstName LIKE :search AND user.lastName LIKE :search2  
      AND order.createdOn LIKE :year
       ${paymentStatus && +paymentStatus !== -1 ? "AND order.paymentStatus = :paymentStatus" : ""}
       ${fulfilmentStatus && +fulfilmentStatus !== -1 ? "AND order.fulfilmentStatus = :fulfilmentStatus" : ""}
       ${!isAll ? "AND order.organisationId = :organisationId" : ""}`;
      const variables = { search, search2, paymentStatus, fulfilmentStatus, year, organisationId, orderIdsList };
      const result = await this.getMany(condition, variables, paginationData, sort.sortBy ? sort : { sortBy: 'createdOn', order: 'DESC' });
      const ordersStatus = result.map(order => {
        const products = this.calculateOrder(order);
        return {
          orderId: order.id,
          date: order.createdOn,
          customer: `${order.user.firstName} ${order.user.lastName}`,
          products,
          paymentStatus: order.paymentStatus,
          fulfilmentStatus: order.fulfilmentStatus,
          total: order.orderGroup.total
        }
      });
      let ordersList: IOrderStatus[] = ordersStatus;
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
        .leftJoinAndSelect("sellProduct.SKU", "SKU")
        .leftJoinAndSelect("order.pickUpAddress", "address")
        .leftJoinAndSelect("order.user", "user")
        .where("order.id = :id", { id })
        .getOne();
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
    } catch (err) {
      throw err;
    }
  }

  public async updateOrderStatus(data: any, userId: number): Promise<Order> {
    try {
      const { orderId, action, amount } = data;

      if (action === Action.Paid) {
        await getRepository(Order)
          .update(orderId, { paymentStatus: action, updatedBy: userId });
      }
      if (action === Action.RefundFullAmount) {
        await getRepository(Order)
          .update(orderId, { paymentStatus: 'Refunded', updatedBy: userId });
      }
      if (action === Action.RefundPartialAmount && amount) {
        await getRepository(Order)
          .update(orderId, { paymentStatus: 'Partially Refunded', refundedAmount: amount, updatedBy: userId });
      }
      if (action === Action.Pickedup) {
        await getRepository(Order)
          .update(orderId, { fulfilmentStatus: 'Completed', updatedBy: userId });
      }
      if (action === Action.Shipped) {
        await getRepository(Order)
          .update(orderId, { fulfilmentStatus: 'In Transit', updatedBy: userId });
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
      const { paymentMethod, postcode, organisationId } = params;
      const searchArray = params.search ? params.search.split(' ') : [];
      if (searchArray.length > 2) {
        return { numberOfOrders: 0, valueOfOrders: 0, orders: [] }
      }
      const search = searchArray[0] ? `%${searchArray[0]}%` : '%%';
      const search2 = searchArray[1] ? `%${searchArray[1]}%` : '%%';
      const year = params.year && +params.year !== -1 ? `%${await this.getYear(params.year)}%` : '%%';

      const variables = {
        year,
        search,
        search2,
        paymentMethod,
        postcode,
        organisationId
      };
      const condition = `${searchArray.length === 2
        ? "( user.firstName LIKE :search AND user.lastName LIKE :search2 )"
        : "( user.firstName LIKE :search OR user.lastName LIKE :search OR order.id LIKE :search )"}
       AND order.createdOn LIKE :year
      ${organisationId ? " AND order.organisationId = :organisationId" : ""}   
      ${paymentMethod && +paymentMethod !== -1 ? "AND order.paymentMethod = :paymentMethod" : ""}
      ${postcode ? "AND order.postcode = :postcode" : ""}
    `;
      const orders = await this.getMany(condition, variables, { offset, limit }, sort);
      const numberOfOrders = await this.getCount(
        condition,
        variables
      );

      const parsedOrders = await this.parseOrdersStatusList(orders, sort && sort.sortBy && sort.sortBy === 'netProfit' ? sort : null);
      return { numberOfOrders, valueOfOrders: 100, orders: parsedOrders };
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
        .orderBy(sort && sort.sortBy && sort.sortBy !== 'netProfit' && sort.sortBy !== 'products' && sort.sortBy !== 'customer'
          ? sort.sortBy !== 'paid' && sort.sortBy !== 'total'
            ? `order.${sort.sortBy}`
            : `orderGroup.total`
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
        order.sellProducts.forEach(element => {
          price += element.SKU.price * element.quantity;
          cost += element.SKU.cost * element.quantity;
        });
        const paid = order.orderGroup.total;
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
};
