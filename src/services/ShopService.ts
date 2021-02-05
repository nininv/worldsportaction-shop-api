import { Service } from "typedi";
import { uuidv4 } from '../utils/Utils';
import BaseService from "./BaseService";
import { Cart } from "../models/Cart";

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
        newCartRecord.cartProducts = JSON.stringify([]);

        await this.entityManager.save(newCartRecord);

        const result = await this.entityManager.find(Cart, {shopUniqueKey: newShopUniqueKey, createdBy: userId});

        return {
            cartProducts: result[0].cartProducts,
            shopUniqueKey: result[0].shopUniqueKey
        };
    }

    public async getCartInformation(shopUniqueKey, userId) {
        try {
            const cartRecord = await this.entityManager.findOne(Cart, {shopUniqueKey});
            if (cartRecord) {

                const sellProductRecords = await this.entityManager.query(`SELECT * FROM wsa_shop.sellProduct WHERE cartId = ${cartRecord.id}`);

                // no records - no order - return cart
                if (sellProductRecords.length === 0) {
                    const result = await this.entityManager.find(Cart, {shopUniqueKey, createdBy: userId});

                    if (result.length > 0) {
                        return {
                            cartProducts: result[0].cartProducts,
                            shopUniqueKey: result[0].shopUniqueKey
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
            const cartRecord = await this.entityManager.findOne(Cart, {shopUniqueKey});
            if (cartRecord) {
                const sellProductRecords = await this.entityManager.query(`SELECT * FROM wsa_shop.sellProduct WHERE cartId = ${cartRecord.id}`);

                if (sellProductRecords.length === 0) {
                    const cartProductsJson = JSON.stringify(cartProducts);

                    await this.entityManager.update(Cart, {shopUniqueKey}, {cartProducts: cartProductsJson});

                    const updatedCartProducts = await this.entityManager.findOne(Cart, {shopUniqueKey});
                    return {
                        cartProducts: updatedCartProducts.cartProducts,
                        shopUniqueKey: updatedCartProducts.shopUniqueKey
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
}