import { Get, JsonController, Res, Authorized } from "routing-controllers";
import { Response } from "express";
import { BaseController } from "./BaseController";
import { logger } from "../logger";

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
}