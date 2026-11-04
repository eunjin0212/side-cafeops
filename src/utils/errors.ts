// The message for a React Query error: services throw user-safe Errors, and the
// fallback covers anything else.
export function queryErrorMessage(error: unknown, fallback: string): string | null {
  if (!error) return null;
  return error instanceof Error ? error.message : fallback;
}
