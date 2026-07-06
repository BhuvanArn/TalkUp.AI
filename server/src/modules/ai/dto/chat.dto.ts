import { ApiProperty, ApiSchema } from "@nestjs/swagger";
import {
  IsArray,
  IsEnum,
  IsOptional,
  IsString,
  Length,
  ValidateNested,
  ArrayMaxSize,
} from "class-validator";
import { Type } from "class-transformer";

export enum ChatRole {
  USER = "user",
  ASSISTANT = "assistant",
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
}
