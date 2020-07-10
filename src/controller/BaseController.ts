import { Inject } from "typedi";
import ProductService from "../services/ProductService";
import TypeService from "../services/TypeService";
import SKUService from "../services/SKUService";
import ProductVariantService from "../services/ProductVariantService";
import ProductVariantOptionService from "../services/ProductVariantOptionService";
export class BaseController {

    @Inject()
    protected productService: ProductService;

    @Inject()
    protected productVariantService: ProductVariantService;

    @Inject()
    protected productVariantOptionService: ProductVariantOptionService;

    @Inject()
    protected skuService: SKUService;

    @Inject()
    protected typeService: TypeService;

}
