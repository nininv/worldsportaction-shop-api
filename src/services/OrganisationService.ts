import { Service } from "typedi";
import BaseService from "../services/BaseService";
import { Organisation } from "../models/Organisation";

@Service()
export default class OrganisationService extends BaseService<Organisation> {
    modelName(): string {
        return Organisation.name;
    }

    public async findByUniquekey(organisationUniquekey: string): Promise<number> {
        let query = this.entityManager.createQueryBuilder(Organisation, 'organisation');
        query.where('organisation.organisationUniquekey= :organisationUniquekey and isDeleted = 0', { organisationUniquekey });
        return (await query.getOne()).id;
    }
}