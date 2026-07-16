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
      "Return only notes for this application. Catches both application-scoped notes and in-simulation notes (their application is denormalized onto the note).",
    example: "019ac5a6-ada7-7a96-9a38-23819f37ab90",
  })
  @IsOptional()
  @IsUUID()
  applicationId?: string;

  @ApiPropertyOptional({
    description:
      "When true, return only standalone notes (no interview or application linkage). Mutually exclusive with interviewId and applicationId.",
    example: true,
  })
  @Transform(({ value }) =>
    typeof value === "string" ? value === "true" : value,
  )
  @IsOptional()
  @IsBoolean()
  standalone?: boolean;
}
