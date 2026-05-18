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

  @Column({ type: "real" })
  quotedPrice!: number;

  @Column({ type: "text", default: "CNY" })
  currency!: string;

  @Column({ type: "datetime" })
  quotedAt!: Date;

  @Column({ type: "datetime", nullable: true })
  expiresAt?: Date;

  @Column({ type: "text", default: "pending" })
  status!: VendorQuoteStatus;

  @Column({ type: "text", nullable: true })
  notes?: string;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}
