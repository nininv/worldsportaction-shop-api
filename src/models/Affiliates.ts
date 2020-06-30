import { Column } from "typeorm";

export class Affiliates {

    @Column({ default: 0, name:'Direct' })
    direct: number;

    @Column({ default: 0, name:'FirstLevel' })
    firstLevel: number;

    @Column({ default: 0, name:'SecondLevel' })
    secondLevel: number;
}