import { Service } from "typedi";
import { getConnection } from "typeorm";
import BaseService from "../services/BaseService";
import { Organisation } from "../models/Organisation";

@Service()
export default class OrganisationService extends BaseService<Organisation> {
    modelName(): string {
        return Organisation.name;
    }

    public async findByUniquekey(organisationUniquekey: string): Promise<number> {
        try {
            let query = await getConnection()
                .getRepository(Organisation).createQueryBuilder('organisation')
                .where('organisation.organisationUniquekey= :organisationUniquekey and isDeleted = 0', { organisationUniquekey }).getOne();
            if (query) {
                return query.id;
            } else {
                throw new Error('OrganisationUniqueKey is invalid')
            }
        } catch (err) {
            throw err
        }
    }

    public async findById(organisationId: number): Promise<Organisation> {
        try {
            let query = await getConnection()
                .getRepository(Organisation).createQueryBuilder('organisation')
                .where('organisation.id = :organisationId', { organisationId }).getOne();
            if (query) {
                return query;
            } else {
                throw new Error('OrganisationId is invalid')
            }
        } catch (err) {
            throw err
        }
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