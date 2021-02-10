import { Service } from "typedi";
import BaseService from "./BaseService";
import { Invoice } from "../models/registrations/Invoice";
import { Cart } from "../models/Cart";
import { feeIsNull, isArrayPopulated, isNotNullAndUndefined } from '../utils/Utils';
import { logger } from "../logger";

@Service()
export default class InvoiceService extends BaseService<Invoice> {
    modelName(): string {
        return Invoice.name;
    }

    public async findByCartId(cartId: number): Promise<Invoice> {
        return await this.entityManager.createQueryBuilder().select().from(Invoice, 'inv')
            .andWhere("inv.cartId = :cartId", { cartId })
            .andWhere("inv.isDeleted = 0").execute();
    }

    public async getInvoiceReciptId(): Promise<any> {
        let query =  await this.entityManager.query(`select IFNULL(receiptId, 100000) as receiptId from wsa_registrations.invoice order by id desc LIMIT 1`);
        return query.find(x=>x);
    }

    public async getInvoice(cart: Cart) {
        try {
            const CART_CREATOR_USER_ID = cart.createdBy;
            const getInvoiceStatus = await this.findByCartId(cart.id);

            let inv = new Invoice();
            if (!isArrayPopulated(getInvoiceStatus)) {
                let invoiceReceipt = await this.getInvoiceReciptId();
                let receiptId = feeIsNull(invoiceReceipt.receiptId) + 1;
                inv.id = 0;
                inv.createdBy = CART_CREATOR_USER_ID;
                inv.paymentStatus = "initiated";
                inv.receiptId = receiptId.toString();
            }
            else {
                inv.id = getInvoiceStatus[0].id
                inv.paymentStatus = getInvoiceStatus[0].paymentStatus;
                inv.updatedBy = CART_CREATOR_USER_ID;
                inv.updatedOn = new Date();
            }
            inv.cartId = cart.id;

            return inv;
        } catch (error) {
            throw error;
        }
    }

    public async updateErrorMessageAndPaymentTypeWithTransaction(cartId: number, paymentType: string, error: string, stripeSourceTransaction: string) {
        try{
            const getInvoiceData = await this.findByCartId(cartId);
            const INVOICE_ID = getInvoiceData[0].id;

            if (isArrayPopulated(getInvoiceData)) {

                const i = new Invoice();
                i.id = INVOICE_ID;
                i.cartId = cartId;
                if(paymentType)
                    i.paymentType = paymentType;

                i.stripeSourceTransaction = isNotNullAndUndefined(stripeSourceTransaction) ? stripeSourceTransaction : undefined;

                i.errorMessage = isNotNullAndUndefined(error) ? error : undefined;
                await this.createOrUpdate(i);
            }
        }
        catch(error){
            logger.error(`Exception occurred in makingTransfers ${error}`);
            throw error;
        }

    }

}
