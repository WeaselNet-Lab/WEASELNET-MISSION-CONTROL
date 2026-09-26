/** Public label for the cospace record. Internal slug and routes stay put. */
export function publicProjectName(card: { slug: string; visitorTitle: string }): string {
  if (card.slug === "cospace" && isLegacyCoSpace(card.visitorTitle)) return "Here²";
  return card.visitorTitle;
}

export function publicNoteLabel(note: { slug: string; label: string }): string {
  if (note.slug === "cospace" && isLegacyCoSpace(note.label)) return "Here²";
  return note.label;
}

export function publicThreadTags(tags: string): string {
  return tags.replaceAll("CO-SPACE", "HERE²").replaceAll("Co-Space", "Here²");
}

/** Rewrite the legacy project name inside free prose for public display. */
export function publicNoteText(text: string): string {
  return text.replace(/co[-\s]?space/gi, (match) =>
    match === match.toUpperCase() ? "HERE²" : "Here²",
  );
}

function isLegacyCoSpace(value: string): boolean {
  return /^co[-\s]?space$/i.test(value.trim());
}
