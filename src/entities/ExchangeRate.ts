import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from "typeorm";
import { CurrencyCode } from "./Expense";

@Entity()
export class ExchangeRate {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ type: "text", unique: true })
  currency!: CurrencyCode;

  @Column({ type: "text" })
  currencyName!: string;

  @Column({ type: "real" })
  rate!: number;

  @Column({ type: "datetime" })
  lastUpdated!: Date;

  @Column({ type: "text", nullable: true })
  remarks?: string;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}
