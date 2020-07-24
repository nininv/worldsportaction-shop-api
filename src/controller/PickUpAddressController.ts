import { Get, JsonController, Res, Authorized, Body, Post, Put, HeaderParam, QueryParam } from "routing-controllers";
import { Response } from "express";
import { BaseController } from "./BaseController";
import { logger } from "../logger";
import { User } from "../models/User";

@JsonController("/address")
export class PickUpAddressController extends BaseController {

  @Authorized()
  @Get("/list")
  async getAdressList(
    @QueryParam('organisationUniqueKey') organisationUniqueKey: string,
    @Res() res: Response
  ) {
    try {
      const organisationId = await this.organisationService.findByUniquekey(organisationUniqueKey);
      const adressList = await this.pickUpAddressService.getList(organisationId);
      return res.send(adressList);
    } catch (err) {
      logger.info(err);
      return res.send(err.message);
    }
  }

  @Authorized()
  @Get('')
  async getAddresstById(
    @QueryParam('id') id: string,
    @Res() response: Response
  ) {
    try {
      const address = await this.pickUpAddressService.getAddressById(id);
      if (address) {
        return response.status(200).send(address);
      } else {
        return response.status(404).send({
          err: `address with this id doesn't exists`
        });
      }
    } catch (err) {
      logger.error(`Unable to get address ${err}`);
      return response.status(400).send({
        err: err.message
      });
    }
  }

  @Authorized()
  @Post('')
  async addAddress(
    @HeaderParam("authorization") user: User,
    @Body() data: any,
    @Res() res: Response
  ) {
    try {
      const {
        address,
        suburb,
        postcode,
        state,
        organisationUniqueKey
      } = data;
      const organizationId = await this.organisationService.findByUniquekey(organisationUniqueKey);
      const newAddress = await this.pickUpAddressService.saveAdress(
        { address, suburb, postcode, state },
        organizationId,
        organisationUniqueKey,
        user.id);
      return res.send(newAddress);
    } catch (err) {
      logger.info(err);
      return res.send(err.message);
    }
  }

  @Authorized()
  @Put('')
  async restore(
    @HeaderParam("authorization") user: User,
    @Body() data: any,
    @Res() response: Response
  ) {
    try {
      const organisationId = await this.organisationService.findByUniquekey(data.organisationUniqueKey);
      const updatedAddress = await this.pickUpAddressService.updateAddress(
        data,
        organisationId,
        data.organisationUniqueKey,
        user.id);
      return response.send(updatedAddress);
    } catch (error) {
      return response.status(500).send(error.message ? error.message : error);
    }
  }
}
