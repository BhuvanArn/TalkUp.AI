import { generateSecurePassword } from "./generateSecurePassword";

const strongPasswordRegex =
  /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9]).{8,50}$/;

describe("generateSecurePassword", () => {
  it("should produce passwords matching strong-password rules", () => {
    for (let i = 0; i < 50; i++) {
      const p = generateSecurePassword();
      expect(p.length).toBe(20);
      expect(p).toMatch(strongPasswordRegex);
    }
  });

  it("should respect custom length within bounds", () => {
    const p = generateSecurePassword(32);
    expect(p.length).toBe(32);
    expect(p).toMatch(strongPasswordRegex);
  });

  it("should throw if length is out of bounds", () => {
    expect(() => generateSecurePassword(7)).toThrow(
      "Password length must be between 8 and 50",
    );
    expect(() => generateSecurePassword(51)).toThrow(
      "Password length must be between 8 and 50",
    );
  });
});
