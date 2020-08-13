import { Service } from "typedi";
import { getConnection, getRepository } from "typeorm";
import BaseService from "./BaseService";
import { Type } from "../models/Type";

@Service()
export default class TypeService extends BaseService<Type> {
    modelName(): string {
        return Type.name;
    }

    public async getList(organisationId): Promise<Type[]> {
        try {
            const organisationFirstLevel = organisationId ? await this.getAffiliatiesOrganisations([organisationId], 3) : [];
            const organisationSecondLevel = organisationId ? await this.getAffiliatiesOrganisations([organisationId], 4) : [];
            const types = await getConnection()
                .getRepository(Type)
                .createQueryBuilder("type")
                .where(`type.isDeleted = 0
                    ${organisationId ? 'AND (type.organisationId = :organisationId' : ''}
                    ${organisationFirstLevel.length > 0
                        ? ' OR  type.organisationId IN (:...organisationFirstLevel)'
                        : ''} 
                    ${organisationSecondLevel.length > 0
                        ? ' OR type.organisationId IN (:...organisationSecondLevel)'
                        : ''}
                        ${organisationId ? ')' : ''}`,
                    { organisationId, organisationFirstLevel, organisationSecondLevel })
                .getMany();
            return types;
        } catch (err) {
            throw err;
        }
    }

    public async getAffiliatiesOrganisations(organisationId: number[], level: number): Promise<number[]> {
        try {
            let organisations = [];
            for (const key in organisationId) {
                const affiliatesOrganisations = await this.entityManager.query(
                    `select * from wsa_users.linked_organisations 
                where linked_organisations.linkedOrganisationId = ? 
                AND linked_organisations.linkedOrganisationTypeRefId = ?`,
                    [organisationId[key], level]
                );
                if (affiliatesOrganisations) {
                    organisations = [...organisations, ...affiliatesOrganisations.map(org => org.inputOrganisationId)];
                }
            }
            return organisations;
        } catch (err) {
            throw err;
        }
    }

    public async saveType(typeName, userId, organisationId): Promise<Type> {
        try {
            let productType = new Type();
            const existingType = await getRepository(Type).findOne({ typeName });
            if (!existingType) {
                const newType = new Type();
                newType.typeName = typeName;
                newType.organisationId = organisationId;
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

    public async saveOrUpdateTypeList(types, userId: number, organisationId: number): Promise<Type[]> {
        try {
            const savedTypes = await this.getList(organisationId);
            const deleteType = savedTypes.filter(type => (types.findIndex(t => t.id === type.id) === -1));
            await this.deleteTypes(deleteType, userId);
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
                    const newType = await this.saveType(type.typeName, userId, organisationId);
                    typesList = [...typesList, newType];
                }
            }
            return typesList;
        } catch (error) {
            throw error;
        }

    }

    public async updateType(type, userId): Promise<Type> {
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

    public async deleteTypes(typeList, userId): Promise<void> {
        try {
            for (const key in typeList) {
                await getConnection()
                    .getRepository(Type).createQueryBuilder('type')
                    .update(Type)
                    .set({ updatedBy: userId, updatedOn: new Date(), isDeleted: 1 })
                    .andWhere("id = :id", { id: typeList[key].id })
                    .execute();
            }
        } catch (error) {
            throw error;
        }
    }

}
