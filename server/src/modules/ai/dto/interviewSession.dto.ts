import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";

import { AiInterviewStatus } from "@common/enums/AiInterviewStatus";

export class InterviewSessionDto {
  @ApiProperty()
  interviewID: string;

  @ApiProperty({ enum: AiInterviewStatus })
  dbStatus: AiInterviewStatus;

  @ApiProperty({ enum: ["ready", "queued", "active", "ended"] })
  sessionStatus: "ready" | "queued" | "active" | "ended";

  @ApiProperty()
  queuePosition: number;

  @ApiPropertyOptional()
  entrypoint?: string | null;

  @ApiPropertyOptional()
  estimatedWaitSec?: number;
}
