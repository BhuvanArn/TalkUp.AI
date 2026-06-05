import { Organization } from "@entities/organization.entity";
import { user } from "@entities/user.entity";

import { getUserOrganizationId } from "./organizationUser.util";

describe("getUserOrganizationId", () => {
  it("returns null when organization_id is null", () => {
    const u = { organization_id: null } as user;
    expect(getUserOrganizationId(u)).toBeNull();
  });

  it("returns null when organization_id is undefined", () => {
    const u = {} as user;
    expect(getUserOrganizationId(u)).toBeNull();
  });

  it("returns string id when organization_id is a string", () => {
    const u = { organization_id: "org-uuid" } as unknown as user;
    expect(getUserOrganizationId(u)).toBe("org-uuid");
  });

  it("returns organization_id from nested Organization", () => {
    const org = { organization_id: "nested-id" } as Organization;
    const u = { organization_id: org } as unknown as user;
    expect(getUserOrganizationId(u)).toBe("nested-id");
  });

  it("returns null when nested Organization has no organization_id", () => {
    const u = { organization_id: {} as Organization } as unknown as user;
    expect(getUserOrganizationId(u)).toBeNull();
  });
});
