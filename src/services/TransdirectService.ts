import { Service } from 'typedi';
import axios from 'axios';
require("dotenv").config();

@Service()
export default class ProductService {
    public async createBooking(orgProduct, name, address, email, postcode, phone, state, suburb, country): Promise<any> {
        try {
            const reqBody = {
                declared_value: "1000.00",
                referrer: "API",
                requesting_site: "https://worldsportaction.com",
                tailgate_pickup: true,
                tailgate_delivery: true,
                items: orgProduct.items,
                receiver: {
                    address,
                    company_name: "",
                    email,
                    name,
                    postcode,
                    phone,
                    state,
                    suburb,
                    type: "business",
                    country
                },
                sender: orgProduct.sender
            }
            const response = await axios.post(
                `${process.env.TRANSDIRECT_API_HOST}${'bookings/v4'}`,
                reqBody,
                {
                    headers: {
                        'Api-key': process.env.TRANSDIRECT_API_KEY,
                        'Content-Type': 'application/json'
                    }
                });
            return response;
        } catch (err) {
            throw err;
        }
    }
}
