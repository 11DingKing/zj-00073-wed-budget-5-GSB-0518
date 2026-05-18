import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne } from "typeorm";
import { BudgetCategory } from "./BudgetCategory";

@Entity()
export class BudgetItem {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ type: "text" })
  name!: string;

  @Column({ type: "real", default: 0 })
  estimatedCost!: number;

  @Column({ type: "text", nullable: true })
  description?: string;

  @ManyToOne(() => BudgetCategory, (category) => category.items, { onDelete: "CASCADE" })
  category!: BudgetCategory;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}
