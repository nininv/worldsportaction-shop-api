import { Service } from 'typedi';
import { isArrayPopulated, uuidv4 } from '../utils/Utils';
import BaseService from './BaseService';
import { Cart } from '../models/Cart';
import { SKU } from '../models/SKU';
import { Organisation } from '../models/Organisation';
import { Order } from '../models/Order';

@Service()
export default class ShopService extends BaseService<Cart> {
  modelName(): string {
    return Cart.name;
  }

  public async createNewCartRecord(userId) {
    // no cart records for this user. create new one.
    const newShopUniqueKey = uuidv4();

    const newCartRecord = new Cart();

    newCartRecord.shopUniqueKey = newShopUniqueKey;
    newCartRecord.createdBy = userId;
    newCartRecord.cartProducts = JSON.stringify({ cartProductsArray: [] });

    await this.entityManager.save(newCartRecord);

    const result = await this.entityManager.find(Cart, {
      shopUniqueKey: newShopUniqueKey,
      createdBy: userId,
    });

    return {
      cartProducts: result[0].cartProducts['cartProductsArray'],
      shopUniqueKey: result[0].shopUniqueKey,
    };
  }

  public async getCartInformation(shopUniqueKey, userId) {
    try {
      const cartRecord = await this.entityManager.findOne(Cart, { shopUniqueKey });
      if (cartRecord) {
        const sellProductRecords = await this.entityManager.query(
          `SELECT * FROM wsa_shop.sellProduct WHERE cartId = ${cartRecord.id}`,
        );

        // no records - no order - return cart
        if (sellProductRecords.length === 0) {
          const cartRecord = await this.entityManager.find(Cart, {
            shopUniqueKey,
            createdBy: userId,
          });

          const cartProductsArray = cartRecord[0].cartProducts['cartProductsArray'];

          const actualCartProducts = [];

          for (let i = 0; i < cartProductsArray.length; i++) {
            const cartProduct: any = cartProductsArray[i];

            const {
              product: { tax },
              price,
            } = await this.entityManager.findOne(SKU, {
              where: { id: cartProduct.skuId },
              relations: ['product'],
            });

            cartProduct.tax = cartProduct.quantity * tax;
            cartProduct.amount = cartProduct.quantity * price;
            cartProduct.totalAmt = cartProduct.tax + cartProduct.amount;

            actualCartProducts.push(cartProduct);
          }

          if (cartRecord.length > 0) {
            return {
              cartProducts: actualCartProducts,
              shopUniqueKey: cartRecord[0].shopUniqueKey,
              securePaymentOptions: [{ securePaymentOptionRefId: 2 }],
            };
          }
        }
        // records - completed order - return new cart
        return await this.createNewCartRecord(userId);
      } else {
        // new user - return new cart
        return await this.createNewCartRecord(userId);
      }
    } catch (err) {
      throw err;
    }
  }

  public async updateCartProducts(shopUniqueKey, cartProducts) {
    try {
      const cartRecord = await this.entityManager.findOne(Cart, { shopUniqueKey });
      if (cartRecord) {
        const sellProductRecords = await this.entityManager.query(
          `SELECT * FROM wsa_shop.sellProduct WHERE cartId = ${cartRecord.id}`,
        );

        if (sellProductRecords.length === 0) {
          const actualCartProducts = [];

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
              throw {
                message: `You can not have less than one product in your cart. Please contact the administrator`,
              };
            } else if (!inventoryTracking || availableIfOutOfStock) {
              // do nothing
            } else if (cartProduct.quantity > quantity) {
              throw {
                message: `Reached limit of ${
                  cartProduct.productName ? cartProduct.productName : 'such'
                } products in your cart. Please contact the administrator`,
              };
            } else {
              // do nothing - amount < quantity
            }

            cartProduct.tax = cartProduct.quantity * tax;
            cartProduct.amount = cartProduct.quantity * price;
            cartProduct.totalAmt = cartProduct.tax + cartProduct.amount;

            actualCartProducts.push(cartProduct);
          }

          const cartProductsJson = JSON.stringify({ cartProductsArray: actualCartProducts });

          await this.entityManager.update(
            Cart,
            { shopUniqueKey },
            { cartProducts: cartProductsJson },
          );

          return {
            cartProducts: actualCartProducts,
            shopUniqueKey: shopUniqueKey,
            securePaymentOptions: [{ securePaymentOptionRefId: 2 }],
          };
        }
        throw { message: 'Can not update cart now. Please contact the administrator' };
      } else {
        throw { message: 'There is no cart with this shopUniqueKey' };
      }
    } catch (err) {
      throw err;
    }
  }

  private async getStateName(stateRefId): Promise<string> {
    try {
      let state = null;
      const result = await this.entityManager.query(
        `select name from wsa_common.reference 
         where id = ? and referenceGroupId = 37`,
        [stateRefId],
      );

      if (isArrayPopulated(result)) {
        let reference = result.find(x => x);
        state = reference.name;

        console.log('State::' + state);
      }

      return state;
    } catch (error) {
      throw error;
    }
  }

  public async getInvoice({ shopUniqueKey }) {
    const {
      cartProducts: { total, cartProductsArray },
      id,
    }: any = await this.entityManager.findOne(Cart, { shopUniqueKey });

    if (total && cartProductsArray) {
      const sellProducts = await this.entityManager.query(
        `select s.* from wsa_shop.sellProduct s where cartid = ?`,
        [id],
      );
      if (isArrayPopulated(sellProducts)) {
        const updatedCartProductsArray = [];

        for (let i = 0; i < cartProductsArray.length; i++) {
          const orderId = sellProducts[i].orderId;
          const order = await this.entityManager.findOne(Order, { id: orderId });
          const cartProduct = { ...cartProductsArray[i] };

          const organisationRecord = await this.entityManager.findOne(Organisation, {
            organisationUniqueKey: cartProduct.organisationId,
          });
          const organisationId = organisationRecord.id;

          const organisationList = [organisationId];
          let organisationString = organisationList.join(',');

          let result = await this.entityManager.query(
            'call wsa_shop.usp_registration_pickupaddress(?)',
            [organisationString],
          );

          const pickUpAddresses = result[0];
          const pickUpAddress = pickUpAddresses.pop();
          cartProduct.organisationName = organisationRecord.name;
          if (order) {
            cartProduct.deliveryType = order.deliveryType;
            if (order.deliveryType === 'pickup') {
              cartProduct.address = pickUpAddress
                ? pickUpAddress.address
                : organisationRecord.street1 +
                  ' ' +
                  (organisationRecord.street2 ? organisationRecord.street2 : '');
              cartProduct.suburb = pickUpAddress ? pickUpAddress.suburb : organisationRecord.suburb;
              cartProduct.state = pickUpAddress
                ? pickUpAddress.state
                : await this.getStateName(organisationRecord.stateRefId);
              cartProduct.postcode = pickUpAddress
                ? pickUpAddress.postcode
                : organisationRecord.postalCode;
              cartProduct.pickupInstruction = pickUpAddress ? pickUpAddress.pickupInstruction : '';
            } else {
              cartProduct.address = order.address;
              cartProduct.suburb = order.suburb;
              cartProduct.state = order.state;
              cartProduct.postcode = order.postcode;
            }
          }
          updatedCartProductsArray.push(cartProduct);
        }

        return {
          total,
          shopProducts: updatedCartProductsArray,
        };
      }
    }
    throw { message: `There is no cart records with such key. Please contact the administrator` };
  }
}
