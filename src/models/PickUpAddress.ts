import { Column } from "typeorm";

export class PickUpAddress {
    @Column({ default: null })
    Address: string;

    @Column({ default: null })
    Suburb: string;

    @Column({ default: null })
    Postcode: number;

    @Column({ default: null })
    State: string;

}

