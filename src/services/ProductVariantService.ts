import { Service } from 'typedi';
import { getRepository, getConnection } from 'typeorm';
import BaseService from './BaseService';
import { ProductVariant } from '../models/ProductVariant';
import ProductVariantOptionService from './ProductVariantOptionService';
import { ProductVariantOption } from '../models/ProductVariantOption';
import { SKU } from '../models/SKU';
import { ParseProduct } from './ProductService';
import { isArrayPopulated } from '../utils/Utils';

@Service()
export default class ProductVariantService extends BaseService<ProductVariant> {
  modelName(): string {
    return ProductVariant.name;
  }

  public parseVariant(product): ParseProduct {
    const {
      id,
      productName,
      description,
      images,
      type,
      affiliates,
      inventoryTracking,
      createByOrg,
      deliveryType,
      availableIfOutOfStock,
      width,
      length,
      height,
      weight,
      createdBy,
      createdOn,
      organisationUniqueKey,
      updatedBy,
      updatedOn,
      SKU,
      tax,
    } = product;
    let newProduct: any = {};
    newProduct = {
      ...newProduct,
      id,
      productName,
      description,
      images,
      type,
      affiliates,
      inventoryTracking,
      tax,
      createByOrg,
      deliveryType,
      availableIfOutOfStock,
      organisationUniqueKey,
      width,
      length,
      height,
      weight,
      createdBy,
      createdOn,
      updatedBy,
      updatedOn,
    };
    let variants = [];
    if (SKU) {
      SKU.forEach(sku => {
        if (sku.productVariantOption) {
          const idx = variants.findIndex(
            variant => variant.id === sku.productVariantOption.variant.id,
          );
          if (sku.productVariantOption.variant && idx === -1) {
            const { optionName } = sku.productVariantOption;
            const { price, cost, skuCode, barcode, quantity, id } = sku;
            variants = [
              ...variants,
              {
                ...sku.productVariantOption.variant,
                options: [
                  {
                    id: sku.productVariantOption.id,
                    optionName,
                    properties: { id, price, cost, skuCode, barcode, quantity },
                  },
                ],
              },
            ];
          } else {
            const { optionName } = sku.productVariantOption;
            const { price, cost, skuCode, barcode, quantity, id } = sku;
            variants[idx].options = [
              ...variants[idx].options,
              {
                optionName,
                id: sku.productVariantOption.id,
                properties: { id, price, cost, skuCode, barcode, quantity },
              },
            ];
          }
        } else {
          const { price, cost, skuCode, barcode, quantity } = sku;
          newProduct = { ...newProduct, price, cost, skuCode, barcode, quantity };
        }
      });
    }
    if (variants.length > 1) {
      variants = [variants.pop()];
    }
    newProduct = { ...newProduct, variants: variants };
    return newProduct;
  }

  public async saveProductVariantsAndOptions(variants, id, userId) {
    try {
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
          await this.addToRelation<ProductVariant>(
            { model: 'Product', property: 'variants' },
            id,
            variantsArr[idx],
          );
          await this.addToRelation<ProductVariantOption>(
            { model: 'ProductVariant', property: 'options' },
            variantsArr[idx].id,
            variantsArr[idx].options,
          );
          await this.addToRelation<SKU>(
            { model: 'Product', property: 'SKU' },
            id,
            options[key].properties,
          );
        }
      }
      return variantsArr;
    } catch (error) {
      throw error;
    }
  }

  public async updateProductVariantsAndOptions(variants, id, userId, variantsChecked) {
    try {
      let variantsArr = [];
      for (let key in variants) {
        let variant;
        const { options } = variants[key];
        const productVariantOption = new ProductVariantOptionService();

        if (variants[key].id) {
          variant = variants[key];
        } else {
          variant = new ProductVariant();
          variant.name = variants[key].name;
        }
        const newOptions = productVariantOption.saveProductOption(options, userId);
        variant.options = newOptions;
        if (variant.id) {
          variant.updatedOn = new Date();
          variant.updatedBy = userId;
        } else {
          variant.createdOn = new Date();
          variant.createdBy = userId;
        }
        if (variantsChecked && isArrayPopulated(variant.options)) {
          variant.isDeleted = 0;
        } else {
          variant.isDeleted = 1;
        }
        const savedVariant = await getRepository(ProductVariant).save(variant);
        variantsArr = [...variantsArr, savedVariant];
      }
      for (let idx in variantsArr) {
        const { options } = variantsArr[idx];
        await this.addToRelation<ProductVariant>(
          { model: 'Product', property: 'variants' },
          id,
          variantsArr[idx],
        );
        for (let key in options) {
          await this.addToRelation<ProductVariantOption>(
            { model: 'ProductVariant', property: 'options' },
            variantsArr[idx].id,
            variantsArr[idx].options,
          );
          await this.addToRelation<SKU>(
            { model: 'Product', property: 'SKU' },
            id,
            options[key].properties,
          );
        }
      }
      return variantsArr;
    } catch (error) {
      throw error;
    }
  }
}
