import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
} from "typeorm";

export type ShareRole = "parent" | "friend" | "family" | "other";

@Entity()
export class SharedAccess {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ type: "text", unique: true })
  shareToken!: string;

  @Column({ type: "text" })
  accessPassword!: string;

  @Column({ type: "text" })
  shareName!: string;

  @Column({ type: "text" })
  shareRole!: ShareRole;

  @Column({ type: "json", nullable: true })
  allowedCategories?: string[];

  @Column({ type: "datetime" })
  expiresAt!: Date;

  @Column({ type: "integer", default: 0 })
  viewCount!: number;

  @Column({ type: "datetime", nullable: true })
  lastViewedAt?: Date;

  @Column({ type: "boolean", default: true })
  isActive!: boolean;

  @Column({ type: "text", nullable: true })
  description?: string;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}
