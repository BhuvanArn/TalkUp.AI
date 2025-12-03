import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  OneToOne,
  JoinColumn,
  BeforeInsert,
} from "typeorm";
import { uuidv7 } from "uuidv7";

import { AuthProvider } from "@common/enums/AuthProvider";

@Entity()
export class user {
  @PrimaryGeneratedColumn("uuid")
  user_id: string;

  @Column({ nullable: false })
  username: string;

  @Column({
    nullable: true,
    comment: "user's profile picture as a base64 string",
  })
  profile_picture: string;

  @Column({
    nullable: true,
    comment: "used for password reset/verification code",
  })
  verification_code: string;

  @Column({ default: new Date() })
  created_at: Date;

  @Column({ default: new Date() })
  last_accessed_at: Date;

  @Column({ default: new Date() })
  updated_at: Date;

  @Column({
    enum: AuthProvider,
    type: "enum",
    nullable: false,
    default: AuthProvider.MANUAL,
    comment: "Authentication provider (e.g., manual, linkedin)",
  })
  provider: string;

  // ------ UUID manual generation to ensure V7 format ------ //

  @BeforeInsert()
  generateUUIDv7() {
    if (!this.user_id) this.user_id = uuidv7();
  }
}

@Entity()
export class user_oauth {
  @PrimaryGeneratedColumn()
  oauth_id: number;

  @Column({
    enum: AuthProvider,
    type: "enum",
    nullable: false,
    default: AuthProvider.LINKEDIN,
    comment: "Authentication provider (e.g., manual, linkedin)",
  })
  provider: string;

  @Column({ nullable: false })
  access_token: string;

  @Column({ nullable: true })
  refresh_token: string;

  @Column({ nullable: true })
  expires_in: string;

  @Column({ nullable: true })
  refresh_token_expires_in: string;

  @Column({ nullable: true })
  scope: string; // Scopes granted by oauth

  @OneToOne(() => user)
  @JoinColumn({ name: "user_id" })
  user_id: string;

  @Column({ nullable: true, default: new Date() })
  last_updated_at: Date;
}

/**
 * The user_email entity represents the relationship between a user and their email address.
 * It contains a foreign key to the User entity.
 * This allows for a one-to-one relationship between a user and their email address.
 */
@Entity()
export class user_email {
  @PrimaryGeneratedColumn()
  email_id: number;

  @Column({ nullable: false, unique: true })
  email: string;

  @Column({ nullable: false })
  user_id: string;

  @OneToOne(() => user, { onDelete: "CASCADE" })
  @JoinColumn({ name: "user_id" })
  user: user;

  @Column({
    default: false,
    comment: "to check if the user has verified their email",
  })
  is_verified: boolean;
}

/**
 * The user_password entity represents the relationship between a user and their password.
 * It contains a foreign key to the User entity.
 * This allows for a one-to-one relationship between a user and their password.
 */
@Entity()
export class user_password {
  @PrimaryGeneratedColumn()
  password_id: number;

  @Column({ nullable: false })
  user_id: string;

  @OneToOne(() => user)
  @JoinColumn({ name: "user_id" })
  user: user;

  @Column({ nullable: false })
  password: string;
}

/**
 * The user_phonenumber entity represents the relationship between a user and their phone number.
 * It contains a foreign key to the User entity.
 * This allows for a one-to-one relationship between a user and their phone number.
 */
@Entity()
export class user_phone_number {
  @PrimaryGeneratedColumn()
  phone_number_id: number;

  @Column({ nullable: false })
  user_id: string;

  @OneToOne(() => user)
  @JoinColumn({ name: "user_id" })
  user: user;

  @Column({ unique: true, nullable: false })
  phone_number: string;

  @Column({
    default: false,
    comment: "to check if the user has verified their phone number",
  })
  is_verified: boolean;
}
