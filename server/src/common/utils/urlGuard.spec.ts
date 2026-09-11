import axios from "axios";

import { canonicalizeOfferUrl, isSafeFetchUrl, safeAxiosGet } from "./urlGuard";

jest.mock("axios");
const mockedGet = axios.get as jest.MockedFunction<typeof axios.get>;

describe("isSafeFetchUrl", () => {
  describe("allows", () => {
    it.each([
      "https://www.linkedin.com/jobs/view/1234567890",
      "http://example.com/job/123",
      "https://careers.acme.io/offers/42",
      "https://203.0.113.10/job", // public IP literal
    ])("accepts public http(s) URL %s", (url) => {
      expect(isSafeFetchUrl(url)).toBe(true);
    });
  });

  describe("rejects malformed / non-http(s)", () => {
    it.each([
      "not-a-url",
      "",
      "ftp://example.com/file",
      "file:///etc/passwd",
      "gopher://example.com",
      "javascript:alert(1)",
    ])("rejects %s", (url) => {
      expect(isSafeFetchUrl(url)).toBe(false);
    });
  });

  describe("rejects SSRF targets (loopback / private / link-local)", () => {
    it.each([
      "http://localhost/admin",
      "http://localhost:8080/internal",
      "http://api.localhost/x",
      "http://127.0.0.1/",
      "http://127.1.2.3/",
      "http://0.0.0.0/",
      "http://10.0.0.5/",
      "http://172.16.0.1/",
      "http://172.31.255.255/",
      "http://192.168.1.1/",
      "http://169.254.169.254/latest/meta-data/", // cloud metadata
      "http://100.64.0.1/", // CGNAT
      "http://[::1]/", // IPv6 loopback
      "http://[::]/",
      "http://[fc00::1]/", // IPv6 unique-local
      "http://[fe80::1]/", // IPv6 link-local
      "http://[::ffff:127.0.0.1]/", // IPv4-mapped loopback
      "http://[::ffff:10.0.0.1]/", // IPv4-mapped private
    ])("blocks %s", (url) => {
      expect(isSafeFetchUrl(url)).toBe(false);
    });
  });

  describe("public ranges adjacent to private blocks pass", () => {
    it.each([
      "http://172.15.0.1/", // just below 172.16/12
      "http://172.32.0.1/", // just above 172.16/12
      "http://11.0.0.1/", // not 10/8
      "http://100.63.0.1/", // just below CGNAT
      "http://100.128.0.1/", // just above CGNAT
      "http://[2606:4700::1]/", // public IPv6
    ])("accepts %s", (url) => {
      expect(isSafeFetchUrl(url)).toBe(true);
    });
  });

  it("rejects a hostname new URL() cannot parse", () => {
    // new URL("http://999.1.1.1/") throws (invalid IPv4 literal) → not safe.
    expect(isSafeFetchUrl("http://999.1.1.1/")).toBe(false);
  });
});

describe("safeAxiosGet", () => {
  beforeEach(() => mockedGet.mockReset());

  it("returns the response for a direct 200 with no redirect", async () => {
    mockedGet.mockResolvedValueOnce({ status: 200, headers: {}, data: "ok" });

    const res = await safeAxiosGet("https://example.com/job");

    expect(res.data).toBe("ok");
    expect(mockedGet).toHaveBeenCalledTimes(1);
    // redirects must be disabled so we follow them ourselves
    expect(mockedGet.mock.calls[0][1]).toMatchObject({ maxRedirects: 0 });
  });

  it("follows a redirect to another public host", async () => {
    mockedGet
      .mockResolvedValueOnce({
        status: 302,
        headers: { location: "https://careers.acme.io/real" },
        data: "",
      })
      .mockResolvedValueOnce({ status: 200, headers: {}, data: "final" });

    const res = await safeAxiosGet("https://example.com/job");

    expect(res.data).toBe("final");
    expect(mockedGet).toHaveBeenCalledTimes(2);
  });

  it("blocks a redirect to a private/metadata target (SSRF)", async () => {
    mockedGet.mockResolvedValueOnce({
      status: 302,
      headers: { location: "http://169.254.169.254/latest/meta-data/" },
      data: "",
    });

    await expect(safeAxiosGet("https://example.com/job")).rejects.toThrow(
      /Blocked redirect target/,
    );
    // the second (unsafe) hop must never be fetched
    expect(mockedGet).toHaveBeenCalledTimes(1);
  });

  it("blocks a redirect to localhost", async () => {
    mockedGet.mockResolvedValueOnce({
      status: 301,
      headers: { location: "http://localhost:8080/internal" },
      data: "",
    });

    await expect(safeAxiosGet("https://example.com/job")).rejects.toThrow(
      /Blocked redirect target/,
    );
  });

  it("rejects an unsafe initial URL without fetching", async () => {
    await expect(safeAxiosGet("http://127.0.0.1/")).rejects.toThrow(
      /Blocked redirect target/,
    );
    expect(mockedGet).not.toHaveBeenCalled();
  });

  it("throws when the redirect budget is exhausted", async () => {
    mockedGet.mockResolvedValue({
      status: 302,
      headers: { location: "https://example.com/loop" },
      data: "",
    });

    await expect(
      safeAxiosGet("https://example.com/job", {}, 2),
    ).rejects.toThrow(/Too many redirects/);
    // initial + 2 redirect hops = 3 fetches
    expect(mockedGet).toHaveBeenCalledTimes(3);
  });
});

describe("canonicalizeOfferUrl", () => {
  it("strips tracking query params and the fragment", () => {
    expect(
      canonicalizeOfferUrl(
        "https://www.linkedin.com/jobs/view/4410194083/?trackingId=abc&refId=xyz&eBP=Cw#section",
      ),
    ).toBe("https://www.linkedin.com/jobs/view/4410194083");
  });

  it("maps the same posting with different params to one key", () => {
    const a = canonicalizeOfferUrl(
      "https://www.linkedin.com/jobs/view/999?trackingId=aaa",
    );
    const b = canonicalizeOfferUrl(
      "https://www.linkedin.com/jobs/view/999?trackingId=bbb&refId=z",
    );
    expect(a).toBe(b);
  });

  it("lowercases the host and drops a trailing slash", () => {
    expect(canonicalizeOfferUrl("https://Example.COM/job/42/")).toBe(
      "https://example.com/job/42",
    );
  });

  it("returns the trimmed input when it does not parse", () => {
    expect(canonicalizeOfferUrl("  not a url  ")).toBe("not a url");
  });

  it("keeps identifying params so two different postings stay distinct", () => {
    // Indeed carries the posting id ONLY in the query string.
    expect(
      canonicalizeOfferUrl("https://fr.indeed.com/viewjob?jk=aaa"),
    ).not.toBe(canonicalizeOfferUrl("https://fr.indeed.com/viewjob?jk=bbb"));
    // LinkedIn search/collection links do the same with currentJobId.
    expect(
      canonicalizeOfferUrl(
        "https://www.linkedin.com/jobs/collections/recommended/?currentJobId=1",
      ),
    ).not.toBe(
      canonicalizeOfferUrl(
        "https://www.linkedin.com/jobs/collections/recommended/?currentJobId=2",
      ),
    );
    // Glassdoor.
    expect(
      canonicalizeOfferUrl(
        "https://www.glassdoor.fr/job-listing?jobListingId=1",
      ),
    ).not.toBe(
      canonicalizeOfferUrl(
        "https://www.glassdoor.fr/job-listing?jobListingId=2",
      ),
    );
  });

  it("still maps one posting to one key when only tracking params differ", () => {
    expect(
      canonicalizeOfferUrl(
        "https://fr.indeed.com/viewjob?jk=aaa&utm_source=google&from=serp",
      ),
    ).toBe(
      canonicalizeOfferUrl(
        "https://fr.indeed.com/viewjob?jk=aaa&utm_campaign=x&trk=feed",
      ),
    );
  });

  it("is stable regardless of query-param order", () => {
    expect(
      canonicalizeOfferUrl("https://boards.example.com/job?gh_jid=7&lang=fr"),
    ).toBe(
      canonicalizeOfferUrl("https://boards.example.com/job?lang=fr&gh_jid=7"),
    );
  });
});
