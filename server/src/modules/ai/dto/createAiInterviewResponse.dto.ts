import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";

export type SimulationSessionPhase = "ready" | "queued" | "active";

export class CreateAiInterviewResponseDto {
  @ApiProperty()
  interviewID: string;

  @ApiProperty({ enum: ["ready", "queued", "active"] })
  status: SimulationSessionPhase;

  @ApiPropertyOptional({
    description:
      "WebSocket URL when status is ready (includes short-lived token).",
  })
  entrypoint?: string | null;

  @ApiProperty({ description: "0 when ready; 1-based position when queued." })
  queuePosition: number;

  @ApiPropertyOptional({
    description: "Rough wait estimate in seconds when queued.",
  })
  estimatedWaitSec?: number;
}
