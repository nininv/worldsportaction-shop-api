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
            const list = await getRepository(Type).find({ where: { isDeleted: 0 } });
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

    public async ChangeType(types: any[], productId: number, userId): Promise<Type[]> {
        try {
            let updatedTypes = [];
            for (let index in types) {
                const { id, typeName, remove } = types[index];
                let updatedType;
                if (id) {
                    if (remove) {
                        await getRepository(Type).update(id, { isDeleted: 1 });
                    } else {
                        await getRepository(Type).update(id, { typeName });
                        updatedType = await getRepository(Type).findOne(id);
                    }
                } else {
                    updatedType = await this.saveType(typeName, userId);
                    this.addToRelation<Type>({ model: "Product", property: "type" }, productId, updatedType);
                }
                updatedTypes = [...updatedTypes, updatedType];
            }
            return updatedTypes;
        } catch (err) {
            throw err;
        }
    }

    public async saveOrUpdateTypeList(types, userId: number): Promise<Type[]> {
        try {
            const savedTypes = await this.getList();
            const deleteType = savedTypes.filter(type => (types.findIndex(t => t.id === type.id) === -1));
            await this.deleteTypes(deleteType);
            let typesList = [];
            for (const key in types) {
                const type = types[key];
                if (type.id && type.id > 0) {
                    const typeFromBD = savedTypes.find(t => t.id === type.id);
                    if (typeFromBD.typeName !== type.typeName) {
                        const updatedType = await this.updateType(type, userId);
                        typesList = [...typesList, updatedType];
                    } else {
                        typesList = [...typesList, typeFromBD];
                    }
                } else {
                    const newType = await this.saveType(type.typeName, userId);
                    typesList = [...typesList, newType];
                }
            }
            return typesList;
        } catch (error) {
            throw error;
        }

    }

    public async updateType(type, userId):Promise<Type> {
        try {
            await getConnection()
                .getRepository(Type).createQueryBuilder('type')
                .update(Type)
                .set({ updatedBy: userId, updatedOn: new Date(), typeName: type.typeName })
                .andWhere("id = :id", { id: type.id })
                .execute();
            const newType = await this.findById(type.id);
            return newType;
        } catch (error) {
            throw error;
        }
    }

    public async deleteTypes(typeList):Promise<void> {
        try {
            for (const key in typeList) {
                await getConnection()
                    .getRepository(Type).createQueryBuilder('type')
                    .delete()
                    .where("id = :id", { id: typeList[key].id })
                    .execute();
            }
        } catch (error) {
            throw error;
        }
    }
}
