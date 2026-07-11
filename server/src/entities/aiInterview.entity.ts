import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  JoinColumn,
  BeforeInsert,
  ManyToOne,
} from "typeorm";
import { uuidv7 } from "uuidv7";

import { AiInterviewStatus } from "@common/enums/AiInterviewStatus";
import { user } from "./user.entity";

@Entity()
export class ai_interview {
  @PrimaryGeneratedColumn("uuid")
  interview_id: string;

  @Column({ type: "varchar", length: 50 })
  type: string;

  @ManyToOne(() => user, (user) => user.user_id, { onDelete: "CASCADE" })
  @JoinColumn({ name: "user_id" })
  user_id: string;

  @Column({ type: "varchar", length: 30, default: "French" })
  language: string;

  @Column({
    type: "enum",
    enum: AiInterviewStatus,
    default: AiInterviewStatus.ASKED,
  })
  status: AiInterviewStatus;

  @Column({ type: "int", nullable: true })
  score: number;

  @Column({ type: "text", nullable: true })
  feedback: string;

  @Column({ type: "varchar", length: 2048, nullable: true, name: "video_link" })
  video_link: string;

  @Column({ type: "text", nullable: true, name: "job_context" })
  job_context: string | null;

  /** Application the candidate is training for (optional). */
  @Column({ type: "uuid", nullable: true, name: "application_id" })
  application_id: string | null;

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

  @Column({ type: "timestamp with time zone", nullable: true })
  ended_at?: Date;

  // ------ UUID manual generation to ensure V7 format ------ //

  @BeforeInsert()
  generateUUIDv7() {
    if (!this.interview_id) this.interview_id = uuidv7();
  }
}
