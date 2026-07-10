import { ApiPropertyOptional, ApiSchema } from "@nestjs/swagger";
import { IsEnum, IsISO8601, IsOptional, ValidateIf } from "class-validator";
import { ApplicationStatus } from "@common/enums/ApplicationStatus";

@ApiSchema({
  name: "UpdateApplicationRequest",
  description:
    "Partial update of an application: a new tracking status and/or interview date",
})
export class UpdateApplicationStatusDto {
  @IsOptional()
  @IsEnum(ApplicationStatus)
  @ApiPropertyOptional({
    enum: ApplicationStatus,
    example: ApplicationStatus.INTERVIEW,
  })
  status?: ApplicationStatus;

  // Accepts an ISO date to set/clear the interview; null explicitly clears it.
  @IsOptional()
  @ValidateIf((_, value) => value !== null)
  @IsISO8601()
  @ApiPropertyOptional({
    description: "Interview date/time (ISO 8601), or null to clear it",
    example: "2026-07-15T14:00:00.000Z",
    nullable: true,
  })
  interviewAt?: string | null;
}
