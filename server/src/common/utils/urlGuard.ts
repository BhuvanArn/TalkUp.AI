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
  if (host.includes(":") && isBlockedIPv6(parsed.host)) {
    return false;
  }

  return true;
};
