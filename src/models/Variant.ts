import { BaseEntity, Column, Entity, PrimaryGeneratedColumn, OneToMany, CreateDateColumn, UpdateDateColumn } from "typeorm";
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

  @IsNumber()
  @Column()
  createdBy: number;

  @IsNumber()
  @Column({ nullable: true, default: null })
  updatedBy: number;

  @CreateDateColumn()
  createdOn: string;

  @UpdateDateColumn()
  updatedOn: string;
}
