import { Service } from "typedi";
import { getConnection } from "typeorm";
import BaseService from "../services/BaseService";
import { Organisation } from "../models/Organisation";
import { cartProduct } from "../controller/ShopController";
import {isArrayPopulated, isNullOrUndefined} from "../utils/Utils";
import {logger} from "../logger";

@Service()
export default class OrganisationService extends BaseService<Organisation> {
    modelName(): string {
        return Organisation.name;
    }

    public async getShopOrganisations(): Promise<Organisation[]> {
        try {
            let result = await this.entityManager.query("call wsa_shop.usp_organisations_list()");
            return result[0];
        } catch (err) {
            throw err
        }
    }

    // below return an array but really should be one
    public async findOrganisationByUniqueKey(organisationKey: string): Promise<Organisation> {
        return await this.entityManager.createQueryBuilder().select().from(Organisation, 'o')
            .andWhere("o.organisationUniqueKey = :organisationKey", { organisationKey })
            .andWhere("o.isDeleted = 0")
            .execute();
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

    public async checkOrganisationStripeAccount(cartProducts: [cartProduct]) {
        try {
            let obj = {
                stripeAccountIdError: false,
                orgName: '',
            }
            if (isArrayPopulated(cartProducts)) {

                for (let product of cartProducts) {
                    let mOrgData = await this.findByUniquekey(product.organisationId);
                    let mStripeAccountId = null;
                    if (isArrayPopulated(mOrgData)) {
                        mStripeAccountId = mOrgData[0].stripeAccountID;
                        if (isNullOrUndefined(mStripeAccountId)) {
                            product["organisationAccountId"] = mStripeAccountId;
                            product["orgId"] = mOrgData[0].id;
                            product["orgName"] = mOrgData[0].name;
                        } else {
                            logger.error(`Organisation doesn't have Stripe Account ${product.organisationId}`)
                            obj.stripeAccountIdError = true;
                            obj.orgName = mOrgData[0].name;
                            break;
                        }
                    }
                }
            }
            return obj;
        } catch (error) {
            throw error;
        }
    }
}
