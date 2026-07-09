import { ApiProperty } from "@nestjs/swagger";
import { IsEmail, IsIn, IsOptional } from "class-validator";

import { OrganizationUserRole } from "@common/enums/organizationUserRole";

export class CreateOrganizationInviteDto {
  @IsOptional()
  @IsEmail()
  @ApiProperty({
    required: false,
    description:
      "When set, the invite is bound to this email: signup with the code must use it (case-insensitive).",
  })
  email?: string;

  @IsOptional()
  @IsIn([OrganizationUserRole.EMPLOYEE, OrganizationUserRole.USER])
  @ApiProperty({
    required: false,
    enum: [OrganizationUserRole.EMPLOYEE, OrganizationUserRole.USER],
    default: OrganizationUserRole.USER,
    description:
      "Role granted on redemption. Admins may pick employee or user; employees may only pick user.",
  })
  role?:
    | typeof OrganizationUserRole.EMPLOYEE
    | typeof OrganizationUserRole.USER;
}
