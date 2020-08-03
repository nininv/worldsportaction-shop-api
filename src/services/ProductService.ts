import { Service } from "typedi";
import { getConnection, getRepository } from 'typeorm';
import BaseService, { PaginationData } from "./BaseService";
import { Product } from "../models/Product";
import { SKU } from "../models/SKU";
import { Image } from "../models/Image";
import TypeService from "../services/TypeService";
import OrganisationService from "./OrganisationService";
import ProductVariantService from './ProductVariantService';
import SKUService from "./SKUService";
import OrganisationLogoService from "./OrganisationLogoService";
import { Type } from "../models/Type";
import { Affiliates } from "../models/Affiliates";
import { ProductVariant } from "../models/ProductVariant";
import { saveImages, addImages, deleteImages } from "./ImageService";

interface ImageLogo {
    url: string;
    id: number,
    createdBy: number;
    isDeleted: number;
    updatedBy: number;
    updatedOn: Date;
    organisationId: number;
};

export interface ParseProduct {
    id: number;
    productName: string;
    description: string;
    images: Image[] | ImageLogo[];
    type: Type;
    affiliates: Affiliates;
    tax: number;
    inventoryTracking: boolean;
    createByOrg: number;
    organisationUniqueKey: string;
    deliveryType: string;
    availableIfOutOfStock: number;
    width: number;
    length: number;
    height: number;
    weight: number;
    price: number;
    quantity: number;
    cost: number;
    barcode: string;
    skuCode: string;
    variants: ProductVariant[];
    createdBy: number;
    updatedBy: number;
    createdOn: Date;
    updatedOn: Date;
    isDeleted: number;
};

interface ProductForEndUser {
    id: number;
    productName: string;
    images: Image[] | ImageLogo[];
    price: number;
    variants: ProductVariant[];
    tax: number;
};


interface IListResult {
    count: number;
    result: ParseProduct[];
};

export interface SortData {
    sortBy: string;
    order: 'ASC' | 'DESC';
};

@Service()
export default class ProductService extends BaseService<Product> {

    modelName(): string {
        return Product.name;
    }

    public async getCount(condition: string, variables): Promise<number> {
        try {
            const count = await getConnection()
                .getRepository(Product)
                .createQueryBuilder("product")
                .leftJoinAndSelect("product.images", "images")
                .leftJoinAndSelect("product.type", "type")
                .leftJoinAndSelect("product.SKU", "SKU", "SKU.isDeleted = 0  AND SKU.quantity > :min", { min: 0 })
                .leftJoinAndSelect("SKU.productVariantOption", "productVariantOption", "productVariantOption.isDeleted = 0")
                .leftJoinAndSelect("productVariantOption.variant", "productVariant", "productVariant.isDeleted = 0")
                .where(condition, variables)
                .getCount();
            return count;
        } catch (error) {
            throw error;
        }
    }

    public async getMany(condition: string, variables, paginationData: PaginationData, sort?: SortData): Promise<Product[]> {
        try {
            const list = await getConnection()
                .getRepository(Product)
                .createQueryBuilder("product")
                .leftJoinAndSelect("product.images", "images")
                .leftJoinAndSelect("product.type", "type")
                .leftJoinAndSelect("product.SKU", "SKU", "SKU.isDeleted = 0  AND SKU.quantity > :min", { min: 0 })
                .leftJoinAndSelect("SKU.productVariantOption", "productVariantOption", "productVariantOption.isDeleted = 0")
                .leftJoinAndSelect("productVariantOption.variant", "productVariant", "productVariant.isDeleted = 0")
                .where(condition, variables)
                .orderBy(sort && sort.sortBy ? `product.${sort.sortBy}` : null, sort && sort.order ? sort.order : 'ASC')
                .skip(paginationData.offset)
                .take(paginationData.limit)
                .getMany();
            return list;
        } catch (error) {
            throw error;
        }
    }

    public async getOne(condition: string, variables): Promise<Product> {
        try {
            const product = await getConnection()
                .getRepository(Product)
                .createQueryBuilder("product")
                .leftJoinAndSelect("product.images", "images")
                .leftJoinAndSelect("product.type", "type")
                .leftJoinAndSelect("product.SKU", "SKU", "SKU.productId = :id AND SKU.isDeleted = 0", { id: variables.id })
                .leftJoinAndSelect("SKU.productVariantOption", "productVariantOption", "productVariantOption.isDeleted = 0")
                .leftJoinAndSelect("productVariantOption.variant", "productVariant", "productVariant.isDeleted = 0")
                .where(condition, variables)
                .getOne();
            return product;
        } catch (error) {
            throw error;
        }
    }

    public async getProductList(search: string, sort: SortData, paginationData: PaginationData, organisationId: number): Promise<IListResult> {
        try {
            const organisationFirstLevel = await this.getAffiliatiesOrganisations([organisationId], 3);
            const organisationSecondLevel = await this.getAffiliatiesOrganisations([organisationId], 4);
            const condition = `product.isDeleted = 0
                AND (type.typeName LIKE :search OR product.productName LIKE :search)
                AND ((product.affiliates.direct = 1 AND product.createByOrg = :organisationId) 
                ${organisationFirstLevel.length > 0
                    ? ' OR (product.affiliates.firstLevel = 1 AND product.createByOrg IN (:...organisationFirstLevel))'
                    : ''} 
                ${organisationSecondLevel.length > 0
                    ? ' OR (product.affiliates.secondLevel = 1 AND product.createByOrg IN (:...organisationSecondLevel))'
                    : ''})`;
            const variables = { search, organisationId, organisationFirstLevel, organisationSecondLevel };
            const products = await this.getMany(condition, variables, paginationData, sort)
            const count = await this.getCount(condition, variables)
            let result = await this.parseProductList(products);
            return { count, result };
        } catch (error) {
            throw error;
        }
    }

    public async getProductListForEndUser(type: number, organisationIds: number[], paginationData): Promise<{ count: number, result: ProductForEndUser[] }> {
        try {
            const organisationFirstLevel = await this.getAffiliatiesOrganisations(organisationIds, 3);
            const organisationSecondLevel = await this.getAffiliatiesOrganisations(organisationIds, 4);
            const condition = `product.isDeleted = 0 
                ${type ? 'AND product.type.id = :type' : ''}
                AND ((product.affiliates.direct = 1 AND product.createByOrg IN (:...organisationIds))
                ${organisationFirstLevel.length > 0
                    ? ' OR (product.affiliates.firstLevel = 1 AND product.createByOrg IN (:...organisationFirstLevel))'
                    : ''}
                ${organisationSecondLevel.length > 0
                    ? ' OR (product.affiliates.secondLevel = 1 AND product.createByOrg IN (:...organisationSecondLevel))'
                    : ''})`;
            const products = await this.getMany(condition, { type, organisationIds, organisationFirstLevel, organisationSecondLevel }, paginationData);
            const count = await this.getCount(condition, { type, organisationIds, organisationFirstLevel, organisationSecondLevel });
            const productVariantService = new ProductVariantService();
            const result = products.map((product) => {
                const parseProduct = productVariantService.parseVariant(product);
                const { id, productName, images, price, variants, tax } = parseProduct;
                return {
                    id,
                    productName,
                    images,
                    price,
                    variants,
                    tax
                }
            });
            return { count, result };
        } catch (error) {
            throw error;
        }
    }


    public async getAffiliatiesOrganisations(organisationId: number[], level: number): Promise<number[]> {
        try {
            let organisations = [];
            for (const key in organisationId) {
                const affiliatesOrganisations = await this.entityManager.query(
                    `select * from wsa_users.linked_organisations 
                where linked_organisations.linkedOrganisationId = ? 
                AND linked_organisations.linkedOrganisationTypeRefId = ?`,
                    [organisationId[key], level]
                );
                if (affiliatesOrganisations) {
                    organisations = [...organisations, ...affiliatesOrganisations.map(org => org.inputOrganisationId)];
                }
            }
            return organisations;
        } catch (err) {
            throw err;
        }
    }

    public async getProductById(id: number): Promise<ParseProduct> {
        try {
            const condition = `product.id = :id AND product.isDeleted = 0`;
            const product = await this.getOne(condition, { id })
            if (product) {
                const variantService = new ProductVariantService();
                const parseProduct: ParseProduct = variantService.parseVariant(product);
                if (parseProduct.images.length === 0) {
                    const organisationLogo = await this.getOrganisationLogo(parseProduct.createByOrg);;
                    parseProduct.images = [organisationLogo];
                }
                return parseProduct;
            } else {
                throw new Error("This product doesn't exists")
            }
        } catch (error) {
            throw error;
        }
    }

    public async parseProductList(products): Promise<ParseProduct[]> {
        const variantService = new ProductVariantService();
        const parseProductList = products.map(product => variantService.parseVariant(product));
        let result = [];
        for (const key in parseProductList) {
            const product = parseProductList[key];
            const { id, productName, price, variants,
                cost, tax, barcode, skuCode, quantity, createdOn,
                affiliates, createByOrg, organisationUniqueKey } = product;
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
                const organisationLogo = await this.getOrganisationLogo(createByOrg);
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

    public async getOrganisationLogo(createByOrg): Promise<ImageLogo> {
        try {
            const organisationLogoService = new OrganisationLogoService();
            const logo = await organisationLogoService.findByOrganisationId.call(this, createByOrg);
            if (logo) {
                const { createdBy,
                    id,
                    isDeleted,
                    updatedBy,
                    updatedOn,
                    logoUrl,
                    organisationId } = logo;
                const image: ImageLogo = {
                    url: logoUrl,
                    createdBy,
                    id,
                    isDeleted,
                    updatedBy,
                    updatedOn,
                    organisationId
                };
                return image;
            }
        } catch (err) {
            throw err;
        }
    }

    public async addProduct(data, images: Image[], userId: number): Promise<ParseProduct> {
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
                price,
                cost,
                skuCode,
                barcode,
                quantity,
                tax
            } = data;
            let productType: Type;
            if (type) {
                productType = await typeService.saveType(type.typeName, userId);
            }
            const organisationService = new OrganisationService();
            const createByOrg: number = await organisationService.findByUniquekey(organisationUniqueKey);
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
            newProduct.createdBy = userId;
            newProduct.createdOn = new Date();
            newProduct.images = images;
            const product: Product = await getRepository(Product).save(newProduct);
            const skuService = new SKUService();
            await skuService.saveSKU(price, cost, skuCode, barcode, quantity, product.id, userId);
            const variantService = new ProductVariantService();
            const savedVariants = await variantService.saveProductVariantsAndOptions(variants, product.id, userId);
            return { ...product, price, quantity, cost, barcode, skuCode, variants: savedVariants };
        } catch (error) {
            throw error;
        }
    }

    public async getProductIdBySKUId(id: number): Promise<number> {
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
            const result = await this.entityManager.createQueryBuilder(Product, 'product')
                .update(Product)
                .set({ isDeleted: 1, updatedBy: userId, updatedOn: new Date() })
                .andWhere("id = :id", { id })
                .execute();
            if (result.affected === 0) {
                throw new Error(`This product don't found`);
            }
        } catch (error) {
            throw error;
        }
    }

    public async restoreProduct(id: number, userId): Promise<ParseProduct> {
        try {
            const a = await this.entityManager.createQueryBuilder(Product, 'product')
                .update(Product)
                .set({ isDeleted: 0, updatedBy: userId, updatedOn: new Date() })
                .andWhere("id = :id", { id })
                .execute();
            if (a.affected === 0) {
                throw new Error(`This product don't found`);
            }
            const product = this.getProductById(id);
            return product;
        } catch (error) {
            throw error;
        }
    }

    public async createOrUpdateProduct(data, productPhotos: Express.Multer.File[], userId): Promise<ParseProduct> {
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
                const condition = `product.id = :id`;
                const product = await this.getOne(condition, { id: data.id })
                if (product) {
                    const variantService = new ProductVariantService();
                    parseProduct = variantService.parseVariant(product);
                } else {
                    let images = [];
                    if (productPhotos) {
                        images = await addImages(productPhotos, userId)
                    }
                    const res = this.addProduct(data, images, userId);
                    return res;
                }
                const deletingImage = parseProduct.images.filter(image => (
                    !data.images || data.images.findIndex(img => img.id === image.id) === -1));
                let images = [];
                if (productPhotos) {
                    images = await saveImages(productPhotos, product, userId);
                }
                await deleteImages(deletingImage);
                let productType;
                if (type) {
                    productType = await typeService.saveType(type.typeName, userId);
                }
                if (parseProduct.variants !== variants) {
                    const variantService = new ProductVariantService();
                    const deletingVariants = parseProduct.variants.filter(variant => (
                        !variants || variants.length === 0 || (data.variants.indexOf(variant) === -1)
                    ));
                    await variantService.updateProductVariantsAndOptions(variants, id, userId, deletingVariants);
                }
                const skuWithoutVariant = product.SKU.find(sku => sku.productVariantOption === null);
                const skuService = new SKUService();
                await skuService.updateSKUWithoutVariant(skuWithoutVariant, data, userId);
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
                        updatedBy: userId,
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
                    images = await addImages(productPhotos, userId)
                }
                const res = this.addProduct(data, images, userId);
                return res;
            }
        } catch (error) {
            throw error;
        }
    }

}
