import { ApiProperty, ApiPropertyOptional, ApiSchema } from "@nestjs/swagger";
import {
  IsEnum,
  IsOptional,
  IsString,
  IsUUID,
  Length,
  MaxLength,
} from "class-validator";

import { AiInterviewStatus } from "@common/enums/AiInterviewStatus";

@ApiSchema({
  name: "CreateAiInterviewDto",
  description: "Data transfer object for creating an AI interview request.",
})
export class CreateAiInterviewDto {
  @ApiProperty({
    description: "The type of AI interview to be conducted.",
    example: "technical",
  })
  @IsString()
  @Length(3, 50, {
    message: "Interview type must be between 3 and 50 characters long.",
  })
  type: string;

  @ApiProperty({
    description: "The language to be used in the AI interview.",
    example: "French",
    default: "French",
  })
  @IsString()
  @Length(2, 30, {
    message: "The language must be between 2 and 30 characters long.",
  })
  language: string;

  @ApiPropertyOptional({
    description:
      "Application to train on. The server loads the owned application row and injects CV + job offer into the STS system prompt (preferred over jobContext).",
    example: "01890000-0000-7000-8000-000000000001",
  })
  @IsOptional()
  @IsUUID("all", { message: "applicationId must be a valid UUID." })
  applicationId?: string;

  @ApiPropertyOptional({
    description:
      "Optional free-text context (legacy). Ignored when applicationId is provided.",
    example: "Candidate: 5 ans Java. Poste: dev backend fintech Paris.",
  })
  @IsOptional()
  @IsString()
  @MaxLength(8000)
  jobContext?: string;

  @ApiPropertyOptional({
    description: "The current status of the AI interview request.",
    example: AiInterviewStatus.ASKED,
    default: AiInterviewStatus.ASKED,
    enum: AiInterviewStatus,
  })
  @IsOptional()
  @IsEnum(AiInterviewStatus, {
    message: `Status must be one of the following values: ${Object.values(
      AiInterviewStatus,
    ).join(", ")}`,
  })
  status: AiInterviewStatus;
}
