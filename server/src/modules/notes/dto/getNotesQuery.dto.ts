import { ApiPropertyOptional, ApiSchema } from "@nestjs/swagger";
import { Transform } from "class-transformer";
import { IsOptional, IsUUID, IsBoolean } from "class-validator";

@ApiSchema({
  name: "GetNotesQueryDto",
  description: "Query parameters for listing notes",
})
export class GetNotesQueryDto {
  @ApiPropertyOptional({
    description: "Return only notes linked to this interview.",
    example: "019ac5a6-ada7-7a96-9a38-23819f37ab90",
  })
  @IsOptional()
  @IsUUID()
  interviewId?: string;

  @ApiPropertyOptional({
    description:
      "When true, return only standalone notes (no interview linkage). Mutually exclusive with interviewId.",
    example: true,
  })
  @Transform(({ value }) => value === "true")
  @IsOptional()
  @IsBoolean()
  standalone?: boolean;
}
