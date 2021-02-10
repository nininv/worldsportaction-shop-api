import { Service } from "typedi";
import BaseService from "./BaseService";
import { Cart } from "../models/Cart";
import {SKU} from "../models/SKU";


@Service()
export default class PaymentService extends BaseService<Cart> {
    modelName(): string {
        return Cart.name;
    }

    public async throwError(message) {
        throw { message }
    }

    public async paymentValidate(payload) {

        // get this info from front on submit payments
            payload = {
                cartProducts: [
                    {
                        amount: 80,
                        inventoryTracking: 0,
                        optionName: null,
                        organisationId: "406be94a-a748-47cc-8de6-69d8e05ea00f",
                        productId: 171,
                        productImgUrl: "https://storage.googleapis.com/world-sport-action-dev-c1019.appspot.com/product/photo/1608962733703_IMG_7906.JPG",
                        productName: "Asn shirt",
                        quantity: 1,
                        skuId: 482,
                        tax: 0,
                        totalAmt: 80,
                        variantId: null,
                        variantName: null,
                        variantOptionId: null
                    }
                ],
                total: {
                    gst: 0,
                    total: 80,
                    shipping: 0,
                    subTotal: 80,
                    targetValue: 82.7,
                    transactionFee: 2.7
                },
                shopUniqueKey: "4f75417f-1b97-4e5a-9b0b-f291ff9df8fc",
                paymentType:"card",
                token: {
                    id:"tok_1IIwbQEnewRwSTgnV2p51L3O"
                }
            }



        const {cartProducts, shopUniqueKey, total: {total, gst}} = payload;
        console.log('='.repeat(20));
        console.log(total);
        console.log('='.repeat(20));

        const cartRecord = await this.entityManager.findOne(Cart, {shopUniqueKey});

        let totalCartCost = 0;
        let gstTotal = 0;

        if (cartRecord) {

            for(let i = 0; i < cartProducts.length; i++) {
                const cartProduct:any = cartProducts[i];

                const { product: {availableIfOutOfStock, inventoryTracking, tax}, quantity, price } = await this.entityManager.findOne(SKU, {
                    where: { id: cartProduct.skuId },
                    relations: ['product']
                });

                if (cartProduct.quantity <= 0) {
                    await this.throwError(`You can not have less than one product in your cart. Please contact the administrator`);
                } else if (!inventoryTracking || availableIfOutOfStock) {
                    // do nothing
                } else if (cartProduct.quantity > quantity) {
                    await this.throwError(`Reached limit of ${cartProduct.productName ? cartProduct.productName : 'such'} products in your cart. Please contact the administrator` );
                } else {
                    // do nothing - amount < quantity
                }

                cartProduct.tax !== cartProduct.quantity * tax && await this.throwError('Incorrect product data');
                cartProduct.amount !== cartProduct.quantity * price && await this.throwError('Incorrect product data');
                cartProduct.totalAmt !== tax + cartProduct.amount && await this.throwError('Incorrect product data');

                totalCartCost += cartProduct.amount;
                gstTotal += cartProduct.tax;

            }

            total !== totalCartCost && await this.throwError('Incorrect product data');
            gst !== gstTotal && await this.throwError('Incorrect product data');


        } else {
            await this.throwError(`No such items in the cart.`);
        }

        const totalJson = JSON.stringify({cartProductsArray: cartProducts, total: payload.total});

        await this.entityManager.update(Cart, {shopUniqueKey}, {cartProducts: totalJson});

        payload.cart = cartRecord;
        return payload
    }
}
