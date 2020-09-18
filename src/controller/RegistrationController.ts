import { Get, JsonController, Res, Authorized, Body, Post, HeaderParam, QueryParam } from "routing-controllers";
import { Response } from "express";
import { BaseController } from "./BaseController";
import { logger } from "../logger";
import { User } from "../models/User";

@JsonController("/api")
export class RegistrationController extends BaseController {

    @Authorized()
    @Post("/registration/products")
    async getRegistrationProducts(
        @HeaderParam("authorization") currentUser: User,
        @Body() requestBody: any,
        @Res() res: Response
    ) {
        try {
            if (requestBody.registrationId) {
                let result = await this.productService.getRegistrationProducts(requestBody)
                return res.send(result);
            }
           
        } catch (err) {
            logger.info(err);
            return res.send(err.message);
        }
    }

    @Post("/registration/pickupaddress")
    async getRegistrationPickupaddress(
        @HeaderParam("authorization") currentUser: User,
        @Body() requestBody: any,
        @Res() res: Response
    ) {
        try {
            if (requestBody.registrationId) {
                let result = await this.productService.getRegistrationPickupaddress(requestBody)
                return res.send(result);
            }
           
        } catch (err) {
            logger.info(err);
            return res.send(err.message);
        }
    }
}