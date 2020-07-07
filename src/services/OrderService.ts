import { Service } from "typedi";
import { getRepository, getConnection } from "typeorm";
import BaseService from "./BaseService";
import { Order } from "../models/Order";
import ProductService from "./ProductService";

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

  public async getOrderList(params: any): Promise<Order[]> {
    try {
      const { product, paymentStatus, fulfilmentStatus } = params;
      const name = `%${params.name}%`;
      const year = `%${params.year}%`;
      let orderList = [];
      if (Object.keys(params).length > 0) {
        orderList = await getConnection()
          .getRepository(Order)
          .createQueryBuilder("order")
          .where(`order.name LIKE :name OR order.paymentStatus = :paymentStatus OR 
            fulfilmentStatus = :fulfilmentStatus OR order.createdOn LIKE :year`, { name, paymentStatus, fulfilmentStatus, year })
          .getMany()
      } else {
        orderList = await getRepository(Order).find();
      }

      return orderList;
    } catch (err) {
      throw err;
    }
  }
};