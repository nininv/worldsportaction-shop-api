import { Service } from 'typedi';
import BaseService from './BaseService';
import { Cart } from '../models/Cart';
import { SKU } from '../models/SKU';

@Service()
export default class PaymentService extends BaseService<Cart> {
  modelName(): string {
    return Cart.name;
  }

  public async throwError(message) {
    throw { message };
  }

  public async paymentValidate(payload) {
    const {
      shopUniqueKey,
      payload: {
        cartProducts,
        total: { subTotal, gst, targetValue, total },
        total: totalObj,
      },
    } = payload;
    const cartRecord = await this.entityManager.findOne(Cart, { shopUniqueKey });

    let totalCartCost = 0;
    let gstTotal = 0;

    if (cartRecord) {
      for (let i = 0; i < cartProducts.length; i++) {
        const cartProduct: any = cartProducts[i];

        const {
          product: { availableIfOutOfStock, inventoryTracking, tax },
          quantity,
          price,
        } = await this.entityManager.findOne(SKU, {
          where: { id: cartProduct.skuId },
          relations: ['product'],
        });

        if (cartProduct.quantity <= 0) {
          await this.throwError(
            `You can not have less than one product in your cart. Please contact the administrator`,
          );
        } else if (!inventoryTracking || availableIfOutOfStock) {
          // do nothing
        } else if (cartProduct.quantity > quantity) {
          await this.throwError(
            `Reached limit of ${
              cartProduct.productName ? cartProduct.productName : 'such'
            } products in your cart. Please contact the administrator`,
          );
        } else {
          // do nothing - amount < quantity
        }

        cartProduct.tax !== cartProduct.quantity * tax &&
          (await this.throwError('Incorrect product data'));
        cartProduct.amount !== cartProduct.quantity * price &&
          (await this.throwError('Incorrect product data'));
        cartProduct.totalAmt !== cartProduct.tax + cartProduct.amount &&
          (await this.throwError('Incorrect product data'));

        totalCartCost += cartProduct.amount;
        gstTotal += cartProduct.tax;
      }

      subTotal !== totalCartCost && (await this.throwError('Incorrect product data'));
      gst !== gstTotal && (await this.throwError('Incorrect product data'));
      gst + subTotal !== total && (await this.throwError('Incorrect product data'));
      gst + subTotal > targetValue && (await this.throwError('Incorrect product data'));
    } else {
      await this.throwError(`No such items in the cart.`);
    }

    const totalJson = JSON.stringify({ cartProductsArray: cartProducts, total: totalObj });

    await this.entityManager.update(Cart, { shopUniqueKey }, { cartProducts: totalJson });

    payload.cart = cartRecord;
    return payload;
  }
}
