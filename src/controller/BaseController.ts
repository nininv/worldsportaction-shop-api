import { Inject } from "typedi";
import { Product } from "../models/Product";
import ProductService from "../services/ProductService";

export class BaseController {

    @Inject()
    protected productService: ProductService;


}
