import { Service } from "typedi";
import { getRepository, getConnection } from "typeorm";
import BaseService from "./BaseService";
import { Order } from "../models/Order";
import ProductService from "./ProductService";

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

  public async createOrder(data: any, userId: number): Promise<Order> {
    try {
      const newOrder = new Order();
      newOrder.name = data.name;
      newOrder.paymentStatus = data.paymentStatus;
      newOrder.productsCount = data.products.length;
      newOrder.paymentMethod = data.paymentMethod;
      newOrder.total = data.total;
      newOrder.fulfilmentStatus = data.fulfilmentStatus;
      newOrder.createdBy = userId;
      newOrder.createdOn = new Date();
      const order = await getRepository(Order).save(newOrder);
      const productService = new ProductService();
      for (const key in data.products) {
        const productId = data.products[key];
        const product = await productService.getProductById(productId)
        await this.addToRelation({ model: "Product", property: "orders" }, product.id, order)
      }
      return order;
    } catch (err) {
      throw err;
    }
  }

  public async getOrderList(params: any, organisationId): Promise<Order[]> {
    try {
      const { product, paymentStatus, fulfilmentStatus } = params;
      const name = `%${params.name}%`;
      const year = `%${params.year}%`;
      let orderList = [];
      const isAll = product === 'All' ? true : false;
      if (Object.keys(params).length > 0) {
        orderList = await getConnection()
          .getRepository(Order)
          .createQueryBuilder("order")
          .where(`order.name LIKE :name 
          AND order.paymentStatus = :paymentStatus 
          AND fulfilmentStatus = :fulfilmentStatus AND order.createdOn LIKE :year
           ${isAll?"AND ":""} `, { name, paymentStatus, fulfilmentStatus, year })
          .orderBy("order.createdOn", "DESC")
          .getMany();
      } else {
        orderList = await getRepository(Order)
          .createQueryBuilder("order")
          .orderBy("order.createdOn", "DESC")
          .getMany();
      }

      return orderList;
    } catch (err) {
      throw err;
    }
  }

  public async getOrderById(id): Promise<Order> {
    try {
      const order = await getConnection()
        .getRepository(Order)
        .createQueryBuilder("order")
        .leftJoinAndSelect("order.products", "products")
        .where("order.id = :id", { id })
        .getOne();
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

      const updatedOrder = await getRepository(Order).findOne(1);
      return updatedOrder;
    } catch (err) {
      throw err;
    }
  }

  public async getOrdersSummary(search, sort, offset, limit): Promise<any> {
    try {
      const orders = await getConnection()
        .getRepository(Order)
        .createQueryBuilder("order")
        .leftJoinAndSelect("order.products", "products")
        .where(`order.name LIKE :search OR order.id LIKE :search`, { search })
        .andWhere(`order.createdOn LIKE :search OR order.paymentMethod LIKE :search `,
          { search })
        .orderBy(sort.sortBy ? `product.${sort.sortBy}` : null, sort.order)
        .skip(offset)
        .take(limit)
        .getMany();

      const numberOfOrders = await this.getOrderCount(search);
      // const valueOfOrders = await this.getValueOfOrders(orders, search);
      return { numberOfOrders, valueOfOrders: 100, orders: this.parseOrdersList(orders) };
    } catch (err) {
      throw err
    }
  }

  public parseOrdersList(orders) {
    const resultOrders = orders.map((order) => {
      return {
        date: order.createdOn,
        name: order.name,
        orderId: order.id,
        paid: order.total,
        netProfit: null,
        paymentMethod: order.paymentMethod,
      };
    });
    return resultOrders;
  }

  public async getOrderCount(search: any): Promise<number> {
    try {
      const count = await getConnection()
        .getRepository(Order)
        .createQueryBuilder("order")
        .where(`order.name LIKE :search OR order.id LIKE :search`, { search })
        .andWhere(`order.createdOn LIKE :search OR order.paymentMethod LIKE :search `,
          { search })
        .getCount();
      return count;
    } catch (err) {
      throw err;
    }
  }
};
