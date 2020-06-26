import axios from "axios";
import { Service } from "typedi";
import { getConnection, getRepository, UpdateResult } from 'typeorm';
import BaseService from "./BaseService";
import { Product } from "../models/Product";
import { Type } from "../models/Type";
import { Variant } from "../models/Variant";
import { VariantOption } from "../models/VariantOption";
import { uploadImage } from "../services/FirebaseService";
import { ProductVariantOption } from "../models/ProductVariantOption";
import { Image } from "../models/Image";

@Service()
export default class ProductService extends BaseService<Product> {

    modelName(): string {
        return Product.name;
    }

    public async getProductList(search, sort, offset, limit): Promise<any> {
        try {
            const existingVariant = await getRepository(Variant).findOne({ name: sort.sortBy });
            const sortBy = existingVariant || !sort.sortBy ? null : `products.${sort.sortBy}`;
            const products = await getConnection()
                .getRepository(Product)
                .createQueryBuilder("products")
                .leftJoinAndSelect("products.images", "images")
                .leftJoinAndSelect("products.types", "type")
                .leftJoinAndSelect("products.variantOptions", "productVariantOption")
                .leftJoinAndSelect("productVariantOption.variantOption", "variantOption")
                .leftJoinAndSelect("variantOption.variant", "variant")
                .where("products.quantity > :min", { min: 0 })
                .andWhere(
                    "(type.typeName LIKE :search OR products.productName LIKE :search)",
                    { search }
                )
                .orderBy(sortBy, sort.order)
                .skip(offset)
                .take(limit)
                .getMany();
            const count = await this.getProductCount(search);
            let result = this.parseProductList(products);
            if (existingVariant) {
                result = this.sortByVariant(result, sort)
            }
            return { count, result };
        } catch (error) {
            throw error;
        }

    }

    public async getProductCount(search): Promise<number> {
        try {
            const count = await getConnection()
                .getRepository(Product)
                .createQueryBuilder("products")
                .leftJoinAndSelect("products.types", "type")
                .where("products.quantity > :min", { min: 0 })
                .andWhere(
                    "(type.typeName LIKE :search OR products.productName LIKE :search)",
                    { search }
                )
                .getCount();
            return count;
        } catch (error) {
            throw error
        }
    }

    public parseProductList(products) {
        const result = products.map(product => {
            const { id, productName, price, images, variantOptions } = product;
            const types = product.types.map(type => type.typeName);
            const variantOptionsTemp = variantOptions.map(option => {
                const variantName = option.variantOption.variant.name;
                const { id, price, SKU, barcode, quantity } = option;
                const optionName = option.variantOption.optionName;
                const createAt = option.variantOption.createAt;
                return {
                    variantName,
                    option: {
                        createAt,
                        id,
                        price,
                        SKU,
                        barcode,
                        quantity,
                        optionName
                    }
                };
            });
            return {
                id,
                productName,
                images,
                price,
                types,
                variantOptions: variantOptionsTemp
            };
        });
        return result;
    }

    public sortByVariant(products, sort) {
        const sortedList = products.sort((item1, item2, ) => this.compareFunctionForVariant(item1, item2, sort));
        return sortedList;
    }

    public compareFunctionForVariant(item1, item2, sort) {
        const variantOptions1 = item1.variantOptions;
        const variantOptions2 = item2.variantOptions;
        if (!variantOptions1.find(variant => variant.variantName === sort.sortBy)) {
            return 1;
        };
        if (!variantOptions2.find(variant => variant.variantName === sort.sortBy)) {
            return -1;
        };
        const a = new Date(variantOptions1.find(variant => variant.variantName === sort.sortBy).option.createAt);
        const b = new Date(variantOptions2.find(variant => variant.variantName === sort.sortBy).option.createAt);
        if ((a < b && sort.orderBy === "ASC") || (a > b && sort.orderBy === "DESC")) return -1;
        if (a === b) return 0;
        return 1;
    }

    public async addProduct(data, productPhotos) {
        try {
            const { productName, cost, description, price, affiliates,
                tax, barcode, SKU, quantity, inventoryTracking, variantName,
                deliveryType, variants, width, types, height, length, weight, createByOrg, pickUpAddress
            } = data;
            let images = [];
            if (productPhotos) {
                const urls = await uploadImage(productPhotos);
                images = urls.map((url: string) => {
                    const image = new Image()
                    image.url = url;
                    return image;
                })
            };
            let typesArr = [];
            for (let item in types) {
                const productType = await this.saveType(types[item]);
                typesArr = [...typesArr, productType];
            };
            const newProduct = new Product();
            newProduct.productName = productName;
            newProduct.cost = cost;
            newProduct.description = description;
            newProduct.price = price;
            newProduct.affiliates = affiliates;
            newProduct.tax = tax;
            newProduct.barcode = barcode;
            newProduct.SKU = SKU;
            newProduct.quantity = quantity;
            newProduct.inventoryTracking = inventoryTracking;
            // newProduct.variantName = variantName;
            newProduct.deliveryType;
            newProduct.length = length;
            newProduct.height = height;
            newProduct.weight = weight;
            newProduct.width = width;
            newProduct.createByOrg = createByOrg;
            newProduct.pickUpAddress = pickUpAddress;
            newProduct.images = images;
            newProduct.createdOn = new Date();
            const product = await getRepository(Product).save(newProduct);
            for (let item in typesArr) {
                const obj = { model: "Product", property: "types" };
                await this.addToRelation(obj, product.id, typesArr[item]);
            };
            let variantsArr = [];
            for (let key in variants) {
                const name = variants[key].name;
                const existingVariant = await getRepository(Variant).findOne({ name });
                let newVariant;
                for (let index in variants[key].options) {
                    const optionName = variants[key].options[index].optionName;
                    const newProperties = await this.saveProperties(variants[key].options[index].properties);
                    let newVariantOption = [];
                    if (!existingVariant) {
                        const variantOption = await this.saveVariantOption(optionName, newProperties);
                        newVariantOption = [...newVariantOption, variantOption];
                    } else {
                        const existingVariantOption = await getRepository(VariantOption).findOne({ optionName });
                        if (!existingVariantOption) {
                            const variantOption = await this.saveVariantOption(optionName, newProperties);
                            newVariantOption = [...newVariantOption, variantOption];
                        } else {
                            existingVariantOption.properties = [newProperties];
                            newVariantOption = [...newVariantOption, existingVariantOption];
                        }
                        const optionsFromExidting = existingVariant.options ? existingVariant.options : [];
                        existingVariant.options = [...optionsFromExidting, ...newVariantOption];
                        newVariant = existingVariant;
                    }
                    if (!existingVariant) {
                        const variantObj = new Variant();
                        variantObj.name = variants[key].name;
                        variantObj.options = newVariantOption;
                        newVariant = await getRepository(Variant).manager.save(variantObj);
                    };
                };
                variantsArr = [...variantsArr, newVariant];
            };
            for (let idx in variantsArr) {
                const { options } = variantsArr[idx];
                for (let key in options) {
                    await this.addToRelation({ model: "Product", property: "variantOptions" }, product.id, options[key].properties);
                    await this.addToRelation({ model: "Variant", property: "options" }, variantsArr[idx].id, options[key]);
                    await this.addToRelation({ model: "VariantOption", property: "properties" }, options[key].id, options[key].properties);
                };
            };
            product.types = typesArr;
            product.variantOptions = variantsArr;
            return product;
        }
        catch (error) {
            throw (error);
        }
    }

    public async saveProperties(variantPoperties) {
        try {
            const properties = new ProductVariantOption();
            properties.SKU = variantPoperties.SKU;
            properties.barcode = variantPoperties.barcode;
            properties.price = variantPoperties.price;
            properties.quantity = variantPoperties.quantity;
            let newProperties = await getRepository(ProductVariantOption).manager.save(properties);
            return newProperties;
        } catch (error) {
            throw error;
        }
    }

    public async saveVariantOption(optionName, newProperties) {
        try {
            const variantOption = new VariantOption();
            variantOption.optionName = optionName;
            variantOption.createAt = new Date().toISOString();
            variantOption.properties = [newProperties];
            const newVariantOption = await getRepository(VariantOption).manager.save(variantOption);
            return newVariantOption;
        } catch (error) {
            throw error;
        }
    }

    public async saveType(typeName) {
        try {
            let productType = {};
            const existingType = await getRepository(Type).findOne({ typeName });
            if (!existingType) {
                const newType = new Type();
                newType.typeName = typeName;
                productType = await getConnection().manager.save(newType);
            } else {
                productType = existingType;
            };
            return productType;
        } catch (error) {
            throw error;
        }
    }

    public async checkAndAddType(typeName) {
        try {
            let productType = {};
            const existingType = await getRepository(Type).find({
                typeName
            });
            if (existingType.length === 0) {
                const newType = new Type();
                newType.typeName = typeName;
                productType = await getConnection().manager.save(newType);
            } else {
                productType = existingType;
            };
            return productType;
        }
        catch (error) {
            throw error;
        };
    }

    public async ChangeType(type: any, productId: number): Promise<Type> {
        const { id, typeName } = type
        let updatedType;
        if (id) {
            await getRepository(Type).update(id, { typeName })
            updatedType = await getRepository(Type).findOne(id);
        } else {
            updatedType = await this.saveType(typeName);
            this.addToRelation({ model: "Product", property: "types" }, productId, updatedType)
        }

        return updatedType;
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

    public async updateProduct(productId: number, pickUpAddress: any, type: any): Promise<any> {
        try {
            await getRepository(Product).update(productId, { pickUpAddress, updatedOn: new Date().toISOString() });
            await this.ChangeType(type, productId);
            const updatedProduct = await getRepository(Product).findOne(productId, { relations: ["types"] });
            return updatedProduct;
        } catch (err) {
            throw err;
        }
    }
}
