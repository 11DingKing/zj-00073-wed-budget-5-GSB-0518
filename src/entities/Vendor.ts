import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, OneToMany } from "typeorm";
import { VendorQuote } from "./VendorQuote";
import { BudgetCategoryName } from "./BudgetCategory";

@Entity()
export class Vendor {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ type: "text" })
  name!: string;

  @Column({ type: "text" })
  category!: BudgetCategoryName;

  @Column({ type: "text", nullable: true })
  contactPhone?: string;

  @Column({ type: "text", nullable: true })
  wechat?: string;

  @Column({ type: "real", default: 0 })
  rating!: number;

  @Column({ type: "text", nullable: true })
  notes?: string;

  @OneToMany(() => VendorQuote, (quote) => quote.vendor, { cascade: true })
  quotes!: VendorQuote[];

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}
