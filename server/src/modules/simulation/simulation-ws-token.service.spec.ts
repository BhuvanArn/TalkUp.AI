import { Test, TestingModule } from "@nestjs/testing";
import { JwtService } from "@nestjs/jwt";

import { SimulationWsTokenService } from "./simulation-ws-token.service";

describe("SimulationWsTokenService", () => {
  let service: SimulationWsTokenService;
  let jwt: { sign: jest.Mock };

  const ORIGINAL_ENV = { ...process.env };

  beforeEach(async () => {
    jwt = { sign: jest.fn().mockReturnValue("signed.jwt.token") };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SimulationWsTokenService,
        { provide: JwtService, useValue: jwt },
      ],
    }).compile();

    service = module.get(SimulationWsTokenService);
  });

  afterEach(() => {
    process.env = { ...ORIGINAL_ENV };
  });

  it("signs a simulation_ws payload with the configured TTL", () => {
    process.env.AI_WS_PUBLIC_URL = "wss://ws.example.com/ws";

    service.buildEntrypoint("int-1", "user-1");

    expect(jwt.sign).toHaveBeenCalledWith(
      { purpose: "simulation_ws", interviewId: "int-1", userId: "user-1" },
      { expiresIn: expect.any(Number) },
    );
  });

  it("appends token with ? when the base has no query string", () => {
    process.env.AI_WS_PUBLIC_URL = "wss://ws.example.com/ws";

    const entrypoint = service.buildEntrypoint("int-1", "user-1");

    expect(entrypoint).toBe("wss://ws.example.com/ws?token=signed.jwt.token");
  });

  it("appends token with & when the base already has a query string", () => {
    process.env.AI_WS_PUBLIC_URL = "wss://ws.example.com/ws?foo=bar";

    const entrypoint = service.buildEntrypoint("int-1", "user-1");

    expect(entrypoint).toBe(
      "wss://ws.example.com/ws?foo=bar&token=signed.jwt.token",
    );
  });

  it("URL-encodes the token in the entrypoint", () => {
    process.env.AI_WS_PUBLIC_URL = "wss://ws.example.com/ws";
    jwt.sign.mockReturnValueOnce("a b/c");

    const entrypoint = service.buildEntrypoint("int-1", "user-1");

    expect(entrypoint).toBe("wss://ws.example.com/ws?token=a%20b%2Fc");
  });
});
