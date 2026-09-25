import { hostnameFromHost } from "@/lib/workspaces/access";

const LOOPBACK = new Set(["localhost", "127.0.0.1", "::1"]);

export function loopbackAllowed(hostHeader: string | null | undefined): boolean {
  if (process.env.WEASELNET_ALLOW_NON_LOOPBACK === "true") return true;
  const hostname = hostnameFromHost(hostHeader);
  if (!hostname) return false;
  return LOOPBACK.has(hostname);
}

export function cookieSecure(protocol: string): boolean {
  return protocol === "https:";
}

export function sameOrigin(input: {
  origin: string | null;
  protocol: string;
  host: string;
}): boolean {
  // Compare with the request Host header. Next can report `localhost` on
  // request.url while the browser used `127.0.0.1` for the same loopback server.
  if (!input.origin || !input.host) return false;
  try {
    const origin = new URL(input.origin);
    return origin.protocol === input.protocol && origin.host === input.host;
  } catch {
    return false;
  }
}

export function isMutation(method: string): boolean {
  return method !== "GET" && method !== "HEAD" && method !== "OPTIONS";
}
