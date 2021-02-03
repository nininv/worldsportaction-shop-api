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

            result = await this.entityManager.query(`SELECT * FROM wsa_shop.cart WHERE shopUniqueKey = "${shopUniqueKey}" AND createdBy = ${userId}`);

            if (result.length > 0) {
                return {
                    cartProducts: result[0].cartProducts,
                    shopUniqueKey: result[0].shopUniqueKey
                };
            }

            // no cart records for this user. create new one.
            const newShopUniqueKey = uuidv4();

            await this.entityManager.query(`INSERT INTO wsa_shop.cart (shopUniqueKey, createdBy) VALUES ("${newShopUniqueKey}", ${userId})`);
            result = await this.entityManager.query(`SELECT * FROM wsa_shop.cart WHERE shopUniqueKey = "${newShopUniqueKey}" AND createdBy = ${userId}`);

            return {
                cartProducts: result[0].cartProducts,
                shopUniqueKey: result[0].shopUniqueKey
            };
        } catch (err) {
            throw err;
        }
    }

    public async updateCartProducts(shopUniqueKey, cartProducts) {

        // update cartProducts. set new products instead old ones

        // return new cartProducts array

        return {
            shopUniqueKey,
            cartProducts
        }
    }
}