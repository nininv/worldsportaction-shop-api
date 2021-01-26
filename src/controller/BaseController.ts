import { Inject } from "typedi";
import ProductService from "../services/ProductService";
import OrganisationService from "../services/OrganisationService";
import TypeService from "../services/TypeService";
import OrderService from "../services/OrderService";
import SKUService from "../services/SKUService";
import ProductVariantService from "../services/ProductVariantService";
import ProductVariantOptionService from "../services/ProductVariantOptionService";
import OrganisationLogoService from "../services/OrganisationLogoService";
import PickUpAddressService from "../services/PickUpAddressService";
import CartService from "../services/CartService";
import SellProductService from "../services/SellProductService";
import TransdirectService from "../services/TransdirectService";
import OrderGroupService from "../services/OrderGroupService";
import FetchService from "../services/FetchService";

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

    @Inject()
    protected orderService: OrderService;

    @Inject()
    protected cartService: CartService;

    @Inject()
    protected sellProductService: SellProductService;

    @Inject()
    protected transdirectService: TransdirectService;

    @Inject()
    protected orderGroupService: OrderGroupService;

    @Inject()
    protected fetchService: FetchService
}
