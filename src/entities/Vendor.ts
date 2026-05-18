import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
} from "typeorm";
import { BudgetCategoryName } from "./BudgetCategory";
import { VendorQuote } from "./VendorQuote";

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

  @Column({ type: "integer", default: 3, comment: "评分1-5星" })
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
