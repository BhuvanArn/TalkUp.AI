import * as cheerio from "cheerio";
import { Logger } from "@nestjs/common";

import { safeAxiosGet } from "./urlGuard";

const logger = new Logger("JobOfferExtraction");

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
        logger.debug(
          `LinkedIn retry ${attempt}/${maxRetries - 1} - waiting ${delay}ms...`,
        );
        await new Promise((resolve) => setTimeout(resolve, delay));
      }

      // Anchor to where LinkedIn actually puts the job id: /jobs/view/<id>,
      // ?currentJobId=<id>, or the trailing -<id> of a view slug. A bare
      // /(\d{8,})/ would grab the first long digit run anywhere — a tracking
      // param or timestamp could win over the real id.
      const jobIdMatch = url.match(
        /(?:jobs\/view\/|currentJobId=)(\d+)|-(\d{8,})(?:[/?#]|$)/,
      );
      if (!jobIdMatch)
        throw new Error("Could not extract LinkedIn job ID from URL");

      const jobId = jobIdMatch[1] ?? jobIdMatch[2];
      const guestApiUrl = `https://www.linkedin.com/jobs-guest/jobs/api/jobPosting/${jobId}`;
      const response = await safeAxiosGet(guestApiUrl, {
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
      temp("li.description__job-criteria-item").each((_, el) => {
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
        logger.debug(`Strategy LinkedIn succeeded on attempt ${attempt + 1}`);
      } else {
        throw new Error("Extracted content too short");
      }
    } catch (err) {
      logger.debug(
        `LinkedIn attempt ${attempt + 1} failed: ${(err as { code?: string })?.code || err}`,
      );
      attempt++;
    }
  }
  if (!pageText) {
    logger.debug(
      "All LinkedIn attempts failed, falling through to next strategy...",
    );
  }
  return pageText;
};

// ─── AXIOS (sites simples) ───────────────────────────────────────────────────
export const scrapeAxios = async (url: string): Promise<string> => {
  let pageText = "";

  try {
    const response = await safeAxiosGet(
      url,
      {
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
      },
      5,
    );

    const temp = cheerio.load(response.data);
    temp(
      "script, style, nav, footer, header, iframe, noscript, [aria-hidden='true']",
    ).remove();
    const extracted = temp("body").text().replace(/\s+/g, " ").trim();

    if (extracted.length >= 300) {
      pageText = extracted;
      logger.debug("Strategy Axios succeeded");
    }
  } catch (err) {
    logger.debug(
      `Strategy Axios failed: ${(err as { code?: string })?.code || err}`,
    );
  }

  return pageText;
};
