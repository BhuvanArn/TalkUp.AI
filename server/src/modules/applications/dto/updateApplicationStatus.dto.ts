import { ApiProperty, ApiSchema } from "@nestjs/swagger";
import { IsEnum } from "class-validator";
import { ApplicationStatus } from "@common/enums/ApplicationStatus";

@ApiSchema({
  name: "UpdateApplicationStatusRequest",
  description: "New tracking status for an application",
})
export class UpdateApplicationStatusDto {
  @IsEnum(ApplicationStatus)
  @ApiProperty({
    enum: ApplicationStatus,
    example: ApplicationStatus.INTERVIEW,
  })
  status: ApplicationStatus;
}
