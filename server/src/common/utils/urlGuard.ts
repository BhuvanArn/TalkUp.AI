import axios, { AxiosRequestConfig, AxiosResponse } from "axios";

/**
 * SSRF guard for user-supplied URLs that the server will fetch (job-offer scraping).
 *
 * Blocks the obvious attack surface without doing DNS resolution (which would add
 * network I/O and flakiness): scheme must be http(s), and the host must not be a
 * loopback / private / link-local / reserved IP literal or a local hostname.
 *
 * Residual risk: a public hostname that resolves to a private IP (DNS rebinding)
 * is NOT caught here — that needs resolve-then-pin-IP at fetch time. Tracked as a
 * follow-up; this guard stops metadata-endpoint and localhost/internal-IP probing.
 */

const BLOCKED_HOSTNAMES = new Set([
  "localhost",
  "ip6-localhost",
  "ip6-loopback",
]);

const isPrivateIPv4 = (host: string): boolean => {
  const m = host.match(/^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/);
  if (!m) {
    return false;
  }
  const octets = m.slice(1, 5).map(Number);
  if (octets.some((o) => o > 255)) {
    return false;
  }
  const [a, b] = octets;

  // 0.0.0.0/8, 10/8, 127/8 loopback, 169.254/16 link-local (incl. cloud metadata)
  if (a === 0 || a === 10 || a === 127) {
    return true;
  }
  if (a === 169 && b === 254) {
    return true;
  }
  // 172.16/12
  if (a === 172 && b >= 16 && b <= 31) {
    return true;
  }
  // 192.168/16
  if (a === 192 && b === 168) {
    return true;
  }
  // 100.64/10 carrier-grade NAT
  if (a === 100 && b >= 64 && b <= 127) {
    return true;
  }
  return false;
};

const isBlockedIPv6 = (host: string): boolean => {
  // host from new URL() keeps brackets, e.g. "[::1]"
  const inner = host.replace(/^\[|\]$/g, "").toLowerCase();
  if (inner === "::1" || inner === "::") {
    return true;
  }
  // unique-local fc00::/7 and link-local fe80::/10
  if (/^f[cd][0-9a-f]{2}:/.test(inner) || /^fe[89ab][0-9a-f]:/.test(inner)) {
    return true;
  }
  // IPv4-mapped ::ffff:a.b.c.d. new URL() may keep the dotted form or normalize
  // it to hex (::ffff:7f00:1). Handle both, decoding hex back to dotted-quad.
  const dotted = inner.match(/::ffff:(\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3})$/);
  if (dotted) {
    return isPrivateIPv4(dotted[1]);
  }
  const hex = inner.match(/::ffff:([0-9a-f]{1,4}):([0-9a-f]{1,4})$/);
  if (hex) {
    const hi = parseInt(hex[1], 16);
    const lo = parseInt(hex[2], 16);
    const ipv4 = `${(hi >> 8) & 0xff}.${hi & 0xff}.${(lo >> 8) & 0xff}.${lo & 0xff}`;
    return isPrivateIPv4(ipv4);
  }
  return false;
};

/**
 * Query params that identify the *visit*, not the posting. Only these are
 * dropped when canonicalizing — everything else is kept, because on many job
 * boards the posting id lives in the query string (Indeed `jk`, LinkedIn
 * `currentJobId`, Glassdoor `jobListingId`, Greenhouse `gh_jid`, …). Anything
 * matching TRACKING_PARAM_PREFIXES (utm_*, etc.) is dropped too.
 */
const TRACKING_PARAMS = new Set([
  "alternatechannel",
  "ebp",
  "fbclid",
  "from",
  "gclid",
  "igshid",
  "mc_cid",
  "mc_eid",
  "msclkid",
  "originalsubdomain",
  "position",
  "pagenum",
  "refid",
  "savedsearchid",
  "src",
  "trackingid",
  "trk",
  "trkinfo",
]);

const TRACKING_PARAM_PREFIXES = ["utm_", "utm-", "_hs", "spm_"];

const isTrackingParam = (name: string): boolean => {
  const key = name.toLowerCase();
  return (
    TRACKING_PARAMS.has(key) ||
    TRACKING_PARAM_PREFIXES.some((prefix) => key.startsWith(prefix))
  );
};

/**
 * Canonical form of a job-offer URL, used as the per-user dedup key so the SAME
 * job maps to ONE application no matter which tracking params the link carried.
 *
 * Job-board links (LinkedIn especially) append per-visit query params
 * (`trackingId`, `refId`, `eBP`, `alternateChannel`, …), so two analyses of the
 * same posting arrive as different raw URLs and would otherwise create duplicate
 * training paths.
 *
 * We drop ONLY those tracking params (see TRACKING_PARAMS) and keep the rest,
 * sorted so param order doesn't change the key. Stripping the whole query
 * string instead — which this used to do — collapsed every posting on a board
 * that carries the id in the query (`/viewjob?jk=…`, `?currentJobId=…`) onto a
 * single key, so a user's second application silently returned their first one.
 * Erring toward keeping an unknown param can at worst create a duplicate card;
 * dropping one can make a real application impossible to create.
 *
 * Also lowercases the host, drops the fragment and a bare trailing path slash.
 * Falls
 * back to the trimmed input if it won't parse (the caller still validates
 * fetch-safety separately).
 */
export const canonicalizeOfferUrl = (raw: string): string => {
  try {
    const u = new URL(raw);
    u.hash = "";
    u.hostname = u.hostname.toLowerCase();

    // Normalize a bare trailing slash on the path (…/view/123/ === …/view/123).
    // Done on the pathname, not the serialized url, so a kept query value that
    // happens to end in "/" is left intact.
    if (u.pathname !== "/" && u.pathname.endsWith("/")) {
      u.pathname = u.pathname.slice(0, -1);
    }

    const kept = [...u.searchParams.entries()]
      .filter(([name]) => !isTrackingParam(name))
      .sort(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0));
    u.search = "";
    for (const [name, value] of kept) {
      u.searchParams.append(name, value);
    }

    return u.toString();
  } catch {
    return raw.trim();
  }
};

/**
 * Returns true when the URL is safe to fetch server-side.
 * Rejects non-http(s) schemes and private/loopback/link-local/reserved targets.
 */
export const isSafeFetchUrl = (raw: string): boolean => {
  let parsed: URL;
  try {
    parsed = new URL(raw);
  } catch {
    return false;
  }

  if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
    return false;
  }

  const host = parsed.hostname.toLowerCase();

  if (BLOCKED_HOSTNAMES.has(host) || host.endsWith(".localhost")) {
    return false;
  }
  if (isPrivateIPv4(host)) {
    return false;
  }
  if (host.includes(":") && isBlockedIPv6(host)) {
    return false;
  }

  return true;
};

/**
 * GET a user-supplied URL while re-validating EVERY redirect hop against
 * {@link isSafeFetchUrl}. axios' built-in `maxRedirects` only checks the first
 * URL, so a public host that 30x-redirects to 169.254.169.254 (cloud metadata)
 * or an internal service would otherwise bypass the SSRF guard. We disable
 * automatic redirects and follow them manually so each Location is checked.
 *
 * Throws if a hop targets a blocked host or the redirect budget is exhausted.
 */
export const safeAxiosGet = async (
  url: string,
  config: AxiosRequestConfig = {},
  maxRedirects = 5,
): Promise<AxiosResponse> => {
  let currentUrl = url;

  for (let hop = 0; hop <= maxRedirects; hop++) {
    if (!isSafeFetchUrl(currentUrl)) {
      throw new Error(`Blocked redirect target: ${currentUrl}`);
    }

    const response = await axios.get(currentUrl, {
      ...config,
      maxRedirects: 0,
      // Treat 3xx as a resolved response instead of an axios error so we can
      // inspect the Location ourselves; everything >=400 still throws.
      validateStatus: (status) => status < 400,
    });

    const status = response.status ?? 200;
    if (status < 300 || status >= 400) {
      return response;
    }

    const location = response.headers?.["location"] as string | undefined;
    if (!location) {
      return response;
    }
    // Location may be relative; resolve against the current URL.
    currentUrl = new URL(location, currentUrl).toString();
  }

  throw new Error(`Too many redirects while fetching ${url}`);
};
