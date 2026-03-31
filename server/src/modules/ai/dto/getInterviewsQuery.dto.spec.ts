import { plainToInstance } from "class-transformer";
import { validate } from "class-validator";

import { GetInterviewsQueryDto } from "./getInterviewsQuery.dto";

describe("GetInterviewsQueryDto", () => {
  it("accepts empty object (all optional)", async () => {
    const dto = plainToInstance(GetInterviewsQueryDto, {});
    const errors = await validate(dto);
    expect(errors).toHaveLength(0);
  });

  it("validates page and limit", async () => {
    const dto = plainToInstance(GetInterviewsQueryDto, {
      page: 2,
      limit: 50,
    });
    expect(await validate(dto)).toHaveLength(0);
  });

  it("rejects page below 1", async () => {
    const dto = plainToInstance(GetInterviewsQueryDto, { page: 0 });
    const errors = await validate(dto);
    expect(errors.length).toBeGreaterThan(0);
  });

  it("rejects limit above 100", async () => {
    const dto = plainToInstance(GetInterviewsQueryDto, { limit: 101 });
    const errors = await validate(dto);
    expect(errors.length).toBeGreaterThan(0);
  });

  it("rejects invalid sort field", async () => {
    const dto = plainToInstance(GetInterviewsQueryDto, {
      sort: "invalid",
    });
    const errors = await validate(dto);
    expect(errors.length).toBeGreaterThan(0);
  });

  it("accepts valid sort and order", async () => {
    const dto = plainToInstance(GetInterviewsQueryDto, {
      sort: "score",
      order: "ASC",
    });
    expect(await validate(dto)).toHaveLength(0);
  });
});
