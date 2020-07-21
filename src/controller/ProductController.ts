import { Get, JsonController, Res, QueryParam, Post, Put, Body, Authorized, UploadedFiles, HeaderParam, Delete } from 'routing-controllers';
import { Response } from 'express';
import { BaseController } from './BaseController';
import { paginationData, stringTONumber } from '../utils/Utils';
import { logger } from '../logger';
import { User } from '../models/User';
import { deleteImage } from '../services/FirebaseService';

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
      const product = await this.productService.createOrUpdateProduct(paramObj, productPhoto, 1);
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
    @QueryParam('organisationUniqueKey') organisationUniqueKey: string,
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
      const organisationId = await this.organisationService.findByUniquekey(organisationUniqueKey);
      const found = await this.productService.getProductList(search, sort, offset, limit, organisationId);

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
  @Delete('')
  async remove(
    @QueryParam("id") id: number,
    @HeaderParam("authorization") currentUser: User,
    @Res() response: Response
  ) {
    try {
      await this.productService.deleteProduct(id, 123)
      return response.send({ id, isDeleted: true })
    } catch (error) {
      return response.status(500).send(error.message ? error.message : error)
    }
  }

  @Authorized()
  @Delete('/variant')
  async deleteVariant(
    @QueryParam("id") id: number,
    @HeaderParam("authorization") user: User,
    @Res() response: Response
  ) {
    try {
      const obj = await this.skuService.deleteProductVariant(id, user.id);
      return response.send({ id, isDeleted: true })
    } catch (error) {
      return response.status(500).send(error.message ? error.message : error)
    }
  }

  @Delete('/image')
  async deleteImageRouter(
    @QueryParam("url") url: string,
    @Res() response: Response
  ) {
    try {
      const idx = url.indexOf('product/photo');
      if (idx > 0) {
        const imageName = url.slice(idx);
        const obj = await deleteImage(imageName);
        return response.send({ mess: 'okay' })
      } else {
        return response.status(400).send('URL is wrong')
      }
    } catch (error) {
      return response.status(500).send(error.message ? error.message : error)
    }
  }

  @Authorized()
  @Put('/restore')
  async restore(
    @QueryParam("id") id: number,
    @HeaderParam("authorization") user: User,
    @Res() response: Response
  ) {
    try {
      const restoredProduct = await this.productService.restoreProduct(id, user.id);

      return response.send(restoredProduct)
    } catch (error) {
      return response.status(500).send(error.message ? error.message : error)
    }
  }

  @Authorized()
  @Put('/restore/variant')
  async restoreVariant(@QueryParam("id") id: number,
    @HeaderParam("authorization") user: User,
    @Res() response: Response
  ) {
    try {
      await this.skuService.restoreProductVariants(id, user.id);
      const productId = await this.productService.getProductIdBySKUId(id);
      const product = await this.productService.getProductById(productId);
      return response.send(product);
    } catch (error) {
      return response.status(500).send(error.message ? error.message : error)
    }
  }

  @Authorized()
  @Get('')
  async getProductById(
    @QueryParam('id') id: string,
    @Res() response: Response
  ) {
    try {
      const product = await this.productService.getProductById(id);
      if (product) {
        return response.status(200).send(product);
      } else {
        return response.status(404).send({
          err: `Product with this id doesn't exists`
        });
      }
    } catch (err) {
      logger.error(`Unable to get product ${err}`);
      return response.status(400).send({
        err: err.message
      });
    }
  }


  @Authorized()
  @Put('/settings')
  async changeProduct(
    @HeaderParam("authorization") currentUser: User,
    @Body() data: any,
    @Res() res: Response
  ) {
    const { productId, pickUpAddress, types } = data;
    try {
      const updatedProduct = await this.productService.updateProduct(productId, pickUpAddress, types, currentUser.id);
      return res.send(updatedProduct)
    } catch (err) {
      logger.info(err);
      return res.send(err.message);
    }
  }

}
