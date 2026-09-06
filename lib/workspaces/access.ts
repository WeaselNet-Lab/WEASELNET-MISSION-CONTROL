/**
 * Development preview access helpers.
 *
 * Host checking is defense-in-depth for a localhost-bound preview only.
 * It is not authentication and must not be described as a real security boundary.
 * Production denial is unconditional (NODE_ENV === "production").
 */

export type PreviewAccessInput = {
  nodeEnv: string | undefined;
  /** Request Host header. Used only as a non-production loopback check. */
  host: string | null | undefined;
  /**
   * Ignored intentionally. X-Forwarded-Host (or equivalents) must never grant
   * development preview access.
   */
  forwardedHost?: string | null | undefined;
};

const LOCAL_HOSTS = new Set(["localhost", "127.0.0.1", "::1"]);

/**
 * Extract a hostname from a Host header value.
 * Returns null for missing or malformed values (fail closed).
 */
export function hostnameFromHost(host: string | null | undefined): string | null {
  if (!host) return null;
  const trimmed = host.trim().toLowerCase();
  if (!trimmed) return null;

  // Bracketed IPv6: [::1] or [::1]:43147
  if (trimmed.startsWith("[")) {
    const end = trimmed.indexOf("]");
    if (end > 1) return trimmed.slice(1, end);
    return null;
  }

  // hostname:port or IPv4:port
  const colon = trimmed.lastIndexOf(":");
  if (colon > -1) {
    const maybePort = trimmed.slice(colon + 1);
    if (/^\d+$/.test(maybePort)) {
      const name = trimmed.slice(0, colon);
      return name.length > 0 ? name : null;
    }
  }

  return trimmed;
}

/**
 * Whether development workspace previews may render.
 * - Production: always denied.
 * - Non-production: Host must be a loopback name (defense-in-depth; bind to 127.0.0.1 for real isolation).
 * - forwardedHost is never consulted.
 */
export function isDevelopmentPreviewAllowed(input: PreviewAccessInput): boolean {
  void input.forwardedHost;
  if (input.nodeEnv === "production") return false;
  const hostname = hostnameFromHost(input.host);
  if (!hostname) return false;
  return LOCAL_HOSTS.has(hostname);
}

export function developmentPreviewDenialReason(
  input: PreviewAccessInput,
): string | null {
  if (isDevelopmentPreviewAllowed(input)) return null;
  if (input.nodeEnv === "production") {
    return "Development workspace previews are unavailable in production.";
  }
  return "Development workspace previews are limited to localhost.";
}
