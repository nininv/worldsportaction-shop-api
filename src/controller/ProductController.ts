import { Get, JsonController, Res, QueryParam, Post, Body, HeaderParam, Authorized, UploadedFile } from 'routing-controllers';
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
    @QueryParam('sorterBy') sorterBy: string,
    @QueryParam('order') order: string,
    @QueryParam('offset') offsetT: string,
    @Res() response: Response
  ) {

    try {
      const search = filter ? `%${filter}%` : '%%';
      const sort = {
        sorterBy,
        order: order === 'desc' ? 'DESC' : 'ASC'
      };
      const offset = offsetT ? offsetT : 0;
      const limit = 8;
      const found = await this.productService.getProductList(search, sort, offset, limit);

      if (found) {
        let totalCount = found.count;
        let responseObject = paginationData(stringTONumber(totalCount), limit, stringTONumber(offset ? offset : '0'));
        responseObject["result"] = found.products.map(product => {
          const { productName, image, price, variants } = product;
          const types = product.types.map(type => type.typeName);
          return {
            productName,
            image,
            price,
            types,
            variants
          };
        });

        return response.status(200).send(responseObject);
      }
    } catch (err) {
      logger.error(`Unable to get product list ` + err);
      return response.status(400).send({
        err: err.message
      });
    }
  }

}