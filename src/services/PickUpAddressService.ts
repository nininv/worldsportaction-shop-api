import { PickUpAddress } from '../models/PickUpAddress';
import { Service } from "typedi";
import { getConnection, getRepository } from "typeorm";
import BaseService from "./BaseService";
import { Type } from "../models/Type";

@Service()
export default class PickUpAddressService extends BaseService<Type> {
    modelName(): string {
        return PickUpAddress.name;
    }

    public async getList(organisationId: number): Promise<PickUpAddress[]> {
        try {
            const list = await getConnection()
                .getRepository(PickUpAddress)
                .createQueryBuilder("pickUpAddress")
                .where("pickUpAddress.organisationId = :organisationId", { organisationId })
                .getMany();
            return list;
        } catch (err) {
            throw err;
        }
    }

    public async saveAdress(addressObj, organisationId: number, organisationUniqueKey: string, userId: number): Promise<PickUpAddress> {
        try {
            const { address, suburb, postcode, state } = addressObj;
            let newPickUpAddress = new PickUpAddress();
            newPickUpAddress.address = address;
            newPickUpAddress.suburb = suburb;
            newPickUpAddress.postcode = postcode;
            newPickUpAddress.state = state;
            newPickUpAddress.organisationUniqueKey = organisationUniqueKey;
            newPickUpAddress.organisationId = organisationId;
            newPickUpAddress.createdBy = userId;
            newPickUpAddress.createdOn = new Date();
            const newAddress = await getConnection().manager.save(newPickUpAddress);
            return newAddress;
        } catch (err) {
            throw err;
        }
    }

    public async getAddressById(id: number): Promise<PickUpAddress> {
        try {
            const address = await getRepository(PickUpAddress).findOne(id);
            return address;
        } catch (error) {
            throw error;
        }
    }

    public async updateAddress(data, organisationId: number, organisationUniqueKey: string, userId: number): Promise<PickUpAddress> {
        try {
            const {
                address,
                suburb,
                postcode,
                state,
                id
            } = data;
            const updatedAddress = await this.entityManager.createQueryBuilder(PickUpAddress, 'pickUpAddress')
                .update(PickUpAddress)
                .set({ address, suburb, postcode, state, organisationId, organisationUniqueKey, updatedBy: userId, updatedOn: new Date() })
                .where("id = :id", { id })
                .execute();
            if (updatedAddress.affected === 0) {
                throw new Error(`This address not found`);
            }
            const pickUpAddress = this.getAddressById(id);
            return pickUpAddress;
        } catch (error) {
            throw error;
        }
    }

    public async saveOrUpdateAddress(addressObj, userId: number, organisationId: number, organisationUniqueKey: string): Promise<PickUpAddress> {
        try {
            let newAddress;
            if (addressObj.id && addressObj.id > 0) {
                const addressFromBD = await this.getAddressById(addressObj.id);
                if (addressFromBD.address !== addressObj.address ||
                    addressFromBD.suburb !== addressObj.suburb ||
                    addressFromBD.postcode !== addressObj.postcode ||
                    addressFromBD.state !== addressObj.state) {
                    newAddress = await this.updateAddress(addressObj, organisationId, organisationUniqueKey, userId);
                } else {
                    newAddress = addressFromBD;
                }
            } else {
                newAddress = await this.saveAdress(addressObj, organisationId, organisationUniqueKey, userId);
            }
            return newAddress;
        } catch (error) {
            throw error;
        }
    }
}