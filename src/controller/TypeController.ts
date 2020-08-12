import { Get, JsonController, Res, Authorized, Body, Post, HeaderParam, QueryParam } from "routing-controllers";
import { Response } from "express";
import { BaseController } from "./BaseController";
import { logger } from "../logger";
import { User } from "../models/User";

@JsonController("/type")
export class TypeController extends BaseController {

    @Authorized()
    @Get("/list")
    async getTypeList(
        @QueryParam('organisationUniqueKey') organisationUniqueKey: string,
        @Res() res: Response
    ) {
        try {
            let organisationId;
            if (organisationUniqueKey) {
                organisationId = await this.organisationService.findByUniquekey(organisationUniqueKey);
            }
            const typeList = await this.typeService.getList(organisationId);
            return res.send(typeList);
        } catch (err) {
            logger.info(err);
            return res.send(err.message);
        }
    }

    @Authorized()
    @Post("")
    async addType(
        @HeaderParam("authorization") user: User,
        @Body() data: any,
        @Res() res: Response
    ) {
        try {
            const organisationId = await this.organisationService.findByUniquekey(data.organisationUniqueKey);
            if (organisationId) {
                const newType = await this.typeService.saveType(data.typeName, user.id, organisationId);
                return res.send(newType);
            } else {
                return res.status(212).send({ name: 'found_error', message: `organisation not found.` });
            }
        } catch (err) {
            logger.info(err);
            return res.send(err.message);
        }
    }
}