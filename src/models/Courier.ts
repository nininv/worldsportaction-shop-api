import { Column } from "typeorm";
import { IsNumber, IsString } from "class-validator";

export class Courier {

    @IsNumber()
    @Column({ name:'BookingId' })
    bookingId: number;

    @IsString()
    @Column({ name:'Name' })
    name: string;

    @IsNumber()
    @Column({ name:'PriceInsuranceEx' })
    priceInsuranceEx: number;

    @IsNumber()
    @Column({ name:'Total' })
    total: number;

    @IsNumber()
    @Column({ name:'Fee' })
    fee: number;

    @IsNumber()
    @Column({ name:'AppliedGst' })
    appliedGst: number;

    @IsNumber()
    @Column({ name:'InsuredAmount' })
    insuredAmount: number;

    @IsString()
    @Column({ name:'Service' })
    service: string;

    @IsString()
    @Column({ name:'TransitTime' })
    transitTime: string;

    @Column({ name:'PickupDate' })
    pickupDate: Date;

    @IsString()
    @Column({ name:'PickupTimeFrom' })
    pickupTimeFrom: string;

    @IsString()
    @Column({ name:'PickupTimeTo' })
    pickupTimeTo: string;
}
