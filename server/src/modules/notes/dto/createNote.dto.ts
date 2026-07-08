import { ApiProperty, ApiPropertyOptional, ApiSchema } from "@nestjs/swagger";
import {
  IsNotEmpty,
  IsOptional,
  IsString,
  IsBoolean,
  IsUUID,
  MaxLength,
} from "class-validator";

@ApiSchema({
  name: "CreateNoteDto",
  description: "Data Transfer Object for creating a note",
})
export class CreateNoteDto {
  @ApiProperty({ description: "Title of the note", example: "Interview prep" })
  @IsNotEmpty()
  @IsString()
  @MaxLength(255)
  title: string;

  @ApiPropertyOptional({
    description: "Note body as TipTap HTML",
    example: "<p>Ask about the team structure</p>",
  })
  @IsOptional()
  @IsString()
  @MaxLength(100000)
  content?: string;

  @ApiPropertyOptional({
    description: "Named color for the note card",
    example: "blue",
  })
  @IsOptional()
  @IsString()
  color?: string;

  @ApiPropertyOptional({
    description: "Whether the note is marked favorite",
    example: false,
  })
  @IsOptional()
  @IsBoolean()
  is_favorite?: boolean;

  @ApiPropertyOptional({
    description:
      "Interview this note belongs to. Set for in-simulation notes; omit for standalone notes.",
    example: "019ac5a6-ada7-7a96-9a38-23819f37ab90",
  })
  @IsOptional()
  @IsUUID()
  interviewId?: string;
}
