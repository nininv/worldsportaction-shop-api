import { Column } from "typeorm";

export class Affiliates {

    @Column({ default: 0 })
    Direct: number;

    @Column({ default: 0 })
    FirstLevel: number;

    @Column({ default: 0 })
    SecondLevel: number;
}