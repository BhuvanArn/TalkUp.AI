import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  OneToOne,
  JoinColumn,
  UpdateDateColumn,
  BeforeInsert,
} from "typeorm";
import { user } from "./user.entity";
import { uuidv7 } from "uuidv7";

@Entity()
export class user_job_offer {
  @PrimaryGeneratedColumn("uuid")
  job_offer_id: string;

  @Column({ nullable: false })
  user_id: string;

  // This part will establish a one-to-one relationship between the user_job_offer and user entities, allowing us to easily access the user associated with a given job offer.
  // The onDelete: "CASCADE" option ensures that if a user is deleted, their associated job offer will also be automatically removed from the database.
  @OneToOne(() => user, { onDelete: "CASCADE" })
  @JoinColumn({ name: "user_id" })
  user: user;

  @Column({ nullable: true })
  job_title: string;

  @Column({ nullable: true })
  company_name: string;

  @Column({ type: "text", nullable: true })
  company_description: string;

  @Column({ nullable: true })
  sector: string;

  @Column({ nullable: true })
  contract_type: string;

  @Column({ nullable: true })
  location: string;

  @Column({ type: "simple-array", nullable: true })
  required_skills: string[];

  @Column({ type: "simple-array", nullable: true })
  preferred_skills: string[];

  @Column({ nullable: true })
  required_experience: string;

  @Column({ nullable: true })
  required_education: string;

  @Column({ type: "simple-array", nullable: true })
  missions: string[];

  @Column({ type: "simple-array", nullable: true })
  soft_skills: string[];

  @Column({ type: "simple-array", nullable: true })
  languages_required: string[];

  @Column({ nullable: true })
  salary_range: string;

  @Column({ type: "simple-array", nullable: true })
  company_values: string[];

  @Column({ type: "text", nullable: true })
  team_description: string;

  @Column({ nullable: true })
  offer_url: string;

  @UpdateDateColumn()
  updated_at: Date;

  @BeforeInsert()
  generateUUIDv7() {
    if (!this.job_offer_id) this.job_offer_id = uuidv7();
  }
}
