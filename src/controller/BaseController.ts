import { Inject } from "typedi";
import ProductService from "../services/ProductService";
import TypeService from "../services/TypeService";

export class BaseController {

    @Inject()
    protected productService: ProductService;

    @Inject()
    protected typeService: TypeService;

}
