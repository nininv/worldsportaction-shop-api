import { SellProduct } from './../models/SellProduct';
import { Service } from 'typedi';
import { getRepository, getConnection } from 'typeorm';
import BaseService from './BaseService';
import { Cart } from '../models/Cart';

@Service()
export default class CartService extends BaseService<Cart> {
  modelName(): string {
    return Cart.name;
  }

  public async createCart(userId) {
    try {
      const cart = new Cart();
      cart.sellProducts = [];
      cart.createdBy = userId;
      cart.createdOn = new Date();
      const res = await getRepository(Cart).save(cart);
      return res;
    } catch (error) {
      throw error;
    }
  }

  public async getOne(condition: string, variables): Promise<Cart> {
    try {
      const cart = await getConnection()
        .getRepository(Cart)
        .createQueryBuilder('cart')
        .leftJoinAndSelect('cart.sellProducts', 'sellProduct')
        .leftJoinAndSelect('sellProduct.product', 'product')
        .leftJoinAndSelect('sellProduct.SKU', 'SKU')
        .where(condition, variables)
        .getOne();
      return cart;
    } catch (error) {
      throw error;
    }
  }

  public async addToCart(data, newProduct, newSku, userId) {
    try {
      let skuIn = [];
      newProduct.SKU.forEach(element => {
        if (element.id === newSku.id) {
          skuIn = [...skuIn, newSku];
        }
      });
      if (skuIn.length === 0) {
        throw new Error(`Product with id: ${newProduct.id} doesn't match with skuId: ${newSku.id}`);
      }
      const condition = 'cart.createdBy = :userId';
      let cart = await this.getOne(condition, { userId });
      if (!cart) {
        cart = await this.createCart(userId);
      }
      let isNewSellProductNeeded = true;
      for (const iterator of cart.sellProducts) {
        if (iterator.product.id === newProduct.id && iterator.sku.id === newSku.id) {
          iterator.quantity += data.quantity;
          await iterator.save();
          isNewSellProductNeeded = false;
          break;
        }
      }

      if (isNewSellProductNeeded) {
        const newSellProduct = new SellProduct();
        newSellProduct.createdBy = userId;
        newSellProduct.createdOn = new Date();
        newSellProduct.quantity = data.quantity;
        newSellProduct.product = newProduct;
        newSellProduct.sku = newSku;
        cart.sellProducts = [...cart.sellProducts, newSellProduct];
        await getRepository(SellProduct).save(newSellProduct);
      }
      cart.updatedBy = userId;
      cart.updatedOn = new Date();
      const updatedCart = await cart.save();
      return updatedCart;
    } catch (error) {
      throw error;
    }
  }

  public async getCartObj(userId) {
    try {
      const cart = new Cart();
      cart.createdBy = userId;
      cart.createdOn = new Date();
      return cart;
    } catch (error) {
      throw error;
    }
  }
}
