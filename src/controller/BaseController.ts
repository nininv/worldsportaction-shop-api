import { Inject } from "typedi";
import ProductService from "../services/ProductService";
import OrganisationService from "../services/OrganisationService";
import TypeService from "../services/TypeService";
import SKUService from "../services/SKUService";
import ProductVariantService from "../services/ProductVariantService";
import ProductVariantOptionService from "../services/ProductVariantOptionService";
import OrganisationLogoService from "../services/OrganisationLogoService";
import PickUpAddressService from "../services/PickUpAddressService";

export class BaseController {

    @Inject()
    protected productService: ProductService;

    @Inject()
    protected organisationService: OrganisationService;

    @Inject()
    protected organisationLogoService: OrganisationLogoService;

    @Inject()
    protected productVariantService: ProductVariantService;

    @Inject()
    protected productVariantOptionService: ProductVariantOptionService;

    @Inject()
    protected pickUpAddressService: PickUpAddressService;

    @Inject()
    protected skuService: SKUService;

    @Inject()
    protected typeService: TypeService;

}
