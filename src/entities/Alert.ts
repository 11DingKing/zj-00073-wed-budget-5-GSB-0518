import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
} from "typeorm";
import { AlertRule, SeverityLevel } from "./AlertRule";

export type AlertStatus = "pending" | "acknowledged" | "resolved";

@Entity()
export class Alert {
  @PrimaryGeneratedColumn()
  id!: number;

  @ManyToOne(() => AlertRule, { nullable: false, onDelete: "CASCADE" })
  @JoinColumn()
  rule!: AlertRule;

  @Column({ type: "text" })
  message!: string;

  @Column({ type: "text" })
  severity!: SeverityLevel;

  @Column({ type: "text", default: "pending" })
  status!: AlertStatus;

  @Column({ type: "real", nullable: true })
  actualValue?: number;

  @Column({ type: "text", nullable: true })
  categoryName?: string;

  @Column({ type: "text", nullable: true })
  supplierName?: string;

  @Column({ type: "datetime", nullable: true })
  acknowledgedAt?: Date;

  @Column({ type: "datetime", nullable: true })
  resolvedAt?: Date;

  @Column({ type: "text", nullable: true })
  resolvedNote?: string;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}
