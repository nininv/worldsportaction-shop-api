import { Get, JsonController, Res, Authorized, QueryParam } from "routing-controllers";
import { Response } from "express";
import { BaseController } from "./BaseController";
import { logger } from "../logger";

@JsonController("/settings")
export class SettingsController extends BaseController {

    @Authorized()
    @Get("/list")
    async getAdressList(
        @QueryParam('organisationUniqueKey') organisationUniqueKey: string,
        @Res() res: Response
    ) {
        try {
            const organisationId = await this.organisationService.findByUniquekey(organisationUniqueKey);
            const addressList = await this.pickUpAddressService.getList(organisationId);
            const typeList = await this.typeService.getList();
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

}