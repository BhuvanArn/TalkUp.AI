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
export class user_cv {
  @PrimaryGeneratedColumn("uuid")
  cv_id: string;

  @Column({ nullable: false })
  user_id: string;

// This part will establish a one-to-one relationship between the user_cv and user entities, allowing us to easily access the user associated with a given CV. 
// The onDelete: "CASCADE" option ensures that if a user is deleted, their associated CV will also be automatically removed from the database.
  @OneToOne(() => user, { onDelete: "CASCADE" })
  @JoinColumn({ name: "user_id" })
  user: user;

  @Column({ nullable: true })
  desired_job: string;

  @Column({ type: "text", nullable: true })
  resume: string;

  @Column({ type: "json", nullable: true })
  experiences: {
    company: string;
    title: string;
    description: string;
    duration: string;
  }[];

  @Column({ type: "json", nullable: true })
  education: {
    degree: string;
    school_name: string;
    duration: string;
  }[];

  @Column({ type: "simple-array", nullable: true })
  technical_skills: string[];

  @Column({ type: "json", nullable: true })
  languages: {
    language: string;
    level: string;
  }[];

  @UpdateDateColumn()
  updated_at: Date;

  @BeforeInsert()
  generateUUIDv7() {
    if (!this.cv_id) this.cv_id = uuidv7();
  }
}