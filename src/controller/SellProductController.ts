import { JsonController, Res, Authorized, HeaderParam, QueryParam, Delete } from 'routing-controllers';
import { Response } from 'express';
import { BaseController } from './BaseController';
import { logger } from '../logger';
import { User } from '../models/User';

@JsonController('/sellProduct')
export class OrderController extends BaseController {

    @Authorized()
    @Delete('')
    async deleteSellProduct(
        @QueryParam('id') id: number,
        @Res() res: Response
    ) {
        try {
            await this.sellProductService.deleteSellProduct(id);
            return res.send({ id, isDeleted: true });
        } catch (err) {
            logger.info(err)
            return res.send(err.message);
        }
    }

}
