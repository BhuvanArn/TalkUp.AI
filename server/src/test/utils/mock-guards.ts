import { TestingModuleBuilder } from "@nestjs/testing";
import { ThrottlerGuard } from "@nestjs/throttler";
import { AccessTokenGuard } from "@common/guards/accessToken.guard";

/**
 * Helper to override the AccessTokenGuard in unit tests so they don't need JwtService or DB repos.
 * Also stubs the ThrottlerGuard (now attached to some authenticated routes so
 * their @Throttle actually fires) so controller specs don't have to wire up the
 * ThrottlerModule/storage just to instantiate a route's guard.
 * Usage:
 *   const module = await applyMockAccessTokenGuard(Test.createTestingModule({...})).compile();
 */
export function applyMockAccessTokenGuard(
  moduleBuilder: TestingModuleBuilder | any,
) {
  return moduleBuilder
    .overrideGuard(AccessTokenGuard)
    .useValue({
      canActivate: jest.fn(() => true),
    })
    .overrideGuard(ThrottlerGuard)
    .useValue({
      canActivate: jest.fn(() => true),
    });
}

export default applyMockAccessTokenGuard;
