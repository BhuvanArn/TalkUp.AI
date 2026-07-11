import { buildAdminUsername } from "./buildAdminUsername";

describe("buildAdminUsername", () => {
  const RULE = /^[a-zA-Z0-9]+$/;

  it("strips non-alphanumeric chars and appends the admin suffix", () => {
    expect(buildAdminUsername("Acme Corp")).toBe("AcmeCorpadmin");
  });

  it("drops underscores, dots, dashes, and unicode", () => {
    expect(buildAdminUsername("a_b.c-d")).toBe("abcdadmin");
    expect(buildAdminUsername("A.C-M_E")).toBe("ACMEadmin");
  });

  it("always satisfies the 3-20 alphanumeric rule for realistic names", () => {
    for (const name of [
      "Acme",
      "Springfield Academy of Science",
      "A",
      "École Supérieure",
      "123 Main St",
      "!!!",
      "",
    ]) {
      const u = buildAdminUsername(name);
      expect(u).toMatch(RULE);
      expect(u.length).toBeGreaterThanOrEqual(3);
      expect(u.length).toBeLessThanOrEqual(20);
    }
  });

  it("truncates a long org name so the result stays within 20 chars and keeps the suffix", () => {
    const u = buildAdminUsername(
      "Springfield Academy of Science and Technology",
    );
    expect(u.length).toBeLessThanOrEqual(20);
    expect(u.endsWith("admin")).toBe(true);
    expect(u).toMatch(RULE);
  });

  it("falls back to 'admin' when the name has no alphanumeric characters", () => {
    expect(buildAdminUsername("___")).toBe("admin");
    expect(buildAdminUsername("")).toBe("admin");
  });
});
