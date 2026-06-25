import { ApiProperty, ApiPropertyOptional, ApiSchema } from "@nestjs/swagger";
import {
  IsEnum,
  IsOptional,
  IsString,
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
      "Optional free-text context (CV summary, job offer, preparation notes) injected into the STS system prompt.",
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
