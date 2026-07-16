import { ApiPropertyOptional, ApiSchema } from "@nestjs/swagger";
import {
  IsOptional,
  IsString,
  IsBoolean,
  IsNotEmpty,
  MaxLength,
} from "class-validator";

@ApiSchema({
  name: "UpdateNoteDto",
  description: "Data Transfer Object for updating a note",
})
export class UpdateNoteDto {
  @ApiPropertyOptional({
    description: "Title of the note",
    example: "Interview prep (revised)",
  })
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  title?: string;

  @ApiPropertyOptional({
    description: "Note body as TipTap HTML",
    example: "<p>Updated</p>",
  })
  @IsOptional()
  @IsString()
  @MaxLength(100000)
  content?: string;

  @ApiPropertyOptional({
    description: "Named color for the note card",
    example: "green",
  })
  @IsOptional()
  @IsString()
  @MaxLength(30)
  color?: string;

  @ApiPropertyOptional({
    description: "Whether the note is marked favorite",
    example: true,
  })
  @IsOptional()
  @IsBoolean()
  is_favorite?: boolean;
}
