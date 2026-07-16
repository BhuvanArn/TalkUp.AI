import { IsString, MinLength } from "class-validator";

export class AppendSimulationHistoryDto {
  @IsString()
  @MinLength(1)
  userText: string;

  @IsString()
  @MinLength(1)
  assistantText: string;
}
