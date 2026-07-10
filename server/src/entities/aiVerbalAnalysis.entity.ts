import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  JoinColumn,
  BeforeInsert,
  ManyToOne,
  Index,
} from "typeorm";
import { uuidv7 } from "uuidv7";

import { ai_interview } from "./aiInterview.entity";

@Entity()
export class ai_verbal_analysis {
  @PrimaryGeneratedColumn("uuid")
  analysis_id: string;

  @Index("UQ_ai_verbal_analysis_interview_id", { unique: true })
  @ManyToOne(() => ai_interview, { onDelete: "CASCADE" })
  @JoinColumn({ name: "interview_id" })
  interview_id: string;

  @Column({ type: "int", nullable: true })
  overall_score: number | null;

  @Column({ type: "jsonb" })
  aggregate: Record<string, unknown>;

  @Column({ type: "jsonb", default: [] })
  turns: Record<string, unknown>[];

  @CreateDateColumn({
    type: "timestamp with time zone",
    default: () => "CURRENT_TIMESTAMP",
  })
  created_at: Date;

  @UpdateDateColumn({
    type: "timestamp with time zone",
    default: () => "CURRENT_TIMESTAMP",
  })
  updated_at: Date;

  @BeforeInsert()
  generateUUIDv7() {
    if (!this.analysis_id) this.analysis_id = uuidv7();
  }
}
