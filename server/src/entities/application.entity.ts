import {
  Entity,
  Index,
  Column,
  PrimaryGeneratedColumn,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
  UpdateDateColumn,
  BeforeInsert,
} from "typeorm";
import { user } from "./user.entity";
import { uuidv7 } from "uuidv7";
import { ApplicationStatus } from "@common/enums/ApplicationStatus";
import type {
  CvExtraction,
  JobOfferExtraction,
  RoadmapExtraction,
} from "../common/utils/groqExtraction";

// createFromUrl() looks every new application up by (user_id, offer_url)
// before scraping, which was a full scan. Index user_id only, not the pair:
// offer_url is an unbounded varchar and a btree entry over a long URL can blow
// past Postgres' index-row size limit. A user holds few applications, so
// narrowing to their rows and filtering offer_url in memory is already the
// whole win. Applied by TypeORM synchronize — no migration.
@Index(["user_id"])
@Entity()
export class application {
  @PrimaryGeneratedColumn("uuid")
  application_id: string;

  // NOT unique — a user tracks many applications (unlike user_cv / the removed
  // user_job_offer, both one-per-user).
  @Column({ nullable: false })
  user_id: string;

  @ManyToOne(() => user, { onDelete: "CASCADE" })
  @JoinColumn({ name: "user_id" })
  user: user;

  @Column({ nullable: true })
  company_name: string;

  @Column({ nullable: true })
  job_title: string;

  @Column({ type: "varchar", default: ApplicationStatus.SENT })
  status: ApplicationStatus;

  @Column({ nullable: true })
  offer_url: string;

  @Column({ type: "json", nullable: true })
  offer_details: JobOfferExtraction | null;

  // Snapshot of the profile CV at creation time — a past application keeps the
  // CV that was actually used even if the profile CV changes later.
  @Column({ type: "json", nullable: true })
  cv_details: CvExtraction | null;

  // LLM-generated preparation path (F6). Null until the roadmap is first
  // requested; cached afterwards and only overwritten by an explicit
  // regenerate. Column is applied by TypeORM synchronize — no migration.
  @Column({ type: "json", nullable: true })
  roadmap: RoadmapExtraction | null;

  @Column({ type: "timestamp", default: () => "CURRENT_TIMESTAMP" })
  applied_at: Date;

  // Optional interview date/time the candidate sets (at creation or later).
  // Null until scheduled; shown on the kanban card.
  @Column({ type: "timestamp", nullable: true })
  interview_at: Date | null;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;

  @BeforeInsert()
  generateUUIDv7() {
    if (!this.application_id) this.application_id = uuidv7();
  }
}
