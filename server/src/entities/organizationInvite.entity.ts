import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  BeforeInsert,
  CreateDateColumn,
  Index,
  JoinColumn,
  ManyToOne,
} from "typeorm";
import { uuidv7 } from "uuidv7";

import { OrganizationInviteStatus } from "@common/enums/OrganizationInviteStatus";
import { Organization } from "./organization.entity";

/**
 * Per-invite unique signup code (F2/F13). One row per generated invite:
 * sender (`created_by`), optional email binding, redeemer (`accepted_by`).
 */
@Entity()
export class organization_invite {
  @PrimaryGeneratedColumn("uuid")
  invite_id: string;

  @Index({ unique: true })
  @Column({ type: "varchar", length: 12, nullable: false })
  code: string;

  @ManyToOne(() => Organization, { nullable: false, onDelete: "CASCADE" })
  @JoinColumn({ name: "organization_id" })
  organization: Organization;

  @Column({ type: "uuid", name: "organization_id" })
  organization_id: string;

  @Column({
    type: "varchar",
    nullable: true,
    default: null,
    comment: "when set, signup email must match case-insensitively",
  })
  email: string | null;

  @Column({
    type: "varchar",
    default: "user",
    comment: "org role granted to the redeemer",
  })
  role: string;

  @Column({
    type: "enum",
    enum: OrganizationInviteStatus,
    default: OrganizationInviteStatus.PENDING,
  })
  status: OrganizationInviteStatus;

  @Column({ type: "timestamptz", nullable: false })
  expires_at: Date;

  @Column({
    type: "uuid",
    nullable: false,
    comment: "user_id of the admin/employee who generated the invite",
  })
  created_by: string;

  @Column({
    type: "uuid",
    nullable: true,
    default: null,
    comment: "user_id of the candidate who redeemed the code",
  })
  accepted_by: string | null;

  @CreateDateColumn({ type: "timestamptz", default: () => "CURRENT_TIMESTAMP" })
  created_at: Date;

  @Column({ type: "timestamptz", nullable: true, default: null })
  accepted_at: Date | null;

  // ------ UUID manual generation to ensure V7 format ------ //

  @BeforeInsert()
  generateUUIDv7() {
    if (!this.invite_id) this.invite_id = uuidv7();
  }
}
