import { IsString, MinLength } from "class-validator";

export class AppendAssistantTurnDto {
  @IsString()
  @MinLength(1)
  assistantText: string;
}
