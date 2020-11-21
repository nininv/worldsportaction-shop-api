import { Get, JsonController, Res, Authorized, QueryParam, Post, Body, HeaderParam } from "routing-controllers";
import { Response } from "express";
import { BaseController } from "./BaseController";
import { logger } from "../logger";
import { User } from '../models/User';

@JsonController("/settings")
export class SettingsController extends BaseController {

    @Authorized()
    @Get("/list")
    async getSettingsList(
        @QueryParam('organisationUniqueKey') organisationUniqueKey: string,
        @Res() res: Response
    ) {
        try {
            const organisationId = await this.organisationService.findByUniquekey(organisationUniqueKey);
            const addressList = await this.pickUpAddressService.getList(organisationId);
            const typeList = await this.typeService.getList(organisationId);
            const responseObj = {
                types: typeList,
                address: addressList
            }
            return res.send(responseObj);
        } catch (err) {
            logger.info(err);
            return res.send(err.message);
        }
    }

    @Authorized()
    @Post("")
    async updateSettingsList(
        @HeaderParam("authorization") user: User,
        @Body() data: any,
        @Res() res: Response
    ) {
        try {
            const { address, suburb, postcode, state, pickupInstruction, id, organisationUniqueKey, types } = data;
            const organisationId = await this.organisationService.findByUniquekey(organisationUniqueKey);
            const newTypeList = await this.typeService.saveOrUpdateTypeList(types, user.id, organisationId);
            const newAddress = await this.pickUpAddressService.saveOrUpdateAddress(
                { address, suburb, postcode, state, pickupInstruction, id },
                user.id,
                organisationId,
                organisationUniqueKey
            );
            return res.send({
                types: newTypeList,
                address: newAddress
            });
        } catch (err) {
            logger.info(err);
            return res.send(err.message);
        }
    }

}
