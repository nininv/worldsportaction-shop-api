import { Service } from "typedi";
import { getRepository, getConnection } from "typeorm";
import axios from 'axios';
import BaseService from "./BaseService";
import { Order } from "../models/Order";
import UserService from './UserService';
import SellProductService from './SellProductService';
import OrganisationService from './OrganisationService';
import { SellProduct } from '../models/SellProduct';

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

  public async createBooking(): Promise<any> {
    try {
    const response = await axios.post('https://private-anon-1b9cd504fb-transdirectapiv4.apiary-mock.com/api/bookings/v4', {
    declared_value: "1000.00",
    referrer: "API",
    requesting_site: "http://www.woocommerce.com.au",
    tailgate_pickup: true,
    tailgate_delivery: true,
    items: [
        {
            weight: "38.63",          
            height: "0.25",           
            width: "1.65",            
            length: "3.32",           
            quantity: 1,              
            description: "carton"     
        },
        {
            weight: "39.63",          
            height: "1.25",           
            width: "2.65",            
            length: "4.32",           
            quantity: 2,              
            description: "carton"     
        }
    ],
    receiver: {
        address: "216 Moggill Rd",         
        company_name: "",   
        email: "",
        name: "John Smith",
        postcode: "3000",
        phone: 123456789, 
        state: "",
        suburb: "MELBOURNE",
        type: "business",             
        country: "AU"                 
    },
    sender: {
      id: 1500837,
      address: "21 Kirksway Place",
      company_name: "",
      email: "",
      name: "",
      postcode: "2000",
      phone: "123456789",
      state: "",
      suburb: "SYDNEY",
      type: "business",
      country: "AU"
    },
    });
      return response;
    } catch (err) {
      throw err;
    }
  }

  public async createOrder(data: any, userId: number): Promise<Order> {
    try {
      const userService = new UserService();
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
      const order = await getRepository(Order).save(newOrder);
      for (const iterator of data.sellProducts) {
        const sellProduct = await SellProduct.findOne(iterator);
        sellProduct.order = order;
        await sellProduct.save();
      }
      return order;
    } catch (err) {
      throw err;
    }
  }

  public async parseSellProducts(sellProducts): Promise<any> {
    try {
      let items = [];
      for (const iterator of sellProducts) {
        const sellProductService = new SellProductService();
        const sellProduct = await sellProductService.findSellProductrById(iterator);
        const item = {
          weight: sellProduct.product.weight,          
          height: sellProduct.product.height,           
          width: sellProduct.product.width,            
          length: sellProduct.product.length,           
          quantity: sellProduct.quantity,              
          description: "carton"     
        }
        items = [...items, item]
      }
      return items;
    } catch (err) {
      throw err;
    }
  }

  public calculateOrder(order: Order) {
    const sellProducts = order.sellProducts;
    let total = 0;
    let productsCount = 0;
    for (const iterator of sellProducts) {
      total += iterator.SKU.price * iterator.quantity;
      productsCount += iterator.quantity;
    }
    return { total, productsCount };
  }

  public async getOrderStatusList(params: any, organisationId, paginationData): Promise<OrderStatusListInterface> {
    try {
      const { product, paymentStatus, fulfilmentStatus } = params;
      const nameArray = params.name ? params.name.split(' ') : [];
      const name = nameArray[0] ? `%${nameArray[0]}%` : '%%';
      const name2 = nameArray[1] ? `%${nameArray[1]}%` : '%%';
      if (nameArray.length > 2) {

        return { ordersStatus: [], numberOfOrders: 0 }
      }
      const year = params.year ? `%${params.year}%` : '%%';
      const isAll = product === 'All' ? true : false;
      let orderIdsList = [];
      if (!isAll) {
        const orderList = await getConnection()
          .getRepository(Order)
          .createQueryBuilder("order")
          .leftJoinAndSelect("order.sellProducts", "sellProduct")
          .leftJoinAndSelect("sellProduct.product", "product", `product.createByOrg = :organisationId`, { organisationId })
          .leftJoinAndSelect("sellProduct.SKU", "SKU")
          .leftJoinAndSelect("order.user", "user")
          .where(`user.firstName LIKE :name AND user.lastName LIKE :name2
          AND order.createdOn LIKE :year
           ${paymentStatus ? "AND order.paymentStatus = :paymentStatus" : ""}
           ${fulfilmentStatus ? "AND order.fulfilmentStatus = :fulfilmentStatus" : ""}
           `,
            { name, name2, paymentStatus, fulfilmentStatus, year, organisationId })
          .orderBy("order.createdOn", "DESC")
          .getMany();
        orderList.forEach(order => {
          const newOrder = order.sellProducts.filter(sP => sP.product)
          if (newOrder.length > 0) {
            orderIdsList = [...orderIdsList, order.id];
          }
        });
      }
      if (orderIdsList.length === 0) {
        return { ordersStatus:[], numberOfOrders: 0 }
      }
      const condition = `user.firstName LIKE :name AND user.lastName LIKE :name2  
      AND order.createdOn LIKE :year
       ${paymentStatus ? "AND order.paymentStatus = :paymentStatus" : ""}
       ${fulfilmentStatus ? "AND order.fulfilmentStatus = :fulfilmentStatus" : ""}
       ${!isAll ? "AND order.id IN (:...orderIdsList)" : ""}`;
      const variables = { name, name2, paymentStatus, fulfilmentStatus, year, organisationId, orderIdsList };
      const result = await this.getMany(condition, variables, paginationData, { sortBy: 'createdOn', order: 'DESC' });
      const ordersStatus = result.map(order => {
        const { total, productsCount } = this.calculateOrder(order);
        return {
          orderId: order.id,
          date: order.createdOn,
          customer: `${order.user.firstName} ${order.user.lastName}`,
          products: productsCount,
          paymentStatus: order.paymentStatus,
          fulfilmentStatus: order.fulfilmentStatus,
          total: total
        }
      });
      const numberOfOrders = await this.getCount(condition, { name, name2, paymentStatus, fulfilmentStatus, year, organisationId, orderIdsList });
      return { ordersStatus, numberOfOrders };
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

  public async getOrdersSummary(params, sort, offset, limit): Promise<OrderSummaryInterface> {
    try {
      const { paymentMethod, postcode, organisationId } = params;
      const searchArray = params.search ? params.search.split(' ') : [];
      if (searchArray.length > 2) {
        return { numberOfOrders: 0, valueOfOrders: 0, orders: [] }
      }
      const search = searchArray[0] ? `%${searchArray[0]}%` : '%%';
      const search2 = searchArray[1] ? `%${searchArray[1]}%` : '%%';
      const year = params.year ? `%${params.year}%` : '%%';
      const variables = { year, search, search2, paymentMethod, postcode, organisationId };
      const condition = `${searchArray.length === 2
        ? "( user.firstName LIKE :search AND user.lastName LIKE :search2 )"
        : "( user.firstName LIKE :search OR user.lastName LIKE :search OR order.id LIKE :search )"}
       AND order.createdOn LIKE :year
      ${paymentMethod ? "AND order.paymentMethod = :paymentMethod" : ""}
      ${postcode ? "AND order.postcode = :postcode" : ""}
      ${organisationId ? "AND order.organisationId = :organisationId" : ""}`;
      const orders = await this.getMany(condition, variables, { offset, limit }, sort);
      const numberOfOrders = await this.getCount(condition, { search, search2, year, paymentMethod, postcode, organisationId });
      const parsedOrders = await this.parseOrdersStatusList(orders);
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
        .leftJoinAndSelect("order.sellProducts", "sellProduct")
        .leftJoinAndSelect("sellProduct.product", "product")
        .leftJoinAndSelect("sellProduct.SKU", "SKU")
        .leftJoinAndSelect("order.user", "user")
        .where(condition, variables)
        .orderBy(sort && sort.sortBy ? `order.${sort.sortBy}` : null, sort && sort.order ? sort.order : 'ASC')
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
      ${paymentMethod ? "AND order.paymentMethod = :paymentMethod" : ""}
      ${postcode ? "AND order.postcode = :postcode" : ""}
      ${organisationId ? "AND order.organisationId = :organisationId" : ""}`;
      const variables = { year, search, search2, paymentMethod, postcode, organisationId };
      const orderCount = await this.getCount(condition, variables);
      return orderCount;
    } catch (error) {
      throw error;
    }
  }

  public async parseOrdersStatusList(orders) {
    try {
      let resultObject = [];
      for (const key in orders) {
        const order = orders[key];
        const { organisationId, createdOn, user, postcode, id, total, paymentMethod } = orders[key];
        let price = 0;
        let cost = 0;
        order.sellProducts.forEach(element => {
          price += element.SKU.price * element.quantity;
          cost += element.SKU.cost * element.quantity;
        });
        const netProfit = price - cost;
        const organisationService = new OrganisationService();
        const organisation = await organisationService.findById(organisationId);
        resultObject = [...resultObject, {
          date: createdOn,
          name: `${user.firstName} ${user.lastName}`,
          affiliate: organisation.name,
          postcode,
          id,
          paid: total,
          netProfit,
          paymentMethod,
        }];
      }
      return resultObject;
    } catch (err) {
      throw err;
    }
  }
};
