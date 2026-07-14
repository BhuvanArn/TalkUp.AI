import { throttlerTracker } from "./throttler-tracker";

describe("throttlerTracker", () => {
  it("keys by user id when the request is authenticated", () => {
    expect(throttlerTracker({ userId: "u-123", ip: "1.2.3.4" })).toBe(
      "user:u-123",
    );
  });

  it("prefers the user id over the IP so the budget follows the account", () => {
    // Same user from two different IPs must land in the same bucket.
    expect(throttlerTracker({ userId: "u-1", ip: "10.0.0.1" })).toBe(
      throttlerTracker({ userId: "u-1", ip: "10.0.0.2" }),
    );
  });

  it("falls back to the client IP when there is no authenticated user", () => {
    expect(throttlerTracker({ ip: "203.0.113.9" })).toBe("ip:203.0.113.9");
  });

  it("falls back to socket.remoteAddress when req.ip is absent", () => {
    expect(
      throttlerTracker({ socket: { remoteAddress: "198.51.100.7" } }),
    ).toBe("ip:198.51.100.7");
  });

  it("treats an empty-string userId as unauthenticated", () => {
    expect(throttlerTracker({ userId: "", ip: "1.1.1.1" })).toBe("ip:1.1.1.1");
  });

  it("uses 'unknown' when neither user nor any address is available", () => {
    expect(throttlerTracker({})).toBe("ip:unknown");
  });

  it("namespaces keys so a user id cannot collide with an IP", () => {
    // A user whose id happened to equal an IP literal must not share a bucket
    // with a caller coming from that IP.
    expect(throttlerTracker({ userId: "203.0.113.9" })).not.toBe(
      throttlerTracker({ ip: "203.0.113.9" }),
    );
  });
});
