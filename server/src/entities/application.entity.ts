import {
  Entity,
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
} from "../common/utils/groqExtraction";

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

  @Column({ type: "timestamp", default: () => "CURRENT_TIMESTAMP" })
  applied_at: Date;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;

  @BeforeInsert()
  generateUUIDv7() {
    if (!this.application_id) this.application_id = uuidv7();
  }
}
