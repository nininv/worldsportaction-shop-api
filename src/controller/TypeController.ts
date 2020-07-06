import { Get, JsonController, Res, Authorized, Body, Post, HeaderParam } from "routing-controllers";
import { Response } from "express";
import { BaseController } from "./BaseController";
import { logger } from "../logger";
import { User } from "../models/User";

@JsonController("/type")
export class TypeController extends BaseController {

    @Authorized()
    @Get("/list")
    async getTypeList(@Res() res: Response) {
        try {
            const typeList = await this.typeService.getList();
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
            const newType = await this.typeService.saveType(data.typeName, user.id);
            return res.send(newType);
        } catch (err) {
            logger.info(err);
            return res.send(err.message);
        }
    }
}