import { Service } from "typedi";
import { uuidv4 } from '../utils/Utils';
import BaseService from "./BaseService";
import { Cart } from "../models/Cart";
import { SKU } from "../models/SKU";

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
        newCartRecord.cartProducts = JSON.stringify({cartProductsArray: []});

        await this.entityManager.save(newCartRecord);

        const result = await this.entityManager.find(Cart, {shopUniqueKey: newShopUniqueKey, createdBy: userId});

        return {
            cartProducts: result[0].cartProducts["cartProductsArray"],
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
                    const cartRecord = await this.entityManager.find(Cart, {shopUniqueKey, createdBy: userId});

                    const cartProductsArray = cartRecord[0].cartProducts['cartProductsArray'];

                    const actualCartProducts = [];

                    for(let i = 0; i < cartProductsArray.length; i++) {
                        const cartProduct:any = cartProductsArray[i];

                        const {product: {tax}, price} = await this.entityManager.findOne(SKU, {
                            where: {id: cartProduct.skuId },
                            relations: ['product']
                        });

                        cartProduct.tax = cartProduct.quantity * tax;
                        cartProduct.amount = cartProduct.quantity * price;
                        cartProduct.totalAmt = tax + cartProduct.amount;

                        actualCartProducts.push(cartProduct);
                    }

                    if (cartRecord.length > 0) {
                        return {
                            cartProducts: actualCartProducts,
                            shopUniqueKey: cartRecord[0].shopUniqueKey,
                            securePaymentOptions: [{securePaymentOptionRefId: 2}]
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

                    const actualCartProducts = [];

                    for(let i = 0; i < cartProducts.length; i++) {
                        const cartProduct:any = cartProducts[i];

                        const { product: {availableIfOutOfStock, inventoryTracking, tax}, quantity, price } = await this.entityManager.findOne(SKU, {
                            where: { id: cartProduct.skuId },
                            relations: ['product']
                        });

                        if (cartProduct.quantity <= 0) {
                            throw { message: `You can not have less than one product in your cart. Please contact the administrator` };
                        } else if (!inventoryTracking || availableIfOutOfStock) {
                            // do nothing
                        } else if (cartProduct.quantity > quantity) {
                            throw { message: `Reached limit of ${cartProduct.productName ? cartProduct.productName : 'such'} products in your cart. Please contact the administrator` };
                        } else {
                            // do nothing - amount < quantity
                        }

                        cartProduct.tax = cartProduct.quantity * tax;
                        cartProduct.amount = cartProduct.quantity * price;
                        cartProduct.totalAmt = tax + cartProduct.amount;

                        actualCartProducts.push(cartProduct);
                    }

                    const cartProductsJson = JSON.stringify({cartProductsArray: actualCartProducts});

                    await this.entityManager.update(Cart, {shopUniqueKey}, {cartProducts: cartProductsJson});

                    return {
                        cartProducts: actualCartProducts,
                        shopUniqueKey: shopUniqueKey,
                        securePaymentOptions: [{securePaymentOptionRefId: 2}]
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
