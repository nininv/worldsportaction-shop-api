import { Service } from "typedi";
import { getRepository } from 'typeorm';
import BaseService from "./BaseService";
import { ProductVariant } from "../models/ProductVariant";
import ProductVariantOptionService from "./ProductVariantOptionService";

@Service()
export default class ProductVariantService extends BaseService<ProductVariant> {

    modelName(): string {
        return ProductVariant.name;
    }

    public parseVariant(product) {
        const { id, productName, description,
            images, type, affiliates, inventoryTracking,
            createByOrg, deliveryType, availableIfOutOfStock,
            width, length, height, weight, createdBy, createdOn,
            updatedBy, updatedOn, SKU, tax } = product;
        let newProduct = {};
        newProduct = {
            ...newProduct, id, productName, description,
            images, type, affiliates, inventoryTracking, tax,
            createByOrg, deliveryType, availableIfOutOfStock,
            width, length, height, weight, createdBy, createdOn, updatedBy, updatedOn
        };
        let variants = [];
        SKU.forEach(sku => {
            if (sku.productVariantOption) {
                const idx = variants.findIndex(variant =>
                    variant.id === sku.productVariantOption.variant.id);
                if (sku.productVariantOption.variant && idx === -1) {
                    const { optionName } = sku.productVariantOption;
                    const { price, cost, skuCode, barcode, quantity, id } = sku;
                    variants = [...variants,
                    {
                        ...sku.productVariantOption.variant,
                        options: [{
                            optionName,
                            properties: { id, price, cost, skuCode, barcode, quantity }
                        }]
                    }
                    ];
                } else {
                    const { optionName } = sku.productVariantOption;
                    const { price, cost, skuCode, barcode, quantity, id } = sku;
                    variants[idx].options = [...variants[idx].options,
                    { optionName, properties: { id, price, cost, skuCode, barcode, quantity } }];
                }
            } else {
                const { price, cost, skuCode, barcode, quantity } = sku;
                newProduct = { ...newProduct, price, cost, skuCode, barcode, quantity };
            }
        })
        newProduct = { ...newProduct, variants: variants };
        return newProduct;
    }

    public async saveProductVariantsAndOptions(variants, id, userId) {
        let variantsArr = [];
        for (let key in variants) {
            let newVariant = new ProductVariant();
            newVariant.name = variants[key].name;
            const { options } = variants[key];
            const productVariantOption = new ProductVariantOptionService();
            let newOptions = productVariantOption.saveProductOption(options, userId);
            newVariant.options = newOptions;
            newVariant.createdOn = new Date();
            newVariant.createdBy = userId;
            const savedVariant = await getRepository(ProductVariant).save(newVariant);
            variantsArr = [...variantsArr, savedVariant];
        }
        for (let idx in variantsArr) {
            const { options } = variantsArr[idx];
            for (let key in options) {
                await this.addToRelation(
                    { model: "Product", property: "variants" },
                    id,
                    variantsArr[idx]
                );
                await this.addToRelation(
                    { model: "ProductVariant", property: "options" },
                    variantsArr[idx].id,
                    variantsArr[idx].options
                );
                await this.addToRelation(
                    { model: "Product", property: "SKU" },
                    id,
                    options[key].properties
                );
            }
        }
        return variantsArr;
    }

    public async updateProductVariantsAndOptions(variants, id, userId) {
        let variantsArr = [];
        for (let key in variants) {
            let newVariant = new ProductVariant();
            newVariant.name = variants[key].name;
            const { options } = variants[key];
            const productVariantOption = new ProductVariantOptionService();
            const newOptions = productVariantOption.saveProductOption(options, userId)
            newVariant.options = newOptions;
            newVariant.createdOn = new Date();
            newVariant.createdBy = userId;
            const savedVariant = await getRepository(ProductVariant).save(newVariant);
            variantsArr = [...variantsArr, savedVariant];
        }
        for (let idx in variantsArr) {
            const { options } = variantsArr[idx];
            for (let key in options) {
                await this.addToRelation(
                    { model: "Product", property: "variants" },
                    id,
                    variantsArr[idx]
                );
                await this.addToRelation(
                    { model: "ProductVariant", property: "options" },
                    variantsArr[idx].id,
                    variantsArr[idx].options
                );
                await this.addToRelation(
                    { model: "Product", property: "SKU" },
                    id,
                    options[key].SKU
                );
            }
        }
        return variantsArr;
    }
}
