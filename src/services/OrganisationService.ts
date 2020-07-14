import { Service } from "typedi";
import { EntityManager } from "typeorm";
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

    public async getAffiliatiesOrganisations(organisationId, level) {
        try {
            const affiliatesOrganisations = await this.entityManager.query(
                `select * from wsa_users.linked_organisations 
            where linked_organisations.inputOrganisationId = 188 
            AND linked_organisations.linkedOrganisationTypeRefId = 4`,
                [organisationId, level]
            );
            let organisations = [];
            if (affiliatesOrganisations) {
                organisations = affiliatesOrganisations.map(org => org.linked_organisations);
            }
            return organisations;
        } catch (err) {
            throw err;
        }
    }
}