import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from "typeorm";

export type InstallmentStatus = "待付" | "已付" | "逾期";

@Entity()
export class Installment {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ type: "text" })
  supplierName!: string;

  @Column({ type: "real" })
  totalAmount!: number;

  @Column({ type: "integer" })
  installmentCount!: number;

  @Column({ type: "real" })
  perInstallmentAmount!: number;

  @Column({ type: "integer" })
  installmentNumber!: number;

  @Column({ type: "datetime" })
  dueDate!: Date;

  @Column({ type: "text", default: "待付" })
  status!: InstallmentStatus;

  @Column({ type: "text", nullable: true })
  remarks?: string;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}
