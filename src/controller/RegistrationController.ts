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
            if (requestBody.registrationId || requestBody.userRegId) {
                let result = await this.productService.getRegistrationProducts(requestBody)
                return res.status(200).send(result);
            }
            else{
                return res.status(212).send({message:"Registration or UserRegistration is required"}); 
            }
           
        } catch (err) {
            logger.info(err);
            return res.status(500).send("Something went wrong. Please contact administrator" + err.message);
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