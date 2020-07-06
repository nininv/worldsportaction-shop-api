import { Service } from "typedi";
import { getConnection, getRepository, UpdateResult } from 'typeorm';
import BaseService from "./BaseService";
import { Product } from "../models/Product";
import { Type } from "../models/Type";
import { ProductVariant } from "../models/ProductVariant";
import { ProductVariantOption } from "../models/ProductVariantOption";
import { uploadImage } from "../services/FirebaseService";
import { SKU } from "../models/SKU";
import { Image } from "../models/Image";
import TypeService from "../services/TypeService";

@Service()
export default class ProductService extends BaseService<Product> {

    modelName(): string {
        return Product.name;
    }

    public async getProductList(search, sort, offset, limit): Promise<any> {
        try {
            const products = await getConnection()
                .getRepository(Product)
                .createQueryBuilder("product")
                .leftJoinAndSelect("product.images", "images")
                .leftJoinAndSelect("product.type", "type")
                .leftJoinAndSelect("product.variants", "productVariant")
                .leftJoinAndSelect("productVariant.options", "productVariantOption")
                .leftJoinAndSelect("productVariantOption.SKU", "SKU")
                .where("SKU.quantity > :min", { min: 0 })
                .andWhere("product.isDeleted = 0 AND SKU.isDeleted = 0 AND productVariantOption.isDeleted = 0")
                .andWhere(
                    "(type.typeName LIKE :search OR product.productName LIKE :search)",
                    { search }
                )
                .orderBy(sort.sortBy ? `product.${sort.sortBy}` : null, sort.order)
                .orderBy(`productVariantOption.sortOrder`)
                .skip(offset)
                .take(limit)
                .getMany();
            const count = await this.getProductCount(search);
            let result = this.parseProductList(products);
            return { count, result };
        } catch (error) {
            throw error;
        }
    }

    public async getProductById(id): Promise<any> {
        try {
            const product = await getConnection()
                .getRepository(Product)
                .createQueryBuilder("product")
                .leftJoinAndSelect("product.images", "images")
                .leftJoinAndSelect("product.type", "type")
                .leftJoinAndSelect("product.variants", "productVariant")
                .leftJoinAndSelect("productVariant.options", "productVariantOption")
                .leftJoinAndSelect("productVariantOption.SKU", "SKU")
                .where("SKU.productId = :id", { id })
                .getOne();
            return product;        
        } catch (error) {
            throw error;
        }
    }

    public async getProductCount(search): Promise<number> {
        try {
            const count = await getConnection()
                .getRepository(Product)
                .createQueryBuilder("products")
                .leftJoinAndSelect("products.type", "type")
                .leftJoinAndSelect("products.variants", "variant")
                .leftJoinAndSelect("variant.options", "productVariant")
                .leftJoinAndSelect("productVariant.SKU", "SKU")
                .where("SKU.quantity > :min", { min: 0 })
                .andWhere(
                    "(type.typeName LIKE :search OR products.productName LIKE :search)",
                    { search }
                )
                .getCount();
            return count;
        } catch (error) {
            throw error;
        }
    }

    public parseProductList(products) {
        const result = products.map(product => {
            const { id, productName, price, images, variants } = product;
            const type = product.type.typeName;
            const variantOptionsTemp = variants.map(variant => {
                const variantName = variant.name;
                const options = variant.options.map(option => {
                    const { optionName, sortOrder } = option;
                    const { id, price, barcode, quantity, tax } = option.SKU;
                    return {
                        optionName,
                        SKU: {
                            id,
                            price,
                            barcode,
                            tax,
                            quantity
                        }
                    };
                });
                return { variantName, options };
            });
            return {
                id,
                productName,
                images,
                price,
                type,
                variantOptions: variantOptionsTemp
            };
        });
        return result;
    }

    public sortByVariantOptionSortOrder(products) {
        const sortedList = products.map(product => {
            const sorted = product.variantOptions.map((variant: ProductVariant) => {
                variant.options.sort((item1, item2) =>
                    this.compareFunctionForVariant(item1, item2)
                );
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


    public async addProduct(data, productPhotos, user) {
        const typeService = new TypeService();
        try {
            const {
                productName,
                description,
                type,
                variants,
                availableIfOutOfStock,
                affiliates,
                inventoryTracking,
                deliveryType,
                width,
                height,
                length,
                weight,
                createByOrg,
                pickUpAddress
            } = data;
            let images = [];
            if (productPhotos) {
                const urls = await uploadImage(productPhotos);
                images = urls.map((url: string) => {
                    const image = new Image();
                    image.url = url;
                    return image;
                });
            }
            let productType = await typeService.saveType(type, user.id);
            const newProduct = new Product();
            newProduct.productName = productName;
            newProduct.description = description;
            newProduct.type = productType;
            newProduct.affiliates = affiliates;
            newProduct.availableIfOutOfStock = availableIfOutOfStock;
            newProduct.inventoryTracking = inventoryTracking;
            newProduct.createByOrg = createByOrg;
            newProduct.deliveryType = deliveryType;
            newProduct.length = length;
            newProduct.height = height;
            newProduct.weight = weight;
            newProduct.width = width;
            newProduct.createdBy = user.id;
            newProduct.createdOn = new Date();
            newProduct.pickUpAddress = pickUpAddress;
            newProduct.images = images;
            const product = await getRepository(Product).save(newProduct);
            await this.saveProductVariantsAndOptions(variants, product.id, user.id)
            return product;
        } catch (error) {
            throw error;
        }
    }

    public async saveProductVariantsAndOptions(variants, id, userId) {
        let variantsArr = [];
        for (let key in variants) {
            let newVariant = new ProductVariant();
            newVariant.name = variants[key].name;
            const { options } = variants[key];
            let newOptions = [];
            for (let idx in options) {
                const { optionName, properties } = options[idx];
                const sku = new SKU();
                sku.price = properties.price;
                sku.quantity = properties.quantity;
                sku.skuCode = properties.skuCode;
                sku.tax = properties.tax;
                sku.createdBy = userId;
                sku.createdOn = new Date();
                const newOption = new ProductVariantOption();
                newOption.optionName = optionName;
                newOption.createdOn = new Date();
                newOption.createdBy = userId;
                newOption.SKU = sku;
                newOptions = [...newOptions, newOption];
            }
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

    public async ChangeType(types: any[], productId: number, userId): Promise<Type[]> {
        try {
            let updatedTypes = [];
            for (let index in types) {
                const { id, typeName, remove } = types[index];
                const typeService = new TypeService();
                let updatedType;
                if (id) {
                    if (remove) {
                        await getRepository(Type).update(id, { isDeleted: 1 });
                    } else {
                        await getRepository(Type).update(id, { typeName });
                        updatedType = await getRepository(Type).findOne(id);
                    }
                } else {
                    updatedType = await typeService.saveType(typeName, userId);
                    this.addToRelation({ model: "Product", property: "type" }, productId, updatedType);
                }
                updatedTypes = [...updatedTypes, updatedType];
            }
            return updatedTypes;
        } catch (err) {
            throw err;
        }
    }

    public async addToRelation(relationObj: any, id: number, item: any) {
        const { model, property } = relationObj;
        try {
            await getConnection()
                .createQueryBuilder()
                .relation(model, property)
                .of(id)
                .add(item);
        } catch (error) {
            throw error;
        }
    }

    public async deleteProductVariant(id: number, userId): Promise<any> {
        try {
            const a = await this.entityManager.createQueryBuilder(SKU, 'sku')
                .update(SKU)
                .set({ isDeleted: 1, updatedBy: userId, updatedOn: new Date() })
                .andWhere("id = :id", { id })
                .execute();
            if (a.affected === 0) {
                throw new Error(`This product don't found`);
            } else {
                await this.entityManager.createQueryBuilder(ProductVariantOption, 'productVariantOption')
                    .update(ProductVariantOption)
                    .set({ isDeleted: 1, updatedBy: userId, updatedOn: new Date() })
                    .andWhere("id = :id", { id })
                    .execute();
            }

        } catch (error) {
            throw error;
        }
    }

    public async restoreProductVariants(
        id: number,
        userId
    ): Promise<any> {
        try {
            const a = await this.entityManager.createQueryBuilder(SKU, 'sku')
                .update(SKU)
                .set({ isDeleted: 0, updatedBy: userId, updatedOn: new Date() })
                .andWhere("id = :id", { id })
                .execute();
            if (a.affected === 0) {
                throw new Error(`This product don't found`);
            } else {
                await this.entityManager.createQueryBuilder(ProductVariantOption, 'productVariantOption')
                    .update(ProductVariantOption)
                    .set({ isDeleted: 0, updatedBy: userId, updatedOn: new Date() })
                    .andWhere("id = :id", { id })
                    .execute();
            }
            return;
        } catch (error) {
            throw error;
        }
    }

    public async deleteProduct(id: number, userId): Promise<void> {
        try {
            const a = await this.entityManager.createQueryBuilder(Product, 'product')
                .update(Product)
                .set({ isDeleted: 1, updatedBy: userId, updatedOn: new Date() })
                .andWhere("id = :id", { id })
                .execute();
            if (a.affected === 0) {
                throw new Error(`This product don't found`);
            }
        } catch (error) {
            throw error;
        }
    }

    public async restoreProduct(id: number, userId): Promise<void> {
        try {
            const a = await this.entityManager.createQueryBuilder(Product, 'product')
                .update(Product)
                .set({ isDeleted: 0, updatedBy: userId, updatedOn: new Date() })
                .andWhere("id = :id", { id })
                .execute();
            if (a.affected === 0) {
                throw new Error(`This product don't found`);
            }
            const product = this.getProduct(id);
            return product;
        } catch (error) {
            throw error;
        }
    }

    public async updateProduct(id: number, pickUpAddress: any, types: any[], userId): Promise<any> {
        try {
            await getRepository(Product).update(id, { pickUpAddress, updatedBy: userId, updatedOn: new Date().toISOString() });
            await this.ChangeType(types, id, userId);
            const updatedProduct = await getRepository(Product).findOne(id, { relations: ["type"] });
            return updatedProduct;
        } catch (err) {
            throw err;
        }
    }

    public async getProduct(id: number): Promise<any> {
        try {
            const product = await getConnection()
                .getRepository(Product)
                .createQueryBuilder("product")
                .leftJoinAndSelect("product.images", "images")
                .leftJoinAndSelect("product.type", "type")
                .leftJoinAndSelect("product.variants", "productVariant")
                .leftJoinAndSelect("productVariant.options", "productVariantOption")
                .leftJoinAndSelect("productVariantOption.SKU", "SKU")
                .where("product.id = :id", { id })
                .andWhere('product.isDeleted = 0')
                .getOne();
            const parseProduct = this.parseProductList([product]);
            return parseProduct[0];
        } catch (error) {
            throw new Error(error);
        }
    }
}
