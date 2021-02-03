// import { SellProduct } from './../models/SellProduct';
import { Service } from "typedi";
import { getRepository, getConnection } from "typeorm";
import BaseService from "./BaseService";
import { Cart } from "../models/Cart";
import {logger} from "../logger";

@Service()
export default class ShopService extends BaseService<Cart> {
    modelName(): string {
        return Cart.name;
    }

    public async getCartInformation(shopUniqueKey, userId) {
        try {

            const result = await this.entityManager.query(`SELECT * FROM wsa_shop.cart WHERE shopUniqueKey = "${shopUniqueKey}" AND createdBy = ${userId}`);

            console.log('='.repeat(20));
            // console.log(userId);
            // console.log(result[0].cartProducts);
            // console.log(JSON.stringify(result[0].cartProducts));
            // console.log(JSON.stringify(result));
            console.log('='.repeat(20));

            if (result.length > 0) {
                console.log('cartProducts here');
                return result[0].cartProducts
            }

            console.log('no cart record, create new for this user');
            // const result2 = await this. entityManager.query(`INSERT INTO wsa_shop.cart `)
            return 'empty'

        } catch (err) {
            throw err;
        }
    }
}