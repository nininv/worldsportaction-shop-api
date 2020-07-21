import { SKU } from './../models/SKU';
import { Service } from "typedi";
import { getRepository, getConnection } from "typeorm";
import BaseService from "./BaseService";
import { Order } from "../models/Order";
import ProductService from "./ProductService";
import UserService from './UserService';
import SKUService from './SKUService';

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
      const userService = new UserService();
      const user = await userService.findUserById.call(this, userId);
      const newOrder = new Order();
      newOrder.name = `${user.firstName}  ${user.lastName}`;
      newOrder.paymentStatus = data.paymentStatus;
      newOrder.productsCount = data.products.length;
      newOrder.paymentMethod = data.paymentMethod;
      newOrder.total = data.total;
      newOrder.fulfilmentStatus = data.fulfilmentStatus;
      newOrder.createdBy = userId;
      newOrder.createdOn = new Date();
      const order = await getRepository(Order).save(newOrder);
      await this.addToRelation(
        { model: "User", property: "orders" },
        userId,
        order
      );

      const productService = new ProductService();
      const skuService = new SKUService();
      for (const key in data.products) {
        const productId = data.products[key].productId;
        const product = await productService.getProductById(productId);
        if (!product) {
          const error = new Error(`product with this id does'nt exist`);
          throw error;
        }
        await this.addToRelation({ model: "Order", property: "products" }, order.id, product);
        const skuId = data.products[key].skuId;
        const sku = await SKU.findOne(skuId);
        if (!sku) {
          const error = new Error(`SKU with this id does'nt exist`);
          throw error;
        }
        await this.addToRelation({ model: "Order", property: "sku" }, order.id, sku);
      }
      return order;
    } catch (err) {
      throw err;
    }
  }

  public async getOrderList(params: any, organisationId): Promise<any[]> {
    try {
      const { product } = params;
      const name = params.name ? `%${params.name}%` : '%%';
      const year = params.year ? `%${params.year}%` : '%%';
      const paymentStatus = params.paymentStatus ? params.paymentStatus : '%%';
      const fulfilmentStatus = params.fulfilmentStatus ? params.fulfilmentStatus : '%%';
      
      let orderList = [];
      const isAll = product === 'All' ? true : false;
      if (Object.keys(params).length > 0) {
        orderList = await getConnection()
          .getRepository(Order)
          .createQueryBuilder("order")
          .where(`order.name LIKE :name 
          AND order.paymentStatus LIKE :paymentStatus 
          AND fulfilmentStatus LIKE :fulfilmentStatus AND order.createdOn LIKE :year
           ${isAll?"AND ":""} `, { name, paymentStatus, fulfilmentStatus, year })
          .orderBy("order.createdOn", "DESC")
          .getMany();
      } else {
        orderList = await getRepository(Order)
          .createQueryBuilder("order")
          .orderBy("order.createdOn", "DESC")
          .getMany();
      }
      const ordersStatus = orderList.map(order => {
        return {
          orderId: order.id,
          date: order.createdAt,
          customer: order.name,
          products: order.productsCount,
          paymentStatus: order.paymentStatus,
          fulfilmentStatus: order.fulfilmentStatus,
          total: order.total
        }
      });
      return ordersStatus;
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

  public async getOrdersSummary(params, search, sort, offset, limit): Promise<any> {
    try {
      const name = params.name ? `%${params.name}%` : '%%';
      const orderNumber = params.orderNumber ? `%${params.orderNumber}%` : '%%';
      const year = params.year ? `%${params.year}%` : '%%';
      const paymentMethod = params.paymentMethod ? params.paymentMethod : '%%';
      const postcode = params.postcode ? `%${params.postcode}%` : '%%';
      const orders = await getConnection()
        .getRepository(Order)
        .createQueryBuilder("order")
        .leftJoinAndSelect("order.products", "products")
        .leftJoinAndSelect("order.sku", "sku")
        .where(`order.name LIKE :name AND order.id LIKE :orderNumber`, { name, orderNumber })
        .andWhere(`order.createdOn LIKE :year AND order.paymentMethod LIKE :paymentMethod `,
          { year, paymentMethod })
        .orderBy(sort.sortBy ? `product.${sort.sortBy}` : null, sort.order)
        .skip(offset)
        .take(limit)
        .getMany();
      const numberOfOrders = orders.length;
      const parsedOrders = await this.parseOrdersList(orders);
      return { numberOfOrders, valueOfOrders: 100, orders: parsedOrders };
    } catch (err) {
      throw err
    }
  }

  public async parseOrdersList(orders) {
    try {
        const resultOrders = orders.map((order) => {
        let price = 0;
        let cost = 0;
        order.sku.forEach(element => {
          price += element.price;
          cost += element.cost;
        });
        const netProfit = price - cost;
        return {
          date: order.createdOn,
          name: order.name,
          affiliate: order.organisationId,
          orderId: order.id,
          paid: order.total,
          netProfit,
          paymentMethod: order.paymentMethod,
        };
      });
      return resultOrders;
    } catch (err) {
      throw err;
    }  
  }
};
