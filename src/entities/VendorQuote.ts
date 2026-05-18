import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne } from "typeorm";
import { Vendor } from "./Vendor";
import { BudgetItem } from "./BudgetItem";

export type VendorQuoteStatus = "pending" | "accepted" | "rejected";

@Entity()
export class VendorQuote {
  @PrimaryGeneratedColumn()
  id!: number;

  @ManyToOne(() => Vendor, (vendor) => vendor.quotes, { onDelete: "CASCADE" })
  vendor!: Vendor;

  @ManyToOne(() => BudgetItem, { onDelete: "CASCADE" })
  budgetItem!: BudgetItem;

  @Column({ type: "real", comment: "报价金额" })
  quotedPrice!: number;

  @Column({ type: "text", default: "CNY", comment: "货币类型" })
  currency!: string;

  @Column({ type: "datetime", comment: "报价日期" })
  quotedAt!: Date;

  @Column({ type: "datetime", nullable: true, comment: "报价有效期至" })
  expiresAt?: Date;

  @Column({ type: "text", default: "pending", comment: "报价状态：pending/accepted/rejected" })
  status!: VendorQuoteStatus;

  @Column({ type: "text", nullable: true, comment: "备注" })
  notes?: string;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}
