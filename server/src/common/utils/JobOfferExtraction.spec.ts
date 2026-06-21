import axios from "axios";
import puppeteer from "puppeteer";

import {
  scrapeLinkedin,
  scrapeAxios,
  scrapePuppeteer,
} from "./JobOfferExtraction";

jest.mock("axios");
jest.mock("puppeteer");

const mockedAxios = axios as jest.Mocked<typeof axios>;
const mockedPuppeteer = puppeteer as jest.Mocked<typeof puppeteer>;

// Fake timers so retry backoff (attempt * 2000ms) and puppeteer's sequential
// waits resolve instantly. Run a scraper through to completion by draining all
// queued timers while its async work settles.
jest.useFakeTimers();
const runScraper = async (start: () => Promise<string>): Promise<string> => {
  const promise = start();
  await jest.runAllTimersAsync();
  return promise;
};

const LINKEDIN_HTML = `
  <h1 class="top-card-layout__title">Senior Backend Engineer</h1>
  <a class="topcard__org-name-link">TechCorp</a>
  <span class="topcard__flavor--bullet">Paris, France</span>
  <div class="show-more-less-html__markup">We build distributed systems and we are hiring engineers to grow the platform team across Europe.</div>
  <ul>
    <li class="description__job-criteria-item"><h3>Employment type</h3><span>Full-time</span></li>
    <li class="description__job-criteria-item"><h3>Seniority level</h3><span>Senior</span></li>
  </ul>
`;

const longBody = "Job description ".repeat(40); // > 300 chars
const GENERIC_HTML = `<html><body><nav>nav</nav><p>${longBody}</p></body></html>`;

afterEach(() => {
  jest.clearAllMocks();
});

describe("scrapeLinkedin", () => {
  it("extracts structured text from the guest API on first try", async () => {
    mockedAxios.get.mockResolvedValueOnce({ data: LINKEDIN_HTML });

    const text = await runScraper(() =>
      scrapeLinkedin("https://www.linkedin.com/jobs/view/1234567890"),
    );

    expect(text).toContain("Senior Backend Engineer");
    expect(text).toContain("TechCorp");
    expect(mockedAxios.get).toHaveBeenCalledTimes(1);
  });

  it("returns empty when the URL has no extractable job id", async () => {
    // No 8+ digit id → throws inside, retries, ends empty.
    const text = await runScraper(() =>
      scrapeLinkedin("https://www.linkedin.com/jobs/view/abc"),
    );
    expect(text).toBe("");
  });

  it("retries on failure then succeeds", async () => {
    mockedAxios.get
      .mockRejectedValueOnce({ code: "ETIMEDOUT" })
      .mockResolvedValueOnce({ data: LINKEDIN_HTML });

    const text = await runScraper(() =>
      scrapeLinkedin("https://www.linkedin.com/jobs/view/1234567890"),
    );

    expect(text).toContain("Senior Backend Engineer");
    expect(mockedAxios.get).toHaveBeenCalledTimes(2);
  });

  it("returns empty when content is too short", async () => {
    mockedAxios.get.mockResolvedValue({ data: "<h1></h1>" });

    const text = await runScraper(() =>
      scrapeLinkedin("https://www.linkedin.com/jobs/view/1234567890"),
    );

    expect(text).toBe("");
  });
});

describe("scrapeAxios", () => {
  it("extracts body text from a simple page", async () => {
    mockedAxios.get.mockResolvedValueOnce({ data: GENERIC_HTML });

    const text = await scrapeAxios("https://example.com/job/1");

    expect(text).toContain("Job description");
    expect(text).not.toContain("nav");
  });

  it("returns empty when the page text is too short", async () => {
    mockedAxios.get.mockResolvedValueOnce({ data: "<body>hi</body>" });

    const text = await scrapeAxios("https://example.com/job/1");

    expect(text).toBe("");
  });

  it("returns empty on request error", async () => {
    mockedAxios.get.mockRejectedValueOnce({ code: "ECONNREFUSED" });

    const text = await scrapeAxios("https://example.com/job/1");

    expect(text).toBe("");
  });
});

describe("scrapePuppeteer", () => {
  const makeBrowser = (html: string) => {
    const page = {
      evaluateOnNewDocument: jest.fn(),
      setUserAgent: jest.fn(),
      setViewport: jest.fn(),
      goto: jest.fn(),
      evaluate: jest.fn(),
      content: jest.fn().mockResolvedValue(html),
    };
    return {
      newPage: jest.fn().mockResolvedValue(page),
      close: jest.fn(),
    };
  };

  it("extracts body text via a headless browser", async () => {
    mockedPuppeteer.launch.mockResolvedValueOnce(
      makeBrowser(GENERIC_HTML) as never,
    );

    const text = await runScraper(() =>
      scrapePuppeteer("https://example.com/job/1"),
    );

    expect(text).toContain("Job description");
  });

  it("returns empty when launch fails", async () => {
    mockedPuppeteer.launch.mockRejectedValueOnce(new Error("no chrome"));

    const text = await runScraper(() =>
      scrapePuppeteer("https://example.com/job/1"),
    );

    expect(text).toBe("");
  });

  it("returns empty when rendered content is too short", async () => {
    mockedPuppeteer.launch.mockResolvedValueOnce(
      makeBrowser("<body>tiny</body>") as never,
    );

    const text = await runScraper(() =>
      scrapePuppeteer("https://example.com/job/1"),
    );

    expect(text).toBe("");
  });
});
