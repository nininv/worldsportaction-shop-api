import { Column } from "typeorm";

export class Affiliates {

    @Column({ default: 0 })
    _direct: number;

    @Column({ default: 0 })
    _firstLevel: number;

    @Column({ default: 0 })
    _secondLevel: number;
}