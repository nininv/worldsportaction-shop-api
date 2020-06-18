import { Service } from "typedi";
import { getConnection, getRepository } from 'typeorm';
import BaseService from "./BaseService";
import { Product } from "../models/Product";
import { Type } from "../models/Type";
import { Variant } from "../models/Variants";
import { VariantOption } from "../models/VariantOption";
import { uploadImage } from "../services/FirebaseService";


@Service()
export default class ProductService extends BaseService<Product> {

    modelName(): string {
        return Product.name;
    }

    public async getProduct(search, sort, offset, limit) {
        try {
            const products = await getConnection()
                .getRepository(Product)
                .createQueryBuilder("products")
                // .leftJoinAndSelect("products.types", "type")
                .leftJoinAndSelect("products.id", "variant")
                // .leftJoinAndSelect("variant.variantOption", "variantOption")
                .where("type.typeName LIKE :search OR products.productName LIKE :search", { search })
                .andWhere("products.quantity > :min", { min: "0" })
                .orderBy(sort.sorterBy, sort.order)
                .limit(limit).offset(offset)
                .getMany();
            const results = products.map(product => {
                const { productName, image, price } = product;
                const types = product.types.map(type => type.typeName);
                return {
                    productName,
                    image,
                    price,
                    types
                };
            })
            return { totalCount: products.length, query: results };
        }
        catch (error) {
        }
    }

    public async addProduct(data) {
        try {
            const {
                productName,
                productPhoto,
                cost,
                description,
                price,
                affiliates,
                tax,
                barcode,
                SKU,
                quantity,
                invetoryTracking,
                variantName,
                deliveryType,
                variants,
                width,
                types,
                height,
                length,
                weight
            } = data;
            let image = '';
            if (productPhoto) {
                // image = await uploadImage(productPhoto);
            }
            let typesArr = [];
            for (let item in types) {
                let productType = {};
                const typeName = types[item];
                const existingType = await getRepository(Type).findOne({ typeName });
                if (!existingType) {
                    const newType = new Type();
                    newType.typeName = typeName;
                    productType = await getConnection().manager.save(newType);
                } else {
                    productType = existingType;
                }
                typesArr = [...typesArr, productType];
            }

            const newProduct = {
                productName,
                cost,
                description,
                price,
                affiliates,
                image,
                tax,
                barcode,
                SKU,
                quantity,
                invetoryTracking,
                variantName,
                deliveryType,
                length,
                height,
                weight,
                width
            };
            // create a product
            const product = await getConnection()
                .getRepository(Product)
                .save(newProduct);
            // const product = await save<Product>(Product, productValues);

            // add categories to this product
            for (let item in typesArr) {
                const obj = { model: "Product", property: "types" }
                await this.addToRelation(obj, product.id, typesArr[item])
            }

            let variantsArr = [];
            for (let item in variants) {
                const variantObj = new Variant();
                variantObj.name = variants[item].name;
                const newVariant = await getRepository(Variant).manager.save(variantObj);
                const option = await getConnection()
                    .getRepository(VariantOption)
                    .save(variants[item].options);
                variantsArr = [...variantsArr, { newVariant, option }];
            }

            for (let item in variantsArr) {
                const { options } = variants[item]
                for (let option in options) {
                    await this.addToRelation({ model: "Variant", property: "options" }, variantsArr[item].newVariant.id, options[option])
                    await this.addToRelation({ model: "Product", property: "variants" }, product.id, variants[item])
                }
            }
            return product;
        }
        catch (error) {

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
            }
            return productType;
        }
        catch (error) {

        }
    }


    public async addToRelation(relationObj: any, id: number, item: any) {
        const { model, property } = relationObj;
        await getConnection()
            .createQueryBuilder()
            .relation(model, property)
            .of(id)
            .add(item);
    }

}
