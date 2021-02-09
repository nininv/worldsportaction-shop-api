import { Service } from "typedi";
import Stripe from 'stripe';
import BaseService from "./BaseService";
import { Cart } from "../models/Cart";
import {SKU} from "../models/SKU";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, { apiVersion: '2020-08-27' });

@Service()
export default class PaymentService extends BaseService<Cart> {
    modelName(): string {
        return Cart.name;
    }

    public async throwError(message) {
        throw { message }
    }

    public async paymentSubmit(payload) {

        // get this info from front on submit payments
        // requestBody = {
        //     payload: {
        //         cartProducts: [
        //             {
        //                 amount: 80,
        //                 inventoryTracking: 1,
        //                 optionName: "Red",
        //                 organisationId: "0b3ae01e-885d-40ef-9a07-a94c870133e1",
        //                 productId: 37,
        //                 productImgUrl: "https://storage.googleapis.com/world-sport-action.appspot.com/product/photo/1594980883866_images.jpeg",
        //                 productName: "Check Pro Club Aff",
        //                 quantity: 1,
        //                 skuId: 173,
        //                 tax: 0,
        //                 totalAmt: 80,
        //                 variantId: 66,
        //                 variantName: "Color",
        //                 variantOptionId: 136
        //             }
        //         ],
        //         total: {
        //             gst: 0,
        //             total: 80,
        //             shipping: 0,
        //             subTotal: 80,
        //             targetValue: 82.7,
        //             transactionFee: 2.7
        //         },
        //         shopUniqueKey: "4f75417f-1b97-4e5a-9b0b-f291ff9df8fc",
        //         paymentType:"card",
        //         token: {
        //             id:"tok_1IIwbQEnewRwSTgnV2p51L3O"
        //         }
        //     }
        //
        // }

        const {cartProducts, total: {total, gst}} = payload;

        const cartRecord = await this.entityManager.findOne(Cart, {shopUniqueKey: payload.shopUniqueKey});

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


        return {
            payload
        }


    }
}