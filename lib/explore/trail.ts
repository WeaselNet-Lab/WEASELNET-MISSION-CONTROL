export const TRAIL_LIMIT = 24;

export function pushTrail(history: string[], key: string): string[] {
  const next = [...history, key];
  if (next.length <= TRAIL_LIMIT) return next;
  return next.slice(next.length - TRAIL_LIMIT);
}

export function trailBack(history: string[], index: number): string[] {
  if (index < 0 || index >= history.length) return history;
  return history.slice(0, index + 1);
}

export function visibleLinks<T extends { targetSlug: string }>(
  links: T[],
  available: ReadonlySet<string>,
): T[] {
  return links.filter((link) => available.has(link.targetSlug));
}

export function pickDiscovery(pool: string[], last: string | null, random = Math.random): string | null {
  if (pool.length === 0) return null;
  if (pool.length === 1) return pool[0];
  let pick = pool[Math.floor(random() * pool.length)] ?? pool[0];
  let guard = 0;
  while (pick === last && guard < 8) {
    pick = pool[Math.floor(random() * pool.length)] ?? pool[0];
    guard += 1;
  }
  return pick;
}
