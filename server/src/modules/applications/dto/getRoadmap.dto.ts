import { ApiProperty, ApiSchema } from "@nestjs/swagger";
import { RoadmapExtraction } from "@common/utils/groqExtraction";

@ApiSchema({ name: "RoadmapTopic" })
export class RoadmapTopicDto {
  @ApiProperty() title: string;
  @ApiProperty({ enum: ["HIGH", "MED", "LOW"] })
  priority: "HIGH" | "MED" | "LOW";
  @ApiProperty() rationale: string;
  @ApiProperty() gap: boolean;
}

@ApiSchema({ name: "RoadmapTalkingPoint" })
export class RoadmapTalkingPointDto {
  @ApiProperty() mission: string;
  @ApiProperty() angle: string;
}

@ApiSchema({ name: "Roadmap" })
export class GetRoadmapDto {
  @ApiProperty({ minimum: 0, maximum: 100 }) match_score: number;
  @ApiProperty() summary: string;
  @ApiProperty({ type: [RoadmapTopicDto] }) topics: RoadmapTopicDto[];
  @ApiProperty({ type: [RoadmapTalkingPointDto] })
  talking_points: RoadmapTalkingPointDto[];

  static fromExtraction(roadmap: RoadmapExtraction): GetRoadmapDto {
    const dto = new GetRoadmapDto();
    dto.match_score = roadmap.match_score;
    dto.summary = roadmap.summary;
    dto.topics = roadmap.topics;
    // Default for roadmaps cached before this field existed (no migration).
    dto.talking_points = roadmap.talking_points ?? [];
    return dto;
  }
}
