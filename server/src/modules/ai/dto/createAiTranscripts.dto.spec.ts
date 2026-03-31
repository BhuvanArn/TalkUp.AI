import { plainToInstance } from "class-transformer";
import { validate } from "class-validator";

import { AiTranscriptStated } from "@common/enums/AiTranscriptStated";

import { CreateAiTranscriptsDto } from "./createAiTranscripts.dto";

describe("CreateAiTranscriptsDto", () => {
  it("validates nested transcript items", async () => {
    const dto = plainToInstance(CreateAiTranscriptsDto, {
      transcripts: [
        { content: "Hello", who_stated: AiTranscriptStated.User },
        { content: "Hi", who_stated: AiTranscriptStated.AI },
      ],
    });
    const errors = await validate(dto);
    expect(errors).toHaveLength(0);
  });

  it("rejects when transcripts is missing", async () => {
    const dto = plainToInstance(CreateAiTranscriptsDto, {});
    const errors = await validate(dto);
    expect(errors.length).toBeGreaterThan(0);
  });

  it("rejects invalid nested item", async () => {
    const dto = plainToInstance(CreateAiTranscriptsDto, {
      transcripts: [{ content: "", who_stated: AiTranscriptStated.User }],
    });
    const errors = await validate(dto);
    expect(errors.length).toBeGreaterThan(0);
  });
});
