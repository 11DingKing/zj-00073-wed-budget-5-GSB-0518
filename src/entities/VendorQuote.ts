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

  @Column({ type: "real" })
  quotedPrice!: number;

  @Column({ type: "text", default: "CNY" })
  currency!: QuoteCurrency;

  @Column({ type: "datetime", default: () => "CURRENT_TIMESTAMP" })
  quotedAt!: Date;

  @Column({ type: "datetime", nullable: true })
  expiresAt?: Date;

  @Column({ type: "text", default: "pending" })
  status!: QuoteStatus;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}
