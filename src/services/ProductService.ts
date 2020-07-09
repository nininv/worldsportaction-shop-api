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
                .leftJoinAndSelect("product.SKU", "SKU", "SKU.isDeleted = 0  AND SKU.quantity > :min", { min: 0 })
                .leftJoinAndSelect("SKU.productVariantOption", "productVariantOption", " productVariantOption.isDeleted = 0")
                .leftJoinAndSelect("productVariantOption.variant", "productVariant")
                .where("product.isDeleted = 0")
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
                .leftJoinAndSelect("product.SKU", "SKU", "SKU.productId = :id", { id })
                .leftJoinAndSelect("SKU.productVariantOption", "productVariantOption")
                .leftJoinAndSelect("productVariantOption.variant", "productVariant")
                .where("product.id = :id AND product.isDeleted = 0", { id })
                .getOne();
            const parseProduct = this.parseVariant(product);
            return parseProduct;
        } catch (error) {
            throw error;
        }
    }

    public parseVariant(product) {
        const { id, productName, description,
            images, type, affiliates, inventoryTracking,
            createByOrg, deliveryType, availableIfOutOfStock,
            width, length, height, weight, createdBy, createdOn,
            updatedBy, updatedOn, SKU } = product;
        let newProduct = {};
        newProduct = {
            ...newProduct, id, productName, description,
            images, type, affiliates, inventoryTracking,
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
                    const { price, cost, SKU, barcode, quantity, tax, id } = sku;
                    variants = [...variants,
                    {
                        ...sku.productVariantOption.variant,
                        options: [{
                            optionName,
                            properties: { id, price, cost, SKU, barcode, quantity, tax }
                        }]
                    }
                    ];
                } else {
                    const { optionName } = sku.productVariantOption;
                    const { price, cost, SKU, barcode, quantity, tax, id } = sku;
                    variants[idx].options = [...variants[idx].options,
                    { optionName, properties: { id, price, cost, SKU, barcode, quantity, tax } }];
                }
            } else {
                const { price, cost, SKU, barcode, quantity, tax } = sku;
                newProduct = { ...newProduct, price, cost, SKU, barcode, quantity, tax };
            }
        })
        newProduct = { ...newProduct, variants: variants };
        return newProduct;
    }

    public async getProductCount(search): Promise<number> {
        try {
            const count = await getConnection()
                .getRepository(Product)
                .createQueryBuilder("products")
                .leftJoinAndSelect("products.type", "type")
                .leftJoinAndSelect("products.SKU", "SKU", "SKU.isDeleted = 0  AND SKU.quantity > :min", { min: 0 })
                .leftJoinAndSelect("SKU.productVariantOption", "productVariantOption", " productVariantOption.isDeleted = 0")
                .leftJoinAndSelect("productVariantOption.variant", "productVariant")
                .where("products.isDeleted = 0")
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
        const parseProductList = products.map(product => this.parseVariant(product));
        const result = parseProductList.map(product => {
            const { id, productName, price, images, variants, cost, tax, barcode, skuCode, quantity } = product;
            const type = product.type.typeName;
            const variantOptionsTemp = variants.map(variant => {
                const variantName = variant.name;
                const options = variant.options.map(option => {
                    const { optionName, sortOrder } = option;
                    const { id, price, barcode, quantity, tax } = option.properties;
                    return {
                        optionName,
                        properties: {
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
                cost,
                tax,
                barcode,
                skuCode,
                quantity,
                type,
                variants: variantOptionsTemp
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
                pickUpAddress,
                price,
                cost,
                skuCode,
                barcode,
                quantity,
                tax
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
            const sku = await this.saveSKU(price, cost, skuCode, barcode, quantity, tax, product.id, user.id);
            await this.saveProductVariantsAndOptions(variants, product.id, user.id)
            return product;
        } catch (error) {
            throw error;
        }
    }

    public async saveSKU(price, cost, skuCode, barcode, quantity, tax, productId, userId) {
        const sku = new SKU();
        sku.price = price;
        sku.quantity = quantity;
        sku.skuCode = skuCode;
        sku.tax = tax;
        sku.cost = cost;
        sku.barcode = barcode;
        sku.createdBy = userId;
        sku.createdOn = new Date();
        const savedSKU = await getRepository(SKU).save(sku);
        await this.addToRelation(
            { model: "Product", property: "SKU" },
            productId,
            savedSKU
        );
        return savedSKU;
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
                sku.cost = properties.cost;
                sku.barcode = properties.barcode;
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
        } catch (error) {
            throw error;
        }
    }

    public async getProductIdBySKUId(id: number): Promise<any> {
        try {
            const res = await getConnection()
                .getRepository(SKU)
                .createQueryBuilder("SKU")
                .leftJoinAndSelect("SKU.product", "product")
                .where("SKU.id = :id", { id })
                .getOne();
            return res.product.id;
        } catch (error) {
            throw error
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
