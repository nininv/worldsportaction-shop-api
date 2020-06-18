import { Get, JsonController, Res, QueryParam, Post, Body, HeaderParam, Authorized, UploadedFile } from 'routing-controllers';
import { Response } from 'express';
import { BaseController } from './BaseController';
import { paginationData, stringTONumber } from '../utils/Utils';
import { logger } from '../logger';

@JsonController('/product')
export class ProductController extends BaseController {

@Post('')
  async post(
    @Body() data: any,
    @UploadedFile("productPhoto", { required: false }) productPhoto: Express.Multer.File,
    @Res() res: Response
  ) {
    try {
      const paramObj = JSON.parse(data.params);
    //   const {
    //     productName,
    //     cost,
    //     description,
    //     price,
    //     types,
    //     affiliates,
    //     tax,
    //     invetoryTracking,
    //     quantity,
    //     deliveryName,
    //     width,
    //     height,
    //     length,
    //     weight,
    //     variants
    //   } = paramObj;
      let image = "";

      const product = await this.productService.addProduct(paramObj);

      return res.send(product);
    } catch (err) {
      logger.info(err);
      return res.send(err.message);
    }
  }

    @Authorized()
    @Get('/list')
    async getProduct(
        @HeaderParam("authorization") currentUser: any,
        @QueryParam('filter') filter: string,
        @QueryParam('sorterBy') sorterBy: string,
        @QueryParam('order') order: string,
        @QueryParam('offset') offset: string,
        @Res() response: Response
    ) {
        
        try {
            const search = filter ? `%${filter}%` : '%%';
            const sort = {
                sorterBy,
                order: order === 'desc' ? 'DESC' : 'ASC'
            };
            const found = await this.productService.getProduct(search, sort, offset, 8);
            if (found) {
                let totalCount = found.totalCount;
                let responseObject = paginationData(stringTONumber(totalCount), 8, stringTONumber(offset ? offset : '0'));

                responseObject["result"] = found.query;
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