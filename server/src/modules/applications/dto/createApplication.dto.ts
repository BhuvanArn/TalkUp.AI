import { ApiProperty, ApiPropertyOptional, ApiSchema } from "@nestjs/swagger";
import {
  IsISO8601,
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
} from "class-validator";

@ApiSchema({
  name: "CreateApplicationRequest",
  description:
    "Public URL of a job-offer page; TalkUp scrapes it and creates an application",
})
export class CreateApplicationDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(2048)
  @ApiProperty({
    description: "URL of the job offer to scrape and analyze",
    example: "https://www.linkedin.com/jobs/view/1234567890",
  })
  url: string;

  @IsOptional()
  @IsISO8601()
  @ApiPropertyOptional({
    description: "Optional interview date/time (ISO 8601)",
    example: "2026-07-15T14:00:00.000Z",
  })
  interviewAt?: string;
}
