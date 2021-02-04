import { Service } from "typedi";
import { uuidv4 } from '../utils/Utils';
import BaseService from "./BaseService";
import { Cart } from "../models/Cart";

@Service()
export default class ShopService extends BaseService<Cart> {
    modelName(): string {
        return Cart.name;
    }

    public async getCartInformation(shopUniqueKey, userId) {
        try {
            let result;

            result = await this.entityManager.find(Cart, {shopUniqueKey, createdBy: userId});

            if (result.length > 0) {
                return {
                    cartProducts: result[0].cartProducts,
                    shopUniqueKey: result[0].shopUniqueKey
                };
            }

            // no cart records for this user. create new one.
            const newShopUniqueKey = uuidv4();

            const newCartRecord = new Cart();

            newCartRecord.shopUniqueKey = newShopUniqueKey;
            newCartRecord.createdBy = userId;
            newCartRecord.cartProducts = JSON.stringify([]);

            await this.entityManager.save(newCartRecord);

            result = await this.entityManager.find(Cart, {shopUniqueKey: newShopUniqueKey, createdBy: userId});

            return {
                cartProducts: result[0].cartProducts,
                shopUniqueKey: result[0].shopUniqueKey
            };
        } catch (err) {
            throw err;
        }
    }

    public async updateCartProducts(shopUniqueKey, cartProducts) {
        try {
            const cartProductsJson = JSON.stringify(cartProducts);

            await this.entityManager.update(Cart, {shopUniqueKey}, {cartProducts: cartProductsJson});

            const updatedCartProducts = await this.entityManager.findOne(Cart, {shopUniqueKey});

            return {
                cartProducts: updatedCartProducts.cartProducts,
                shopUniqueKey: updatedCartProducts.shopUniqueKey
            };
        } catch (err) {
            throw err;
        }
    }
}