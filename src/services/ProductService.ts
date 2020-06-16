import { Service } from "typedi";
import BaseService from "./BaseService";
import { Product } from "../models/Product";

@Service()
export default class ProductService extends BaseService<Product> {

    modelName(): string {
        return Product.name;
    }

    public async getProduct(filter, sort, offset) {
        try {
            const query = await this.entityManager.query(`SELECT productName, image, price, typeId, variantName
            FROM wsa_shop.product 
            WHERE quantity > 0 AND productName LIKE ? AND typeId LIKE ? ${sort.sorterBy ? `ORDER BY ${sort.sorterBy} ${sort.order} ` : ''} 
            LIMIT ${offset ? offset : 0}, ${8}`,
                [filter.productName, filter.typeId]);
            const count = await this.entityManager.query(`SELECT COUNT (*) FROM wsa_shop.product 
            WHERE quantity > 0 AND  productName LIKE ? AND typeId LIKE ?`,
                [filter.productName, filter.typeId]);
            return { totalCount: count[0]['COUNT (*)'], query };
        }
        catch (error) {
        }
    }

    public async addProduct(product) {
        try {
            const a = this.entityManager.create(Product, {
                "description": "Wonderful product",
                "productName": "Wonderful",

            });
            return a;
        }
        catch (error) {

        }
    }
}
