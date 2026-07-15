import { ApiProperty, ApiPropertyOptional, ApiSchema } from "@nestjs/swagger";
import {
  IsArray,
  IsEnum,
  IsOptional,
  IsString,
  IsUUID,
  Length,
  ValidateNested,
  ArrayMaxSize,
} from "class-validator";
import { Type } from "class-transformer";

export enum ChatRole {
  USER = "user",
  ASSISTANT = "assistant",
}

/**
 * The page/surface the chat was opened from. Drives which owned data the server
 * loads and injects as grounding context.
 */
export enum ChatSurface {
  ROADMAP = "roadmap",
  SIMULATION = "simulation",
  AGENDA = "agenda",
  NOTES = "notes",
  CV = "cv",
}

/**
 * The current page's context — **identifiers only**. The server resolves the
 * actual data from these ids under the caller's ownership; a client never sends
 * a free-text context blob (no prompt-injection surface). Reuses the #154
 * resolve-owned-context security pattern.
 */
@ApiSchema({
  name: "ChatContextDto",
  description: "The current page's surface and the owned id(s) to ground on.",
})
export class ChatContextDto {
  @ApiProperty({
    description: "The page the chat was opened from.",
    enum: ChatSurface,
  })
  @IsEnum(ChatSurface)
  surface: ChatSurface;

  @ApiPropertyOptional({
    description:
      "Application the page is about (roadmap, simulation, cv, scoped notes).",
  })
  @IsOptional()
  @IsUUID()
  applicationId?: string;

  @ApiPropertyOptional({
    description: "Interview the page is about (a specific simulation session).",
  })
  @IsOptional()
  @IsUUID()
  interviewId?: string;

  @ApiPropertyOptional({
    description:
      "The single note the page is about (the note detail view). Grounds on that note alone rather than the whole list.",
  })
  @IsOptional()
  @IsUUID()
  noteId?: string;
}

@ApiSchema({
  name: "ChatHistoryItemDto",
  description: "A single prior turn in the chatbot conversation.",
})
class ChatHistoryItemDto {
  @ApiProperty({
    description: "Who authored this turn.",
    enum: ChatRole,
  })
  @IsEnum(ChatRole)
  role: ChatRole;

  @ApiProperty({ description: "Text content of the turn." })
  @IsString()
  @Length(1, 4000)
  content: string;
}

@ApiSchema({
  name: "ChatDto",
  description:
    "Data transfer object for a single chatbot question with optional prior history.",
})
export class ChatDto {
  @ApiProperty({ description: "The user's message to the assistant." })
  @IsString()
  @Length(1, 4000)
  message: string;

  @ApiProperty({
    description:
      "Prior conversation turns, oldest first, excluding the current message.",
    type: [ChatHistoryItemDto],
    required: false,
  })
  @IsOptional()
  @IsArray()
  @ArrayMaxSize(20)
  @ValidateNested({ each: true })
  @Type(() => ChatHistoryItemDto)
  history?: ChatHistoryItemDto[];

  @ApiPropertyOptional({
    description:
      "The current page's context (surface + owned ids). The server loads and injects the matching data; omit for a generic, context-free chat.",
    type: ChatContextDto,
  })
  @IsOptional()
  @ValidateNested()
  @Type(() => ChatContextDto)
  context?: ChatContextDto;
}
