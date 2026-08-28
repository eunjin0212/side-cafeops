// Supabase/Postgrest returns an embedded to-one join as either the row
// itself or a one-element array, depending on the query shape. Unwrap
// either form to a single row (or null).
export function unwrapJoin<T>(value: T | T[] | null): T | null {
  if (!value) return null;
  return Array.isArray(value) ? (value[0] ?? null) : value;
}
