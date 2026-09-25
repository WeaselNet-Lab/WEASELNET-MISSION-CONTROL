export class ValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ValidationError";
  }
}

export class RevisionConflictError extends Error {
  constructor() {
    super("The record changed since you opened it.");
    this.name = "RevisionConflictError";
  }
}

const SLUG = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const DEPARTMENTS = new Set([
  "command",
  "vr-lab",
  "flight-systems",
  "robotics",
  "benchmark-lab",
  "hardware",
  "living-art",
  "experimental",
]);
const STATUSES = new Set(["active", "alpha", "parked", "concept", "shipped"]);

export function requireSlug(value: unknown, label = "Slug"): string {
  if (typeof value !== "string" || !SLUG.test(value) || value.length > 64) {
    throw new ValidationError(`${label} must be a lowercase slug.`);
  }
  return value;
}

export function requireText(value: unknown, label: string, max: number, min = 1): string {
  if (typeof value !== "string") throw new ValidationError(`${label} is required.`);
  const trimmed = value.trim();
  if (trimmed.length < min || trimmed.length > max) {
    throw new ValidationError(`${label} must be ${min}-${max} characters.`);
  }
  return trimmed;
}

export function optionalText(value: unknown, label: string, max: number): string | null {
  if (value == null || value === "") return null;
  return requireText(value, label, max);
}

export function requireDepartment(value: unknown): string {
  if (typeof value !== "string" || !DEPARTMENTS.has(value)) {
    throw new ValidationError("Department is not recognized.");
  }
  return value;
}

export function requireStatus(value: unknown): string {
  if (typeof value !== "string" || !STATUSES.has(value)) {
    throw new ValidationError("Status is not recognized.");
  }
  return value;
}

export function requireStringList(value: unknown, label: string, maxItems: number, maxLen: number): string[] {
  if (!Array.isArray(value)) throw new ValidationError(`${label} must be a list.`);
  if (value.length > maxItems) throw new ValidationError(`${label} has too many items.`);
  return value.map((item, index) => requireText(item, `${label} ${index + 1}`, maxLen));
}

export function assertRevision(value: unknown): number {
  if (typeof value !== "number" || !Number.isInteger(value) || value < 1) {
    throw new ValidationError("A revision is required.");
  }
  return value;
}
