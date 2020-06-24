import { Inject } from "typedi";
import { Product } from "../models/Product";
import ProductService from "../services/ProductService";
import OrganisationService from "../services/OrganisationService";

export class BaseController {

    @Inject()
    protected productService: ProductService;

    @Inject()
    protected organisationService: OrganisationService;

}
