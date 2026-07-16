import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  BeforeInsert,
  OneToMany,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from "typeorm";
import { uuidv7 } from "uuidv7";
import { user } from "./user.entity";

@Entity()
export class Organization {
  @PrimaryGeneratedColumn("uuid")
  organization_id: string;

  @Index({ unique: true })
  @Column({ nullable: false })
  organization_name: string;

  @Column({
    type: "text",
    nullable: true,
    comment: "organization's profile picture as a base64 data URI",
  })
  profile_picture: string;

  @CreateDateColumn({
    type: "timestamptz",
    default: () => "CURRENT_TIMESTAMP",
  })
  created_at: Date;

  @UpdateDateColumn({
    type: "timestamptz",
    default: () => "CURRENT_TIMESTAMP",
  })
  updated_at: Date;

  // ------ UUID manual generation to ensure V7 format ------ //

  @BeforeInsert()
  generateUUIDv7() {
    if (!this.organization_id) this.organization_id = uuidv7();
  }

  @OneToMany(() => user, (user) => user.organization_id)
  users: user[];
}
