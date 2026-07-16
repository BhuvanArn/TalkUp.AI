import {
  generateInviteCode,
  INVITE_CODE_ALPHABET,
  INVITE_CODE_LENGTH,
} from "./inviteCode";

describe("generateInviteCode", () => {
  it("produces 12-character codes", () => {
    expect(generateInviteCode()).toHaveLength(INVITE_CODE_LENGTH);
  });

  it("uses only the unambiguous alphabet (no 0/O/1/I)", () => {
    expect(INVITE_CODE_ALPHABET).toHaveLength(32);
    for (const banned of ["0", "O", "1", "I"]) {
      expect(INVITE_CODE_ALPHABET).not.toContain(banned);
    }
    for (let i = 0; i < 50; i += 1) {
      const code = generateInviteCode();
      for (const ch of code) {
        expect(INVITE_CODE_ALPHABET).toContain(ch);
      }
    }
  });

  it("produces distinct codes across calls", () => {
    const codes = new Set(
      Array.from({ length: 100 }, () => generateInviteCode()),
    );
    expect(codes.size).toBe(100);
  });
});
