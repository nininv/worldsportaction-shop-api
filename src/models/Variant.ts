import { BaseEntity, Column, Entity, PrimaryGeneratedColumn, OneToMany } from "typeorm";
import { IsNumber, IsString } from 'class-validator';
import { VariantOption } from './VariantOption'
@Entity('variant')
export class Variant extends BaseEntity {
  @IsNumber()
  @PrimaryGeneratedColumn()
  id: number;

  @IsString()
  @Column()
  name: string;

  @OneToMany(type => VariantOption, option => option.variant)
  options: VariantOption[];
}
