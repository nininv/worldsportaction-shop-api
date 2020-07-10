import { Service } from "typedi";
import { getConnection, getRepository, UpdateResult } from 'typeorm';
import BaseService from "./BaseService";
import { Product } from "../models/Product";
import { Type } from "../models/Type";
import { uploadImage } from "../services/FirebaseService";
import { SKU } from "../models/SKU";
import { Image } from "../models/Image";
import TypeService from "../services/TypeService";
import ProductVariantService from './ProductVariantService';
import SKUService from "./SKUService";

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
            if (product) {
                const variantService = new ProductVariantService();
                const parseProduct = variantService.parseVariant(product);
                return parseProduct;
            } else {
                return
            }
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
        const variantService = new ProductVariantService();
        const parseProductList = products.map(product => variantService.parseVariant(product));
        const result = parseProductList.map(product => {
            const { id, productName, price, images, variants, cost, tax, barcode, skuCode, quantity, createdOn } = product;
            const type = product.type.typeName;
            const variantOptionsTemp = variants.map(variant => {
                const variantName = variant.name;
                const options = variant.options.map(option => {
                    const { optionName, sortOrder } = option;
                    const { id, price, barcode, quantity } = option.properties;
                    return {
                        optionName,
                        properties: {
                            id,
                            price,
                            barcode,
                            skuCode,
                            quantity
                        }
                    };
                });
                return { variantName, options };
            });
            return {
                id,
                productName,
                createdOn,
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

    public async addProduct(data, images, user) {
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
            let productType = await typeService.saveType(type.typeName, user.id);
            const newProduct = new Product();
            newProduct.productName = productName;
            newProduct.description = description;
            newProduct.type = productType;
            newProduct.affiliates = affiliates;
            newProduct.availableIfOutOfStock = availableIfOutOfStock;
            newProduct.tax = tax;
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
            const skuService = new SKUService();
            const sku = await skuService.saveSKU(price, cost, skuCode, barcode, quantity, product.id, user.id);
            const variantService = new ProductVariantService();
            const savedVariants = await variantService.saveProductVariantsAndOptions(variants, product.id, user.id);
            return { ...product, price, quantity, cost, barcode, skuCode, variants: savedVariants };
        } catch (error) {
            throw error;
        }
    }

    public async addImages(productPhotos, userId) {
        let images = [];
        if (productPhotos) {
            const urls = await uploadImage(productPhotos);
            images = urls.map((url: string) => {
                const image = new Image();
                image.url = url;
                image.createdBy = userId;
                return image;
            });
        }
        return images;
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

    public async createOrUpdateProduct(data, productPhotos, user): Promise<any> {
        const typeService = new TypeService();
        try {
            // let images =[];
            // if(productPhotos){
            //     images = await this.addImages(productPhotos, user.id);
            // }
            if (data.id) {
                let parseProduct;
                const product = await getConnection()
                    .getRepository(Product)
                    .createQueryBuilder("product")
                    .leftJoinAndSelect("product.images", "images")
                    .leftJoinAndSelect("product.type", "type")
                    .leftJoinAndSelect("product.SKU", "SKU", "SKU.productId = :id", { id: data.id })
                    .leftJoinAndSelect("SKU.productVariantOption", "productVariantOption")
                    .leftJoinAndSelect("productVariantOption.variant", "productVariant")
                    .where("product.id = :id", { id: data.id })
                    .getOne();
                if (product) {
                    const variantService = new ProductVariantService();
                    parseProduct = variantService.parseVariant(product);

                } else {
                    const res = this.addProduct(data, productPhotos, user);
                    return res;
                }
                const productType = await typeService.saveType(data.type.typeName, user.id);
                if (parseProduct.variants !== data.variants) {
                    const variantService = new ProductVariantService();
                    const deletingVariants = parseProduct.variants.filter(varinat => !data.variants || data.variants.length === 0 || (data.variants.indexOf(varinat) === -1))
                    await variantService.updateProductVariantsAndOptions(data.variants, data.id, user.id, deletingVariants);
                }
                // const newImage = data.images?[...data.images,...images]:[...images];
                await getRepository(Product)
                    .createQueryBuilder()
                    .update(Product)
                    .set({
                        productName: data.productName,
                        description: data.description,
                        affiliates: data.affiliates,
                        inventoryTracking: data.inventoryTracking,
                        createByOrg: data.createByOrg,
                        deliveryType: data.deliveryType,
                        availableIfOutOfStock: data.availableIfOutOfStock,
                        width: data.width,
                        length: data.length,
                        height: data.height,
                        weight: data.weight,
                        // images: newImage,
                        updatedBy: user.id,
                        updatedOn: new Date().toISOString(),
                        type: productType
                    })
                    .where('id = :id', { id: data.id })
                    .execute();
                const updatedProduct = await this.getProductById(data.id);
                return updatedProduct;
            } else {
                const res = this.addProduct(data, productPhotos, user);
                return res;
            }
        } catch (error) {
            throw error;
        }
    }

    public async updateProduct(id: number, pickUpAddress: any, types: any[], userId): Promise<any> {
        try {
            const typeService = new TypeService();
            await getRepository(Product).update(id, { pickUpAddress, updatedBy: userId, updatedOn: new Date().toISOString() });
            await typeService.ChangeType(types, id, userId);
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
