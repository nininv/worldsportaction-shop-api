import { Inject } from "typedi";
import ProductService from "../services/ProductService";
import TypeService from "../services/TypeService";
import OrderService from "../services/OrderService";

export class BaseController {

    @Inject()
    protected productService: ProductService;

    @Inject()
    protected typeService: TypeService;

    @Inject()
    protected orderService: OrderService;
}
