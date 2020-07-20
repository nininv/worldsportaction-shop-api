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

    public async getList(organisationId): Promise<PickUpAddress[]> {
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

    public async saveAdress(address, suburb, postcode, state, organizationId, userId): Promise<PickUpAddress> {
        try {
            let newPickUpAddress = new PickUpAddress();
            newPickUpAddress.address = address;
            newPickUpAddress.suburb = suburb;
            newPickUpAddress.postcode = postcode;
            newPickUpAddress.state = state;
            newPickUpAddress.organisationId = organizationId;
            newPickUpAddress.createdBy = userId;
            newPickUpAddress.createdOn = new Date();
            const newAddress = await getConnection().manager.save(newPickUpAddress);
            return newAddress;

        } catch (err) {
            throw err;
        }
    }

    public async getAddressById(id): Promise<PickUpAddress> {
        try {
            const address = await getRepository(PickUpAddress).findOne(id);
            return address;
        } catch (error) {
            throw error;
        }
    }

    public async updateAddress(data, userId): Promise<PickUpAddress> {
        try {
            const {
                address,
                suburb,
                postcode,
                state,
                id,
                organisationId
            } = data;
            const updatedAddress = await this.entityManager.createQueryBuilder(PickUpAddress, 'pickUpAddress')
                .update(PickUpAddress)
                .set({ address, suburb, postcode, state, organisationId, updatedBy: userId, updatedOn: new Date() })
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
}