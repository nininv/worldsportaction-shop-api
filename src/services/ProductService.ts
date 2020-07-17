import { Service } from "typedi";
import { getConnection, getRepository } from 'typeorm';
import BaseService from "./BaseService";
import { Product } from "../models/Product";
import { uploadImage, deleteImage } from "../services/FirebaseService";
import { SKU } from "../models/SKU";
import { Image } from "../models/Image";
import TypeService from "../services/TypeService";
import ProductVariantService from './ProductVariantService';
import SKUService from "./SKUService";
import OrganisationService from "./OrganisationService";
import OrganisationLogoService from "./OrganisationLogoService";

@Service()
export default class ProductService extends BaseService<Product> {

    modelName(): string {
        return Product.name;
    }

    public async getProductList(search, sort, offset, limit, organisationId): Promise<any> {
        try {
            const organisationFirstLevel = await this.getAffiliatiesOrganisations(organisationId, 3);
            const organisationSecondLevel = await this.getAffiliatiesOrganisations(organisationId, 4);
            const products = await getConnection()
                .getRepository(Product)
                .createQueryBuilder("product")
                .leftJoinAndSelect("product.images", "images")
                .leftJoinAndSelect("product.type", "type")
                .leftJoinAndSelect("product.SKU", "SKU", "SKU.isDeleted = 0  AND SKU.quantity > :min", { min: 0 })
                .leftJoinAndSelect("SKU.productVariantOption", "productVariantOption", " productVariantOption.isDeleted = 0")
                .leftJoinAndSelect("productVariantOption.variant", "productVariant", "productVariant.isDeleted = 0")
                .where("product.isDeleted = 0")
                .andWhere(`((product.affiliates.direct = 1 AND product.createByOrg = :organisationId) 
                ${organisationFirstLevel.length > 0 ? ' OR (product.affiliates.firstLevel = 1 AND product.createByOrg IN (:...organisationFirstLevel))' : ''} 
                ${organisationSecondLevel.length > 0 ? ' OR (product.affiliates.secondLevel = 1 AND product.createByOrg IN (:...organisationSecondLevel))' : ''})`,
                    { organisationId, organisationFirstLevel, organisationSecondLevel })
                .andWhere(
                    "(type.typeName LIKE :search OR product.productName LIKE :search)",
                    { search }
                )
                .orderBy(sort.sortBy ? `product.${sort.sortBy}` : null, sort.order)
                .orderBy(`productVariantOption.sortOrder`)
                .skip(offset)
                .take(limit)
                .getMany();
            const count = await this.getProductCount(search, { organisationId, organisationFirstLevel, organisationSecondLevel });
            let result = await this.parseProductList(products);
            return { count, result };
        } catch (error) {
            throw error;
        }
    }

    public async getAffiliatiesOrganisations(organisationId, level) {
        try {
            const affiliatesOrganisations = await this.entityManager.query(
                `select * from wsa_users.linked_organisations 
            where linked_organisations.linkedOrganisationId = ? 
            AND linked_organisations.linkedOrganisationTypeRefId = ?`,
                [organisationId, level]
            );
            let organisations = [];
            if (affiliatesOrganisations) {
                organisations = affiliatesOrganisations.map(org => org.inputOrganisationId);
            }
            return organisations;
        } catch (err) {
            throw err;
        }
    }

    public async getProductById(id): Promise<any> {
        try {
            const product = await getConnection()
                .getRepository(Product)
                .createQueryBuilder("product")
                .leftJoinAndSelect("product.images", "images")
                .leftJoinAndSelect("product.type", "type")
                .leftJoinAndSelect("product.SKU", "SKU", "SKU.productId = :id AND SKU.isDeleted = 0", { id })
                .leftJoinAndSelect("SKU.productVariantOption", "productVariantOption", "productVariantOption.isDeleted = 0")
                .leftJoinAndSelect("productVariantOption.variant", "productVariant", "productVariant.isDeleted = 0")
                .where("product.id = :id AND product.isDeleted = 0", { id })
                .getOne();
            if (product) {
                if (product.images.length === 0) {
                    const organisationLogoService = new OrganisationLogoService();
                    const organisationLogo = await organisationLogoService.findByOrganisationId.call(this, product.createByOrg);  
                    product.images = [organisationLogo];
                }
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

    public async getProductCount(search, organisationInfo): Promise<number> {
        try {
            const { organisationId, organisationFirstLevel, organisationSecondLevel } = organisationInfo;
            const count = await getConnection()
                .getRepository(Product)
                .createQueryBuilder("product")
                .leftJoinAndSelect("product.type", "type")
                .leftJoinAndSelect("product.SKU", "SKU", "SKU.isDeleted = 0  AND SKU.quantity > :min", { min: 0 })
                .leftJoinAndSelect("SKU.productVariantOption", "productVariantOption", " productVariantOption.isDeleted = 0")
                .leftJoinAndSelect("productVariantOption.variant", "productVariant")
                .where("product.isDeleted = 0")
                .andWhere(`((product.affiliates.direct = 1 AND product.createByOrg = :organisationId) 
                ${organisationFirstLevel.length > 0 ? ' OR (product.affiliates.firstLevel = 1 AND product.createByOrg IN (:...organisationFirstLevel))' : ''} 
                ${organisationSecondLevel.length > 0 ? ' OR (product.affiliates.secondLevel = 1 AND product.createByOrg IN (:...organisationSecondLevel))' : ''})`,
                    { organisationId, organisationFirstLevel, organisationSecondLevel })
                .andWhere(
                    "(type.typeName LIKE :search OR product.productName LIKE :search)",
                    { search }
                )
                .getCount();
            return count;
        } catch (error) {
            throw error;
        }
    }

    public async parseProductList(products) {
        const variantService = new ProductVariantService();
        const parseProductList = products.map(product => variantService.parseVariant(product));
        let result = [];
        const organisationLogoService = new OrganisationLogoService();
        for (const key in parseProductList) {
            const product = parseProductList[key];
            const { id, productName, price, variants, cost, tax, barcode, skuCode, quantity, createdOn, affiliates, createByOrg, organisationUniqueKey } = product;
            let images = product.images;
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
            if (images.length === 0) {
                const organisationLogo = await organisationLogoService.findByOrganisationId.call(this, createByOrg);  
                images = [organisationLogo];
            }
            result = [...result, {
                id,
                productName,
                createdOn,
                images,
                price,
                cost,
                organisationUniqueKey,
                tax,
                barcode,
                createByOrg,
                affiliates,
                skuCode,
                quantity,
                type,
                variants: variantOptionsTemp
            }] 
        }
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
                organisationUniqueKey,
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
                pickUpAddress,
                price,
                cost,
                skuCode,
                barcode,
                quantity,
                tax
            } = data;
            let productType;
            if (type) {
                productType = await typeService.saveType(type.typeName, user.id);
            }
            const organisationService = new OrganisationService();
            const createByOrg = await organisationService.findByUniquekey(organisationUniqueKey);
            const newProduct = new Product();
            newProduct.productName = productName;
            newProduct.description = description;
            newProduct.type = productType;
            newProduct.affiliates = affiliates;
            newProduct.availableIfOutOfStock = availableIfOutOfStock;
            newProduct.tax = tax;
            newProduct.organisationUniqueKey = organisationUniqueKey;
            newProduct.inventoryTracking = inventoryTracking;
            newProduct.createByOrg = createByOrg;
            newProduct.deliveryType = deliveryType;
            newProduct.length = length;
            newProduct.height = height;
            newProduct.weight = weight;
            newProduct.width = width;
            newProduct.createdBy = user.id;
            newProduct.createdOn = new Date();
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

    public async saveImages(productPhotos, productId, userId) {
        try {
            const images = await this.addImages(productPhotos, userId);
            let imageList = [];
            for (const key in images) {
                images[key].product = productId;
                const savedImage = await getRepository(Image).save(images[key]);
                imageList = [...imageList, savedImage];
            }
            return imageList;
        } catch (err) {
            throw err;
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
            if (data.id) {
                const { productName,
                    description,
                    affiliates,
                    inventoryTracking,
                    createByOrg,
                    organisationUniqueKey,
                    deliveryType,
                    tax,
                    availableIfOutOfStock,
                    width,
                    length,
                    height,
                    weight,
                    variants,
                    type,
                    id } = data;
                let parseProduct;
                const product = await getConnection()
                    .getRepository(Product)
                    .createQueryBuilder("product")
                    .leftJoinAndSelect("product.images", "images")
                    .leftJoinAndSelect("product.type", "type")
                    .leftJoinAndSelect("product.SKU", "SKU", "SKU.productId = :id", { id: data.id })
                    .leftJoinAndSelect("SKU.productVariantOption", "productVariantOption")
                    .leftJoinAndSelect("productVariantOption.variant", "productVariant")
                    .where("product.id = :id", { id })
                    .getOne();
                if (product) {
                    const variantService = new ProductVariantService();
                    parseProduct = variantService.parseVariant(product);

                } else {
                    const res = this.addProduct(data, productPhotos, user);
                    return res;
                }
                const deletingImage = parseProduct.images.filter(image => (
                    !data.images || data.images.findIndex(img => img.id === image.id) === -1));
                let images = [];
                if (productPhotos) {
                    images = await this.saveImages(productPhotos, product, user.id);
                }
                await this.deleteImages(deletingImage);
                let productType;
                if (type) {
                    productType = await typeService.saveType(type.typeName, user.id);
                }
                if (parseProduct.variants !== variants) {
                    const variantService = new ProductVariantService();
                    const deletingVariants = parseProduct.variants.filter(variant => !variants || variants.length === 0 || (data.variants.indexOf(variant) === -1))
                    await variantService.updateProductVariantsAndOptions(variants, id, user.id, deletingVariants);
                }
                const skuWithoutVariant = product.SKU.find(sku => sku.productVariantOption === null);
                const skuService = new SKUService();
                await skuService.updateSKUWithoutVariant(skuWithoutVariant, data, user.id);
                await getRepository(Product)
                    .createQueryBuilder()
                    .update(Product)
                    .set({
                        productName,
                        description,
                        affiliates,
                        inventoryTracking,
                        organisationUniqueKey,
                        createByOrg,
                        deliveryType,
                        availableIfOutOfStock,
                        width,
                        length,
                        tax,
                        height,
                        weight,
                        updatedBy: user.id,
                        updatedOn: new Date().toISOString(),
                        type: productType
                    })
                    .where('id = :id', { id })
                    .execute();
                const updatedProduct = await this.getProductById(id);
                return updatedProduct;
            } else {
                let images = [];
                if (productPhotos) {
                    images = await this.addImages(productPhotos, user.id)
                }
                const res = this.addProduct(data, images, user);
                return res;
            }
        } catch (error) {
            throw error;
        }
    }

    public async deleteImages(images) {
        try {
            for (const key in images) {
                await getConnection()
                    .createQueryBuilder()
                    .delete()
                    .from(Image)
                    .where("id = :id", { id: images[key].id })
                    .execute();
                const idx = images[key].url.indexOf('product/photo');
                const imageName = images[key].url.slice(idx);
                deleteImage(imageName);
            }
        } catch (err) {
            throw err;
        }
    }

    public async updateProduct(id: number, pickUpAddress: any, types: any[], userId): Promise<any> {
        try {
            const typeService = new TypeService();
            await getRepository(Product).update(id, {updatedBy: userId, updatedOn: new Date().toISOString() });
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
            const parseProduct = await this.parseProductList([product]);
            return parseProduct[0];
        } catch (error) {
            throw new Error(error);
        }
    }
}
