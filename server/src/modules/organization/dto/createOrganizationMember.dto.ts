import { ApiProperty } from "@nestjs/swagger";
import { IsEmail, IsIn, IsOptional, IsString, Length } from "class-validator";

import { OrganizationUserRole } from "@common/enums/organizationUserRole";

export class CreateOrganizationMemberDto {
  @Length(1, 50)
  @IsString()
  @ApiProperty({ description: "Display name for the new member" })
  username: string;

  @IsEmail()
  @ApiProperty()
  email: string;

  @IsIn([OrganizationUserRole.EMPLOYEE, OrganizationUserRole.USER])
  @ApiProperty({
    enum: [OrganizationUserRole.EMPLOYEE, OrganizationUserRole.USER],
    description:
      "Admins may create employee or user; employees may only create user.",
  })
  role: typeof OrganizationUserRole.EMPLOYEE | typeof OrganizationUserRole.USER;

  @IsOptional()
  @IsString()
  @ApiProperty({
    required: false,
    description:
      "If omitted, a secure password is generated and returned once.",
  })
  password?: string;
}
