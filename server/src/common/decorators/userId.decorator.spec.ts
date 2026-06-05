import { getUserIdFromContext, userIdParamFactory } from "./userId.decorator";

describe("UserId decorator", () => {
  it("extracts userId from request", () => {
    const ctx = {
      switchToHttp: () => ({
        getRequest: () => ({ userId: "u-123" }),
      }),
    };

    const res = getUserIdFromContext(ctx as any);
    expect(res).toBe("u-123");
  });

  it("userIdParamFactory delegates to getUserIdFromContext", () => {
    const ctx = {
      switchToHttp: () => ({
        getRequest: () => ({ userId: "from-factory" }),
      }),
    };
    expect(userIdParamFactory(undefined, ctx as any)).toBe("from-factory");
  });
});
