import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from "typeorm";

export type IncomeSource = "份子钱" | "红包" | "赞助" | "其他";

@Entity()
export class Income {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ type: "real" })
  amount!: number;

  @Column({ type: "text", default: "其他" })
  source!: IncomeSource;

  @Column({ type: "text", nullable: true })
  from?: string;

  @Column({ type: "datetime" })
  receivedDate!: Date;

  @Column({ type: "text", nullable: true })
  remarks?: string;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}
