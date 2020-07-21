import { Service } from "typedi";
import { getRepository, getConnection } from "typeorm";
import BaseService from "./BaseService";
import { Cart } from "../models/Cart";

@Service()
export default class CartService extends BaseService<Cart> {
    modelName(): string {
        return Cart.name;
    }

    public async createCart(data, userId) {
        try {
            const cart = new Cart();
            cart.createdBy = userId;
            cart.createdOn = new Date().toISOString();
            //cart.userId = userId;
            const res = await getRepository(Cart).save(cart);
            return res;
        } catch (error) {
            throw error;
        }
    };

    public async getCartList() {
        try {
            const cartList = await getConnection()
                .getRepository(Cart)
                .createQueryBuilder("cart")
                .getMany();
            return cartList;
        } catch (error) {
            throw error;
        }

    };

    public async getCartById(id) {
        try {
            const cart = await getConnection()
                .getRepository(Cart)
                .createQueryBuilder("cart")
                .where("cart.id = :id", { id })
                .getOne();
            return cart;
        } catch (error) {
            throw error;
        }
    };

    public async updateCart(data, userId) {
        try {

        } catch (error) {
            throw error;
        }
    };

};
