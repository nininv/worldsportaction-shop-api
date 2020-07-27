import { SKU } from './../models/SKU';
import { Service } from "typedi";
import { getRepository, getConnection } from "typeorm";
import BaseService from "./BaseService";
import { Order } from "../models/Order";
import ProductService from "./ProductService";
import UserService from './UserService';
import OrganisationService from './OrganisationService';
import { SellProduct } from '../models/SellProduct';

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
      let total = 0;
      for (const key in data.products) {
        const skuId = data.products[key].skuId;
        const sku = await SKU.findOne(skuId);
        total += sku.price;
      }
      const userService = new UserService();
      const user = await userService.findUserById.call(this, userId);
      const newOrder = new Order();
      newOrder.name = `${user.firstName}  ${user.lastName}`;
      newOrder.paymentStatus = data.paymentStatus;
      newOrder.productsCount = data.products.length;
      newOrder.paymentMethod = data.paymentMethod;
      newOrder.total = total;
      newOrder.fulfilmentStatus = data.fulfilmentStatus;
      newOrder.organisationId = data.organisationId;
      newOrder.postcode = data.postcode;
      newOrder.createdBy = userId;
      newOrder.createdOn = new Date();
      const order = await getRepository(Order).save(newOrder);

      const productService = new ProductService();
      for (const key in data.products) {
        const productId = data.products[key].productId;
        const product: any = await productService.getProductById(productId);
        if (!product) {
          const error = new Error(`product with this id does'nt exist`);
          throw error;
        }
        const newSellProduct = new SellProduct();
        newSellProduct.createdBy = userId;
        newSellProduct.createdOn = new Date();
        newSellProduct.quantity = 1;
        newSellProduct.product = product;
        newSellProduct.order = order;
        const savedSellProduct = await getRepository(SellProduct).save(newSellProduct)
        const skuId = data.products[key].skuId;
        const sku = await SKU.findOne(skuId);
        if (!sku) {
          const error = new Error(`SKU with this id does'nt exist`);
          throw error;
        }
        await this.addToRelation({ model: "SKU", property: "sellProduct" }, sku.id, savedSellProduct);
      }
      return order;
    } catch (err) {
      throw err;
    }
  }

  public async getOrderStatusList(params: any, organisationId): Promise<any[]> {
    try {
      const { product, paymentStatus, fulfilmentStatus } = params;
      const name = params.name ? `%${params.name}%` : '%%';
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
          .where(`order.name LIKE :name  
          AND order.createdOn LIKE :year
           ${paymentStatus ? "AND order.paymentStatus = :paymentStatus" : ""}
           ${fulfilmentStatus ? "AND order.fulfilmentStatus = :fulfilmentStatus" : ""}
           `,
            { name, paymentStatus, fulfilmentStatus, year, organisationId })
          .orderBy("order.createdOn", "DESC")
          .getMany();
        orderList.forEach(order => {
          const newOrder = order.sellProducts.filter(sP => sP.product)
          if (newOrder.length > 0) {
            orderIdsList = [...orderIdsList, order.id];
          }
        });
      }
      let result = await getConnection()
        .getRepository(Order)
        .createQueryBuilder("order")
        .leftJoinAndSelect("order.sellProducts", "sellProduct")
        .leftJoinAndSelect("sellProduct.product", "product")
        .leftJoinAndSelect("sellProduct.SKU", "SKU")
        .where(`order.name LIKE :name  
          AND order.createdOn LIKE :year
           ${paymentStatus ? "AND order.paymentStatus = :paymentStatus" : ""}
           ${fulfilmentStatus ? "AND order.fulfilmentStatus = :fulfilmentStatus" : ""}
            ${!isAll ? "AND order.id IN (:...orderIdsList)" : ""}`,
          { name, paymentStatus, fulfilmentStatus, year, organisationId, orderIdsList })
        .orderBy("order.createdOn", "DESC")
        .getMany();
      const ordersStatus = result.map(order => {
        return {
          orderId: order.id,
          date: order.createdOn,
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
  //////////////////////////////sku
  public async getOrderById(id): Promise<any> {
    try {
      const order = await getConnection()
        .getRepository(Order)
        .createQueryBuilder("order")
        .leftJoinAndSelect("order.sellProducts", "sellProduct")
        .leftJoinAndSelect("sellProduct.product", "product")
        .leftJoinAndSelect("sellProduct.SKU", "SKU")
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

  public async getOrdersSummary(params, sort, offset, limit): Promise<any> {
    try {
      const { orderNumber, paymentMethod, postcode, organisationId } = params;
      const name = params.name ? `%${params.name}%` : '%%';
      const year = params.year ? `%${params.year}%` : '%%';
      const orders = await getConnection()
        .getRepository(Order)
        .createQueryBuilder("order")
        .leftJoinAndSelect("order.sellProducts", "sellProduct")
        .leftJoinAndSelect("sellProduct.product", "product")
        .leftJoinAndSelect("sellProduct.SKU", "SKU")
        .where(`order.name LIKE :name AND order.createdOn LIKE :year
        ${orderNumber ? "AND order.id = :orderNumber" : ""}
        ${paymentMethod ? "AND order.paymentMethod = :paymentMethod" : ""}
        ${postcode ? "AND order.postcode = :postcode" : ""}
        ${organisationId ? "AND order.organisationId = :organisationId" : ""}`,
          { name, year, orderNumber, paymentMethod, postcode, organisationId })
        .orderBy(sort.sortBy ? `order.${sort.sortBy}` : null, sort.order)
        .skip(offset)
        .take(limit)
        .getMany();
      const numberOfOrders = await this.getOrderCount(name, orderNumber, year, paymentMethod, postcode, organisationId);
      const parsedOrders = await this.parseOrdersStatusList(orders);
      return { numberOfOrders, valueOfOrders: 100, orders: parsedOrders };
    } catch (err) {
      throw err;
    }
  }

  public async getOrderCount(name, orderNumber, year, paymentMethod, postcode, organisationId): Promise<number> {
    try {
      const orderCount = await getConnection()
        .getRepository(Order)
        .createQueryBuilder("order")
        .leftJoinAndSelect("order.sellProducts", "sellProduct")
        .leftJoinAndSelect("sellProduct.product", "product")
        .leftJoinAndSelect("sellProduct.SKU", "SKU")
        .where(`order.name LIKE :name AND order.createdOn LIKE :year
        ${orderNumber ? "AND order.id = :orderNumber" : ""}
        ${paymentMethod ? "AND order.paymentMethod = :paymentMethod" : ""}
        ${postcode ? "AND order.postcode = :postcode" : ""}
        ${organisationId ? "AND order.organisationId = :organisationId" : ""}`,
          { name, year, orderNumber, paymentMethod, postcode, organisationId })
        .getCount();
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
        const { organisationId, createdOn, name, postcode, id, total, paymentMethod } = orders[key];
        let price = 0;
        let cost = 0;
        order.sellProducts.forEach(element => {
          price += element.price;
          cost += element.cost;
        });
        const netProfit = price - cost;
        const organisationService = new OrganisationService();
        const organisation = await organisationService.findById(organisationId);
        resultObject = [...resultObject, {
          date: createdOn,
          name,
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
