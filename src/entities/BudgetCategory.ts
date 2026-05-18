import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, OneToMany } from "typeorm";
import { BudgetItem } from "./BudgetItem";

export type BudgetCategoryName =
  | "场地租赁"
  | "婚庆布置"
  | "摄影摄像"
  | "婚纱礼服"
  | "婚车"
  | "喜糖伴手礼"
  | "请柬"
  | "司仪"
  | "化妆"
  | "花艺"
  | "灯光音响"
  | "婚宴酒席"
  | "蜜月旅行"
  | "其他";

@Entity()
export class BudgetCategory {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ type: "text", unique: true })
  name!: BudgetCategoryName;

  @Column({ type: "real", default: 0 })
  budgetLimit!: number;

  @Column({ type: "text", nullable: true })
  description?: string;

  @OneToMany(() => BudgetItem, (item) => item.category, { cascade: true })
  items!: BudgetItem[];

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}
