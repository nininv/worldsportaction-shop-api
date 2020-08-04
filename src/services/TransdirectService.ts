import { Service } from 'typedi';
import axios from 'axios';
require("dotenv").config();

@Service()
export default class ProductService {
    public async createBooking(orgProduct, name, address, email, postcode, phone, state, suburb, country): Promise<any> {
        try {
            const reqBody = {
                declared_value: "10.00",
                referrer: "API",
                requesting_site: "https://worldsportaction.com",
                tailgate_pickup: false,
                tailgate_delivery: false,
                items: orgProduct.items,
                receiver: {
                    address,
                    company_name: name,
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
             return { message: err.response.data.message };
        }
    }

    public async confirmBooking(bookingId:number, courier: string, pickUpDate): Promise<any> {
        try {
            const reqBody = {
                courier,
                'pickup-date': pickUpDate
            }
            const confirmedBooking = await axios.post(
                `${process.env.TRANSDIRECT_API_HOST}${'bookings/v4/'}${bookingId}/confirm`,
                reqBody,
                {
                    headers: {
                        'Api-key': process.env.TRANSDIRECT_API_KEY,
                        'Content-Type': 'application/json'
                    },
                    params: {
                        'id': bookingId
                    }
                });
            return confirmedBooking;
        } catch (err) {
            throw err;
        }
    }
}
