import { plainToInstance } from "class-transformer";
import { validate } from "class-validator";

import { GetNotesQueryDto } from "./getNotesQuery.dto";

describe("GetNotesQueryDto", () => {
  it("transforms standalone 'true' to boolean true", async () => {
    const dto = plainToInstance(GetNotesQueryDto, { standalone: "true" });
    expect(dto.standalone).toBe(true);
    expect(await validate(dto)).toHaveLength(0);
  });

  it("transforms standalone 'false' to boolean false", async () => {
    const dto = plainToInstance(GetNotesQueryDto, { standalone: "false" });
    expect(dto.standalone).toBe(false);
    expect(await validate(dto)).toHaveLength(0);
  });

  it("leaves standalone undefined when absent", async () => {
    const dto = plainToInstance(GetNotesQueryDto, {});
    expect(dto.standalone).toBeUndefined();
    expect(await validate(dto)).toHaveLength(0);
  });

  it("accepts a valid interviewId uuid", async () => {
    const dto = plainToInstance(GetNotesQueryDto, {
      interviewId: "019ac5a6-ada7-7a96-9a38-23819f37ab90",
    });
    expect(await validate(dto)).toHaveLength(0);
  });

  it("rejects a non-uuid interviewId", async () => {
    const dto = plainToInstance(GetNotesQueryDto, { interviewId: "not-a-uuid" });
    const errors = await validate(dto);
    expect(errors).toHaveLength(1);
    expect(errors[0].property).toBe("interviewId");
  });
});
