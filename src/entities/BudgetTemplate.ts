import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
} from "typeorm";

export type TemplateType =
  | "经济型"
  | "标准型"
  | "豪华型"
  | "奢华型"
  | "定制型";

export interface TemplateCategory {
  name: string;
  percentage: number;
  description?: string;
}

@Entity()
export class BudgetTemplate {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ type: "text", unique: true })
  name!: TemplateType;

  @Column({ type: "real" })
  totalBudget!: number;

  @Column({ type: "text" })
  description!: string;

  @Column({ type: "json" })
  categories!: TemplateCategory[];

  @Column({ type: "boolean", default: true })
  isActive!: boolean;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}
