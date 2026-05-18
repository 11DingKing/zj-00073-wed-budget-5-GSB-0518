import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, OneToMany } from "typeorm";
import { VendorQuote } from "./VendorQuote";
import { BudgetCategoryName } from "./BudgetCategory";

@Entity()
export class Vendor {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ type: "text", comment: "供应商名称" })
  name!: string;

  @Column({ type: "text", comment: "所属预算分类" })
  category!: BudgetCategoryName;

  @Column({ type: "text", nullable: true, comment: "联系电话" })
  contactPhone?: string;

  @Column({ type: "text", nullable: true, comment: "微信号" })
  wechat?: string;

  @Column({ type: "real", default: 0, comment: "评分 1-5 星" })
  rating!: number;

  @Column({ type: "text", nullable: true, comment: "备注" })
  notes?: string;

  @OneToMany(() => VendorQuote, (quote) => quote.vendor, { cascade: true })
  quotes!: VendorQuote[];

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}
