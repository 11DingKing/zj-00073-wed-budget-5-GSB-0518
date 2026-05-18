import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
} from "typeorm";
import { Vendor } from "./Vendor";
import { BudgetItem } from "./BudgetItem";

export type QuoteStatus = "pending" | "accepted" | "rejected";

@Entity()
export class VendorQuote {
  @PrimaryGeneratedColumn()
  id!: number;

  @ManyToOne(() => Vendor, (vendor) => vendor.quotes, { onDelete: "CASCADE" })
  vendor!: Vendor;

  @Column({ type: "integer", comment: "关联供应商ID" })
  vendorId!: number;

  @ManyToOne(() => BudgetItem)
  budgetItem!: BudgetItem;

  @Column({ type: "integer", comment: "关联预算项ID" })
  budgetItemId!: number;

  @Column({ type: "real", comment: "报价金额" })
  quotedPrice!: number;

  @Column({ type: "text", default: "CNY", comment: "币种" })
  currency!: string;

  @Column({ type: "datetime", comment: "报价日期" })
  quotedAt!: Date;

  @Column({ type: "datetime", nullable: true, comment: "报价过期日期" })
  expiresAt?: Date;

  @Column({ type: "text", default: "pending", comment: "报价状态: pending/accepted/rejected" })
  status!: QuoteStatus;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}
