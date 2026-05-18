import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from "typeorm";

export type SplitParty = "男方家" | "女方家" | "双方共担";

@Entity()
export class Split {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ type: "integer" })
  expenseId!: number;

  @Column({ type: "text" })
  party!: SplitParty;

  @Column({ type: "real" })
  percentage!: number;

  @Column({ type: "real" })
  amountDue!: number;

  @Column({ type: "real", default: 0 })
  amountPaid!: number;

  @Column({ type: "text", nullable: true })
  remarks?: string;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}
