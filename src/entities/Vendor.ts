import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, OneToMany } from "typeorm";
import { BudgetCategory } from "./BudgetCategory";

@Entity()
export class Vendor {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ type: "text", comment: "供应商名称" })
  name!: string;

  @ManyToOne(() => BudgetCategory, { nullable: true })
  category?: BudgetCategory;

  @Column({ type: "text", nullable: true, comment: "联系电话" })
  contactPhone?: string;

  @Column({ type: "text", nullable: true, comment: "微信号" })
  wechat?: string;

  @Column({ type: "integer", default: 5, comment: "供应商评分 1-5" })
  rating!: number;

  @Column({ type: "text", nullable: true, comment: "供应商备注" })
  notes?: string;

  @OneToMany("VendorQuote", "vendor", { cascade: true })
  quotes!: any[];

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}
