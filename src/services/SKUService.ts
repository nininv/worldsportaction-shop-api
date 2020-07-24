import { Service } from "typedi";
import { getRepository, getConnection, getManager } from 'typeorm';
import BaseService from "./BaseService";
import { ProductVariantOption } from "../models/ProductVariantOption";
import { SKU } from "../models/SKU";

@Service()
export default class SKUService extends BaseService<SKU> {

    modelName(): string {
        return SKU.name;
    }

    public createSKU(properties, userId) {
        const sku = new SKU();
        sku.price = properties.price;
        sku.quantity = properties.quantity;
        sku.skuCode = properties.skuCode;
        sku.cost = properties.cost;
        sku.barcode = properties.barcode;
        if (properties.id) {
            sku.updatedBy = userId;
            sku.updatedOn = new Date();
        } else {
            sku.createdBy = userId;
            sku.createdOn = new Date();
        }
        return sku;
    }

    public async saveSKU(price, cost, skuCode, barcode, quantity, productId, userId) {
        try {
            const sku = this.createSKU({ price, cost, skuCode, barcode, quantity }, userId)
            const savedSKU = await getRepository(SKU).save(sku);
            await this.addToRelation(
                { model: "Product", property: "SKU" },
                productId,
                savedSKU
            );
            return savedSKU;
        } catch (error) {
            throw error;
        }
    }

    public async deleteProductVariant(id: number, userId): Promise<any> {
        try {
            const sku = await getConnection()
                .getRepository(SKU)
                .createQueryBuilder("SKU")
                .leftJoinAndSelect("SKU.productVariantOption", "productVariantOption")
                .where("SKU.id = :id", { id })
                .getOne();
            if (!sku) {
                throw new Error(`This sku don't found`);
            } else {
                await this.entityManager.createQueryBuilder(SKU, 'sku')
                    .update(SKU)
                    .set({ isDeleted: 1, updatedBy: userId, updatedOn: new Date() })
                    .andWhere("id = :id", { id: sku.id })
                    .execute();
                await this.entityManager.createQueryBuilder(ProductVariantOption, 'productVariantOption')
                    .update(ProductVariantOption)
                    .set({ isDeleted: 1, updatedBy: userId, updatedOn: new Date() })
                    .andWhere("id = :id", { id: sku.productVariantOption.id })
                    .execute();
            }
        } catch (error) {
            throw error;
        }
    }

    public async updateSKUWithoutVariant(sku, properties, userId) {
        try {
            const { price, cost, skuCode, barcode, quantity } = properties;
            await getConnection()
                .getRepository(SKU)
                .createQueryBuilder('sku')
                .update(SKU)
                .set({
                    isDeleted: 0,
                    updatedBy: userId,
                    updatedOn: new Date(),
                    price,
                    cost,
                    skuCode,
                    barcode,
                    quantity
                })
                .andWhere("id = :id", { id: sku.id })
                .execute();
        } catch (error) {
            throw error;
        }
    };

    public async restoreProductVariants(
        id: number,
        userId
    ): Promise<any> {
        try {
            const sku = await getConnection()
                .getRepository(SKU)
                .createQueryBuilder("SKU")
                .leftJoinAndSelect("SKU.productVariantOption", "productVariantOption")
                .where("SKU.id = :id", { id })
                .getOne();
            if (!sku) {
                throw new Error(`This sku don't found`);
            } else {
                await this.entityManager.createQueryBuilder(SKU, 'sku')
                    .update(SKU)
                    .set({ isDeleted: 0, updatedBy: userId, updatedOn: new Date() })
                    .andWhere("id = :id", { id })
                    .execute();
                await this.entityManager.createQueryBuilder(ProductVariantOption, 'productVariantOption')
                    .update(ProductVariantOption)
                    .set({ isDeleted: 0, updatedBy: userId, updatedOn: new Date() })
                    .andWhere("id = :id", { id: sku.productVariantOption.id })
                    .execute();
            }
        } catch (error) {
            throw error;
        }
    }
}
