import { IsArray, IsObject } from "class-validator";

export class SaveVerbalAnalysisDto {
  @IsObject()
  aggregate: Record<string, unknown>;

  @IsArray()
  turns: Record<string, unknown>[];
}
