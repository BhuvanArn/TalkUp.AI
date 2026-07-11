import { ApiProperty } from "@nestjs/swagger";
import { IsIn } from "class-validator";

import { OrganizationUserRole } from "@common/enums/organizationUserRole";

export class UpdateMemberRoleDto {
  @IsIn([OrganizationUserRole.EMPLOYEE, OrganizationUserRole.USER])
  @ApiProperty({
    enum: [OrganizationUserRole.EMPLOYEE, OrganizationUserRole.USER],
    description: "New role for the member (admin roles are not assignable).",
  })
  role: typeof OrganizationUserRole.EMPLOYEE | typeof OrganizationUserRole.USER;
}
