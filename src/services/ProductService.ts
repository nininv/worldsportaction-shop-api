import { Service } from "typedi";
import { getConnection, getRepository } from 'typeorm';
import BaseService from "./BaseService";
import { Product } from "../models/Product";
import { Type } from "../models/Type";
import { Variant } from "../models/Variant";
import { VariantOption } from "../models/VariantOption";
import { uploadImage } from "../services/FirebaseService";


@Service()
export default class ProductService extends BaseService<Product> {

    modelName(): string {
        return Product.name;
    }

    public async getProductList(search, sort, offset, limit): Promise<any> {
        const products = await getConnection()
            .getRepository(Product)
            .createQueryBuilder("products")
            .leftJoinAndSelect("products.types", "type")
            .leftJoinAndSelect("products.variants", "variant")
            .leftJoinAndSelect("variant.options", "options")
            .where("products.quantity > :min", { min: 0 })
            .andWhere(
                "(type.typeName LIKE :search OR products.productName LIKE :search)",
                { search }
            )
            .orderBy(sort.sortBy, sort.order)
            .skip(offset)
            .take(limit)
            .getMany();
        const count = await this.getProductCount(search);
        return { count, products };
    }

    public async getProductCount(search): Promise<number> {
        const count = await getConnection()
            .getRepository(Product)
            .createQueryBuilder("products")
            .leftJoinAndSelect("products.types", "type")
            .where("products.quantity > :min", { min: 0 })
            .andWhere(
                "(type.typeName LIKE :search OR products.productName LIKE :search)",
                { search }
            )
            .getCount()
        return count;
    }

    public async addProduct(data, productPhoto) {
        try {
            const {
                productName,
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
                image = await uploadImage(productPhoto);
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
            const product = await getConnection()
                .getRepository(Product)
                .save(newProduct);
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
                    await this.addToRelation({ model: "Variant", property: "options" }, variantsArr[item].newVariant.id, options[option]);
                    await this.addToRelation({ model: "Product", property: "variants" }, product.id, variantsArr[item].newVariant);
                }
            }
            return product;
        }
        catch (error) {
            throw (error)
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
