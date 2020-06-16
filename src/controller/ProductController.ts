import {  Get, JsonController, Res, QueryParam } from 'routing-controllers';
import { Response } from 'express';
import { BaseController } from './BaseController';
import { paginationData, stringTONumber } from '../utils/Utils';
import { logger } from '../logger';

@JsonController('/product')
export class ProductController extends BaseController {

    // @Post('')
    // async post(
    //     @Body() data: any,
    //     @Res() res: Response
    // ) {
    //     try {
    //         const {
    //             productName,
    //             cost,
    //             description,
    //             price,
    //             typeName,
    //             affiliates,
    //             image,
    //             tax,
    //             invetoryTracking,
    //             variantName,
    //             deliveryName,
    //             width,
    //             height,
    //             length,
    //             weight
    //         } = data;
    //         let productType = {};
    //         const existingType = await getRepository(Type).find({
    //             typeName
    //         });
    //         console.log('existingType', existingType)
    //         if (existingType.length === 0) {
    //             const newType = new Type();
    //             newType.typeName = typeName;
    //             productType = await getConnection().manager.save(newType);
    //         } else {
    //             productType = existingType;
    //         }
    //         const dimensions = { length, height, weight, width };
    //         const productValues = {
    //             productName,
    //             cost,
    //             description,
    //             price,
    //             affiliates,
    //             image,
    //             tax,
    //             invetoryTracking,
    //             variantName,
    //             deliveryName,
    //             dimensions
    //         };

    //         const product = await getConnection()
    //             .getRepository(Product)
    //             .save(productValues);
    //         const productRepository = await getRepository(Product);
    //         await getConnection()
    //             .createQueryBuilder()
    //             .relation(Product, "types")
    //             .of(product.id)
    //             .add(productType);
    //         console.log('productRepository', productRepository)
    //         return res.send(product);
    //     } catch (err) {
    //         logger.info(err);
    //         return res.send(err.message);
    //     }
    // }


    // @Authorized()

    @Get('/list')
    async getProduct(
        // @HeaderParam("authorization") currentUser: User,
        @QueryParam('productName') productName: string,
        @QueryParam('typeId') typeId: string,
        @QueryParam('sorterBy') sorterBy: string,
        @QueryParam('order') order: string,
        @QueryParam('offset') offset: string,
        @Res() response: Response
    ) {
        try {
            const filter = {
                productName: `%${productName ? productName : ''}%`,
                typeId: `%${typeId ? typeId : ''}%`
            };
            const sort = {
                sorterBy,
                order: order === 'desc' ? 'DESC' : 'ASC'
            };
            const found = await this.productService.getProduct(filter, sort, offset);
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