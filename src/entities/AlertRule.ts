import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
} from "typeorm";
import { Alert } from "./Alert";

export type RuleType =
  | "category_weekly_spend"
  | "total_spend_growth"
  | "supplier_payment_overdue";

export type SeverityLevel = "low" | "medium" | "high" | "critical";

@Entity()
export class AlertRule {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ type: "text" })
  name!: string;

  @Column({ type: "text" })
  ruleType!: RuleType;

  @Column({ type: "real", nullable: true })
  thresholdAmount?: number;

  @Column({ type: "real", nullable: true })
  thresholdPercentage?: number;

  @Column({ type: "integer", nullable: true })
  thresholdDays?: number;

  @Column({ type: "text", nullable: true })
  categoryName?: string;

  @Column({ type: "text", nullable: true })
  supplierName?: string;

  @Column({ type: "text", default: "medium" })
  severity!: SeverityLevel;

  @Column({ type: "boolean", default: true })
  isEnabled!: boolean;

  @Column({ type: "text", nullable: true })
  description?: string;

  @OneToMany(() => Alert, (alert) => alert.rule)
  alerts!: Alert[];

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}
