import { isMutation, loopbackAllowed, sameOrigin } from "@/lib/http/boundary";

export type AccessDecision =
  | { ok: true }
  | { ok: false; status: 401 | 403; error: string };

export function decideOwnerAccess(input: {
  host: string | null;
  method: string;
  origin: string | null;
  protocol: string;
  requestHost: string;
  hasSession: boolean;
  csrfOk: boolean;
}): AccessDecision {
  if (!loopbackAllowed(input.host)) {
    return { ok: false, status: 403, error: "This prototype stays on loopback until private hosting is explicitly enabled." };
  }
  if (!input.hasSession) {
    return { ok: false, status: 401, error: "Sign-in required." };
  }
  if (isMutation(input.method)) {
    if (!sameOrigin({ origin: input.origin, protocol: input.protocol, host: input.requestHost })) {
      return { ok: false, status: 403, error: "Cross-origin write rejected." };
    }
    if (!input.csrfOk) {
      return { ok: false, status: 403, error: "CSRF check failed." };
    }
  }
  return { ok: true };
}

export function decideVisitorAccess(host: string | null): AccessDecision {
  if (!loopbackAllowed(host)) {
    return { ok: false, status: 403, error: "This prototype stays on loopback until private hosting is explicitly enabled." };
  }
  return { ok: true };
}
