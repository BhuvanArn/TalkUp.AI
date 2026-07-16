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

import { user } from "./user.entity";
import { ai_interview } from "./aiInterview.entity";
import { application } from "./application.entity";

@Entity()
export class note {
  @PrimaryGeneratedColumn("uuid")
  note_id: string;

  @ManyToOne(() => user, (user) => user.user_id, { onDelete: "CASCADE" })
  @JoinColumn({ name: "user_id" })
  user_id: string;

  @ManyToOne(() => ai_interview, (interview) => interview.interview_id, {
    onDelete: "SET NULL",
    nullable: true,
  })
  @JoinColumn({ name: "interview_id" })
  interview_id: string | null;

  // Application this note belongs to. Set directly for application-scoped notes
  // (roadmap "My notes"), and denormalized from the interview's application for
  // in-simulation notes — so filtering by application catches both without a
  // join. Null for general notes. SET NULL so deleting the application keeps the
  // note (it just becomes a general note).
  @ManyToOne(() => application, (app) => app.application_id, {
    onDelete: "SET NULL",
    nullable: true,
  })
  @JoinColumn({ name: "application_id" })
  application_id: string | null;

  @Column({ type: "varchar", length: 255 })
  title: string;

  @Column({ type: "text", nullable: true })
  content: string | null;

  @Column({ type: "varchar", length: 30, default: "blue" })
  color: string;

  @Column({ type: "boolean", default: false })
  is_favorite: boolean;

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

  // ------ UUID manual generation to ensure V7 format ------ //

  @BeforeInsert()
  generateUUIDv7() {
    if (!this.note_id) this.note_id = uuidv7();
  }
}
