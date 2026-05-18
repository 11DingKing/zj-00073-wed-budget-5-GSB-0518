import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from "typeorm";
import { BudgetCategoryName } from "./BudgetCategory";
import { PaymentMethod, CurrencyCode } from "./Expense";

@Entity()
export class RecurringExpense {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ type: "text" })
  category!: BudgetCategoryName;

  @Column({ type: "text", nullable: true })
  subItem?: string;

  @Column({ type: "text", nullable: true })
  supplierName?: string;

  @Column({ type: "real" })
  amount!: number;

  @Column({ type: "text", default: "CNY" })
  currency!: CurrencyCode;

  @Column({ type: "real", nullable: true })
  foreignAmount?: number;

  @Column({ type: "text", default: "微信" })
  paymentMethod!: PaymentMethod;

  @Column({ type: "integer", default: 1 })
  dayOfMonth!: number;

  @Column({ type: "datetime" })
  startDate!: Date;

  @Column({ type: "datetime" })
  endDate!: Date;

  @Column({ type: "datetime", nullable: true })
  lastGeneratedDate?: Date;

  @Column({ type: "boolean", default: true })
  isActive!: boolean;

  @Column({ type: "text", nullable: true })
  remarks?: string;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}
