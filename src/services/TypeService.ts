import { Service } from "typedi";
import { getConnection, getRepository } from "typeorm";
import BaseService from "./BaseService";
import { Type } from "../models/Type";

@Service()
export default class TypeService extends BaseService<Type> {
    modelName(): string {
        return Type.name;
    }

    public async getList(): Promise<Type[]> {
        try {
            const list = await getRepository(Type).find();
            return list;
        } catch (err) {
            throw err;
        }
    }

    public async saveType(typeName, userId): Promise<Type> {
        try {
            let productType = new Type();
            const existingType = await getRepository(Type).findOne({ typeName });
            if (!existingType) {
                const newType = new Type();
                newType.typeName = typeName;
                newType.createdBy = userId;
                newType.createdOn = new Date();
                productType = await getConnection().manager.save(newType);
            } else {
                productType = existingType;
            }
            return productType;
        } catch (err) {
            throw err;
        }
    }
}