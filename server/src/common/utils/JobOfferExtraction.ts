import axios from "axios";
import * as cheerio from "cheerio";

export const scrapeLinkedin = async (url: string): Promise<string> => {
  const maxRetries = 3;
  let attempt = 0;
  let pageText = "";

  const userAgents = [
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/119.0.0.0 Safari/537.36",
    "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/118.0.0.0 Safari/537.36",
  ];

  while (attempt < maxRetries && !pageText) {
    try {
      // Délai croissant entre chaque tentative : 0ms, 2000ms, 4000ms
      if (attempt > 0) {
        const delay = attempt * 2000;
        console.log(
          `LinkedIn retry ${attempt}/${maxRetries - 1} - waiting ${delay}ms...`,
        );
        await new Promise((resolve) => setTimeout(resolve, delay));
      }

      const jobIdMatch = url.match(/(\d{8,})/);
      if (!jobIdMatch)
        throw new Error("Could not extract LinkedIn job ID from URL");

      const jobId = jobIdMatch[1];
      const guestApiUrl = `https://www.linkedin.com/jobs-guest/jobs/api/jobPosting/${jobId}`;
      const response = await axios.get(guestApiUrl, {
        headers: {
          "User-Agent": userAgents[attempt % userAgents.length],
          Accept:
            "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
          "Accept-Language": "fr-FR,fr;q=0.9,en-US;q=0.8",
          Referer: "https://www.linkedin.com/",
        },
        timeout: 15000,
      });

      const temp = cheerio.load(response.data);

      const jobTitle = temp(
        "h2.top-card-layout__title, h1.top-card-layout__title",
      )
        .text()
        .trim();
      const companyName = temp(
        "a.topcard__org-name-link, span.topcard__org-name-link",
      )
        .text()
        .trim();
      const location = temp("span.topcard__flavor--bullet")
        .first()
        .text()
        .trim();
      const description = temp("div.show-more-less-html__markup")
        .text()
        .replace(/\s+/g, " ")
        .trim();

      const criteria: Record<string, string> = {};
      temp("li.description__job-criteria-item").each((_: number, el: any) => {
        const label = temp(el).find("h3").text().trim();
        const value = temp(el).find("span").text().trim();
        if (label && value) criteria[label] = value;
      });

      const extracted = `
                Job Title: ${jobTitle}
                Company: ${companyName}
                Location: ${location}
                Contract Type: ${criteria["Type de poste"] || criteria["Employment type"] || ""}
                Seniority Level: ${criteria["Niveau hiérarchique"] || criteria["Seniority level"] || ""}
                Industry: ${criteria["Secteur"] || criteria["Industries"] || ""}
                Job Function: ${criteria["Fonction"] || criteria["Job function"] || ""}
                Description: ${description}
            `
        .replace(/\s+/g, " ")
        .trim();

      if (extracted.length >= 100) {
        pageText = extracted;
        console.log(`Strategy LinkedIn succeeded on attempt ${attempt + 1}`);
      } else {
        throw new Error("Extracted content too short");
      }
    } catch (err) {
      console.log(
        `LinkedIn attempt ${attempt + 1} failed:`,
        (err as any)?.code || err,
      );
      attempt++;
    }
  }
  if (!pageText) {
    console.log(
      "All LinkedIn attempts failed, falling through to next strategy...",
    );
  }
  return pageText;
};

// ─── AXIOS (sites simples) ───────────────────────────────────────────────────
export const scrapeAxios = async (url: string): Promise<string> => {
  let pageText = "";

  try {
    const response = await axios.get(url, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        Accept:
          "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8",
        "Accept-Language": "fr-FR,fr;q=0.9,en-US;q=0.8,en;q=0.7",
        "Accept-Encoding": "gzip, deflate, br",
        Connection: "keep-alive",
        "Upgrade-Insecure-Requests": "1",
        "Sec-Fetch-Dest": "document",
        "Sec-Fetch-Mode": "navigate",
        "Sec-Fetch-Site": "none",
        "Cache-Control": "max-age=0",
      },
      timeout: 10000,
      maxRedirects: 5,
    });

    const temp = cheerio.load(response.data);
    temp(
      "script, style, nav, footer, header, iframe, noscript, [aria-hidden='true']",
    ).remove();
    const extracted = temp("body").text().replace(/\s+/g, " ").trim();

    if (extracted.length >= 300) {
      pageText = extracted;
      console.log("Strategy Axios succeeded");
    }
  } catch (err) {
    console.log("Strategy Axios failed:", (err as any)?.code || err);
  }

  return pageText;
};

// ─── PUPPETEER GÉNÉRIQUE ─────────────────────────────────────────────────────
export const scrapePuppeteer = async (url: string): Promise<string> => {
  let pageText = "";

  try {
    const puppeteer = require("puppeteer");

    const browser = await puppeteer.launch({
      headless: true,
      executablePath: "/usr/bin/google-chrome",
      args: [
        "--no-sandbox",
        "--disable-setuid-sandbox",
        "--disable-blink-features=AutomationControlled",
        "--disable-infobars",
        "--window-size=1920,1080",
      ],
    });

    const page = await browser.newPage();

    await page.evaluateOnNewDocument(() => {
      Object.defineProperty(navigator, "webdriver", { get: () => false });
      (window as any).chrome = { runtime: {} };
    });

    await page.setUserAgent(
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
    );

    await page.setViewport({ width: 1920, height: 1080 });
    await page.goto(url, { waitUntil: "networkidle2", timeout: 20000 });
    await new Promise((resolve) => setTimeout(resolve, 2000));
    await page.evaluate(() =>
      window.scrollTo(0, document.body.scrollHeight / 2),
    );
    await new Promise((resolve) => setTimeout(resolve, 1000));

    const html = await page.content();
    await browser.close();

    const temp = cheerio.load(html);
    temp("script, style, nav, footer, header, iframe, noscript").remove();
    const extracted = temp("body").text().replace(/\s+/g, " ").trim();

    if (extracted.length >= 300) {
      pageText = extracted;
      console.log("Strategy Puppeteer generic succeeded");
    }
  } catch (err) {
    console.log(
      "Strategy Puppeteer generic failed:",
      (err as any)?.message || err,
    );
  }

  return pageText;
};
