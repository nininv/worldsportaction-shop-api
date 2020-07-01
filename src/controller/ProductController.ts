import { Get, JsonController, Res, QueryParam, Post, Put, Body, Authorized, UploadedFiles, HeaderParam } from 'routing-controllers';
import { Response } from 'express';
import { BaseController } from './BaseController';
import { paginationData, stringTONumber } from '../utils/Utils';
import { logger } from '../logger';
import { User } from '../models/User';

@JsonController('/product')
export class ProductController extends BaseController {

  @Authorized()
  @Post('')
  async post(
    @HeaderParam("authorization") currentUser: User,
    @Body() data: any,
    @UploadedFiles("productPhotos", { required: false }) productPhoto: Express.Multer.File[],
    @Res() res: Response
  ) {
    try {
      const paramObj = JSON.parse(data.params);
      const product = await this.productService.addProduct(paramObj, productPhoto, currentUser);
      return res.send(product);
    } catch (err) {
      logger.info(err);
      return res.send(err.message);
    }
  }

  @Authorized()
  @Get('/list')
  async getProduct(
    @QueryParam('filter') filter: string,
    @QueryParam('sorterBy') sortBy: string,
    @QueryParam('order') order: string,
    @QueryParam('limit') limitT: string,
    @QueryParam('offset') offsetT: string,
    @Res() response: Response
  ) {
    try {
      const search = filter ? `%${filter}%` : '%%';
      const sort = {
        sortBy,
        order: order === 'desc' ? 'DESC' : 'ASC'
      };
      const limit = limitT ? +limitT : 8;
      const offset = offsetT ? offsetT : 0;
      const found = await this.productService.getProductList(search, sort, offset, limit);

      if (found) {
        let totalCount = found.count;
        let responseObject = paginationData(stringTONumber(totalCount), limit, stringTONumber(offset ? offset : '0'));
        responseObject["result"] = found.result;
        return response.status(200).send(responseObject);
      }
    } catch (err) {
      logger.error(`Unable to get product list ` + err);
      return response.status(400).send({
        err: err.message
      });
    }
  }

  @Authorized()
  @Put('/settings')
  async changeProduct(
    @HeaderParam("authorization") user: User,
    @Body() data: any,
    @Res() res: Response
  ) {
    const { productId, pickUpAddress, type } = data;
    try {
      const updatedProduct = await this.productService.updateProduct(productId, pickUpAddress, type, user);
      return res.send(updatedProduct)
    } catch (err) {
      logger.info(err);
      return res.send(err.message);
    }
  }

}