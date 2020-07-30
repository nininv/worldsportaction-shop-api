import { OrderGroup } from './../models/OrderGroup';
import { Service } from "typedi";
import BaseService from "./BaseService";

@Service()
export default class OrderGroupService extends BaseService<OrderGroup> {
    modelName(): string {
        return OrderGroup.name;
    }

    public async createOrderGroup(userId): Promise<OrderGroup> {
        try {
            const orderGroup = new OrderGroup(); 
            orderGroup.createdBy = userId;
            orderGroup.createdOn = new Date();
            orderGroup.total = 0;
            const res = await orderGroup.save();
            return res;
        } catch (error) {
            throw error;
        }
    };
};
