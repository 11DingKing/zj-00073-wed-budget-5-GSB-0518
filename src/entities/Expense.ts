import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
} from "typeorm";
import { BudgetCategoryName } from "./BudgetCategory";
import { User } from "./User";

export type PaymentMethod = "现金" | "转账" | "信用卡" | "微信" | "支付宝";
export type ExpenseStatus = "已付" | "待付" | "已退款";
export type ApprovalStatus = "待审批" | "已批准" | "已驳回";
export type CurrencyCode = "CNY" | "USD" | "EUR" | "JPY";

@Entity()
export class Expense {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ type: "real" })
  amount!: number;

  @Column({ type: "text", default: "CNY" })
  currency!: CurrencyCode;

  @Column({ type: "real", nullable: true })
  foreignAmount?: number;

  @Column({ type: "real", nullable: true })
  exchangeRate?: number;

  @Column({ type: "text" })
  category!: BudgetCategoryName;

  @Column({ type: "text", nullable: true })
  subItem?: string;

  @Column({ type: "text", nullable: true })
  supplierName?: string;

  @Column({ type: "text", default: "微信" })
  paymentMethod!: PaymentMethod;

  @Column({ type: "datetime" })
  paymentDate!: Date;

  @Column({ type: "text", nullable: true })
  voucherImageUrl?: string;

  @Column({ type: "text", nullable: true })
  remarks?: string;

  @Column({ type: "text", default: "待付" })
  status!: ExpenseStatus;

  @Column({ type: "text", default: "待审批" })
  approvalStatus!: ApprovalStatus;

  @Column({ type: "text", nullable: true })
  rejectionReason?: string;

  @ManyToOne(() => User, { nullable: true })
  @JoinColumn()
  approvedBy?: User;

  @Column({ type: "datetime", nullable: true })
  approvedAt?: Date;

  @ManyToOne(() => User, { nullable: true })
  @JoinColumn()
  submittedBy?: User;

  @Column({ type: "boolean", default: false })
  isRecurring!: boolean;

  @Column({ type: "integer", nullable: true })
  recurringExpenseId?: number;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}
