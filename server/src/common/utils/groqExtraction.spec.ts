import { InternalServerErrorException } from "@nestjs/common";

jest.mock("groq-sdk", () => ({
  __esModule: true,
  default: jest.fn().mockImplementation(() => ({
    chat: {
      completions: { create: (...args: unknown[]) => mockGroqCreate(...args) },
    },
  })),
}));

const mockGroqCreate = jest.fn();

import { extractWithGroq, isCvExtractionEmpty } from "./groqExtraction";

describe("extractWithGroq", () => {
  beforeEach(() => mockGroqCreate.mockReset());

  it("parses a plain JSON response", async () => {
    mockGroqCreate.mockResolvedValue({
      choices: [{ message: { content: '{"a": 1}' } }],
    });
    await expect(extractWithGroq<{ a: number }>("prompt")).resolves.toEqual({
      a: 1,
    });
  });

  it("strips markdown fences before parsing", async () => {
    mockGroqCreate.mockResolvedValue({
      choices: [{ message: { content: '```json\n{"a": 1}\n```' } }],
    });
    await expect(extractWithGroq<{ a: number }>("prompt")).resolves.toEqual({
      a: 1,
    });
  });

  it("preserves backticks inside string values (only outer fence stripped)", async () => {
    mockGroqCreate.mockResolvedValue({
      choices: [
        {
          message: {
            content: '```json\n{"desc": "run ```npm test``` first"}\n```',
          },
        },
      ],
    });
    await expect(extractWithGroq<{ desc: string }>("prompt")).resolves.toEqual({
      desc: "run ```npm test``` first",
    });
  });

  it("throws InternalServerErrorException on empty response", async () => {
    mockGroqCreate.mockResolvedValue({ choices: [] });
    await expect(extractWithGroq("prompt")).rejects.toBeInstanceOf(
      InternalServerErrorException,
    );
  });

  it("throws InternalServerErrorException on unparsable JSON", async () => {
    mockGroqCreate.mockResolvedValue({
      choices: [{ message: { content: "not json" } }],
    });
    await expect(extractWithGroq("prompt")).rejects.toBeInstanceOf(
      InternalServerErrorException,
    );
  });
});

describe("isCvExtractionEmpty", () => {
  it("returns true for an all-empty extraction", () => {
    expect(isCvExtractionEmpty({})).toBe(true);
    expect(
      isCvExtractionEmpty({
        desired_job: null,
        resume: "   ",
        experiences: [],
        education: [],
        technical_skills: [],
        languages: [],
      }),
    ).toBe(true);
  });

  it("returns false when any meaningful field is present", () => {
    expect(isCvExtractionEmpty({ resume: "Développeur web" })).toBe(false);
    expect(
      isCvExtractionEmpty({
        experiences: [{ company: "Acme", title: "Dev" }],
      }),
    ).toBe(false);
    expect(isCvExtractionEmpty({ technical_skills: ["React"] })).toBe(false);
  });
});
