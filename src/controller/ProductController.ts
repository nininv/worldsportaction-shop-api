import { Get, JsonController, Res, QueryParam, Post, Put, Body, Authorized, UploadedFiles, HeaderParam, Delete } from 'routing-controllers';
import { Response } from 'express';
import { BaseController } from './BaseController';
import { paginationData, stringTONumber } from '../utils/Utils';
import { logger } from '../logger';
import { User } from '../models/User';
import { deleteImage } from '../services/FirebaseService';
import { SortData } from '../services/ProductService';
import { PaginationData } from '../services/BaseService';

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
      const product = await this.productService.createOrUpdateProduct(paramObj, productPhoto, currentUser);
      return product;
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
    @QueryParam('limit') limit: number,
    @QueryParam('offset') offset: number,
    @QueryParam('organisationUniqueKey') organisationUniqueKey: string,
    @Res() response: Response
  ) {
    try {
      const search = filter ? `%${filter}%` : '%%';
      const sort: SortData = {
        sortBy,
        order: order === 'desc' ? 'DESC' : 'ASC'
      };
      const pagination:PaginationData = {
        limit: limit ? limit : 8,
        offset: offset ? offset : 0
      };
      const organisationId = await this.organisationService.findByUniquekey(organisationUniqueKey);
      const found = await this.productService.getProductList(search, sort, pagination, organisationId);

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
  @Get('/listForUser')
  async getProductList(
    @QueryParam('type') type: number,
    @QueryParam('organisationUniqueKeys') organisationUniqueKeys: string[],
    @QueryParam('limit') limit: number,
    @QueryParam('offset') offset: number,
    @Res() response: Response
  ) {
    try {
      let organisationIds = [];
      const pagination = {
        limit: limit ? limit : 8,
        offset: offset ? offset : 0
      }
      for (const key in organisationUniqueKeys) {
        const organisation = await this.organisationService.findByUniquekey(organisationUniqueKeys[key]);
        organisationIds = [...organisationIds, organisation];
      }
      const listObject = await this.productService.getProductListForEndUser(type, organisationIds, pagination);
      if (listObject) {
        let responseObject = paginationData(stringTONumber(listObject.count), pagination.limit, pagination.offset);
        responseObject["result"] = listObject.result;
        return response.status(200).send(responseObject);
      }
    } catch (error) {
      return response.status(500).send(error.message ? error.message : error)
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
      await this.productService.deleteProduct(id, currentUser.id)
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
      await this.skuService.deleteProductVariant(id, user.id);
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
    @QueryParam('id') id: number,
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

}
