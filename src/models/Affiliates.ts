import { Column } from "typeorm";

export class Affiliates {

    @Column({ default: 0 })
    _direct: number;

    @Column({ default: 0 })
    _first_level: number;

    @Column({ default: 0 })
    _second_level: number;
}