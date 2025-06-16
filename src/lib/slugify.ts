// lib/slugify.ts
/**
 * Turn an arbitrary string into a URL–and filesystem–safe slug.
 * - Lowercases
 * - Replaces `&` with `and`
 * - Strips any non-alphanumeric (or dash) characters
 * - Collapses multiple dashes
 * - Trims leading/trailing dashes
 */
export function slugify(raw: string): string {
  return raw
    .toLowerCase()
    .replace(/&/g, 'and')
    .replace(/[^a-z0-9]+/g, '-')   // anything that isn't a–z / 0–9 becomes “-”
    .replace(/^-+|-+$/g, '')       // trim leading/trailing dashes
    .replace(/-+/g, '-');          // collapse multiple dashes
}
