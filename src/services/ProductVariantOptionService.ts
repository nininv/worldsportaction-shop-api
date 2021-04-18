import { Service } from 'typedi';
import BaseService from './BaseService';
import { ProductVariantOption } from '../models/ProductVariantOption';
import SKUService from './SKUService';

@Service()
export default class ProductVariantOptionService extends BaseService<ProductVariantOption> {
  modelName(): string {
    return ProductVariantOption.name;
  }

  public sortByVariantOptionSortOrder(products) {
    const sortedList = products.map(product => {
      const sorted = product.variantOptions.map(variant => {
        variant.options.sort((item1, item2) => this.compareFunctionForVariant(item1, item2));
      });
      return sorted;
    });
    return sortedList;
  }

  public compareFunctionForVariant(item1, item2) {
    const a = item1.sortOrder;
    const b = item2.sortOrder;
    if (a > b) {
      return 1;
    }
    if (a < b) {
      return -1;
    }
    return 0;
  }

  public saveProductOption(options, userId) {
    let newOptions = [];
    for (let idx in options) {
      const { optionName, properties } = options[idx];
      if (properties.id) {
        options[idx].updatedOn = new Date();
        options[idx].updatedBy = userId;
        properties.updatedOn = new Date();
        properties.updatedBy = userId;
        newOptions = [...newOptions, options[idx]];
      } else {
        const skuService = new SKUService();
        const sku = skuService.createSKU(properties, userId);
        sku.createdBy = userId;
        sku.createdOn = new Date();
        const newOption = new ProductVariantOption();
        newOption.optionName = optionName;
        newOption.properties = sku;
        newOption.createdBy = userId;
        newOption.createdOn = new Date();
        newOptions = [...newOptions, newOption];
      }
    }
    return newOptions;
  }
}
