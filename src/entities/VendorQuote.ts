import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn } from "typeorm";
import { BudgetItem } from "./BudgetItem";

export type QuoteStatus = "pending" | "accepted" | "rejected";
export type QuoteCurrency = "CNY" | "USD" | "EUR" | "JPY";

@Entity()
export class VendorQuote {
  @PrimaryGeneratedColumn()
  id!: number;

  @ManyToOne("Vendor", "quotes", { onDelete: "CASCADE" })
  @JoinColumn()
  vendor!: any;

  @ManyToOne(() => BudgetItem, { onDelete: "CASCADE" })
  @JoinColumn()
  budgetItem!: BudgetItem;

  @Column({ type: "real", comment: "报价金额" })
  quotedPrice!: number;

  @Column({ type: "text", default: "CNY", comment: "币种" })
  currency!: QuoteCurrency;

  @Column({ type: "datetime", default: () => "CURRENT_TIMESTAMP", comment: "报价时间" })
  quotedAt!: Date;

  @Column({ type: "datetime", nullable: true, comment: "报价过期时间" })
  expiresAt?: Date;

  @Column({ type: "text", default: "pending", comment: "报价状态 pending/accepted/rejected" })
  status!: QuoteStatus;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}
