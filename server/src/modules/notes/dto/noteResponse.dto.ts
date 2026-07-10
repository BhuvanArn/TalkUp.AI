import { ApiProperty, ApiSchema } from "@nestjs/swagger";

@ApiSchema({
  name: "NoteResponseDto",
  description: "A note returned to the client",
})
export class NoteResponseDto {
  @ApiProperty({ example: "019ac5a6-ada7-7a96-9a38-23819f37ab90" })
  note_id: string;

  @ApiProperty({ example: "019ac5a6-ada7-7a96-9a38-23819f37ab90" })
  user_id: string;

  @ApiProperty({
    nullable: true,
    description: "Linked interview id, or null for standalone notes.",
    example: null,
  })
  interview_id: string | null;

  @ApiProperty({ example: "Interview prep" })
  title: string;

  @ApiProperty({
    description: "TipTap HTML. Empty string when no body was saved.",
    example: "<p>Ask about the team structure</p>",
  })
  content: string;

  @ApiProperty({ example: "blue" })
  color: string;

  @ApiProperty({ example: false })
  is_favorite: boolean;

  @ApiProperty({ example: "2026-07-08T10:00:00.000Z" })
  created_at: Date;

  @ApiProperty({ example: "2026-07-08T10:00:00.000Z" })
  updated_at: Date;
}
