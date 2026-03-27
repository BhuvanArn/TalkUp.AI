import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  PrimaryGeneratedColumn,
  Unique,
} from "typeorm";

import { OtpPurpose } from "@common/enums/OtpPurpose";

@Entity()
@Unique("UQ_otp_email_purpose", ["email", "purpose"])
export class Otp {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @Index()
  @Column({ nullable: false })
  email!: string;

  @Column({ nullable: false })
  codeHash!: string;

  @Column({
    enum: OtpPurpose,
    type: "enum",
    nullable: false,
  })
  purpose!: OtpPurpose;

  @Column({ type: "int", default: 0 })
  attempts!: number;

  @Column({
    type: "timestamp with time zone",
    nullable: false,
    default: () => "NOW() + INTERVAL '15 minutes'",
  })
  expiresAt!: Date;

  @CreateDateColumn({ type: "timestamp with time zone" })
  createdAt!: Date;
}
