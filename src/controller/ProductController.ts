import { Get, JsonController, Res, QueryParam, Post, Body, Authorized, UploadedFile, Delete, Put } from 'routing-controllers';
import { Response } from 'express';
import { BaseController } from './BaseController';
import { paginationData, stringTONumber } from '../utils/Utils';
import { logger } from '../logger';

@JsonController('/product')
export class ProductController extends BaseController {

  @Authorized()
  @Post('')
  async post(
    @Body() data: any,
    @UploadedFile("productPhoto", { required: false }) productPhoto: Express.Multer.File,
    @Res() res: Response
  ) {
    try {
      const paramObj = JSON.parse(data.params);
      const product = await this.productService.addProduct(paramObj, productPhoto);
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
    @QueryParam('offset') offsetT: string,
    @Res() response: Response
  ) {
    try {
      const search = filter ? `%${filter}%` : '%%';
      const sort = {
        sortBy,
        order: order === 'desc' ? 'DESC' : 'ASC'
      };
      const offset = offsetT ? offsetT : 0;
      const limit = 8;
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

  @Delete('')
  async remove(@QueryParam("id") id: number, @Res() response: Response) {
    try {
      const obj = await this.productService.deleteProduct(id)
      return response.send(obj)
    } catch (error) {
      return response.status(500).send(error.message ? error.message : error)
    }
  }

  @Put('/restore')
  async restore(@QueryParam("id") id: number, @Res() response: Response) {
    try {
      const restoredProduct = await this.productService.restoreProduct(id);
      return response.send(restoredProduct)
    } catch (error) {
      return response.status(500).send(error.message ? error.message : error)
    }
  }
}
