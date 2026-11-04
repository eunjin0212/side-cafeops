const PERMISSION_DENIED_CODE = '42501';

// Logs the real database error and returns one that's safe to show users.
export function serviceError(
  logContext: string,
  error: { code?: string; message: string },
  message: string,
  deniedMessage = 'You do not have permission to perform this action.',
): Error {
  console.error(logContext, error);
  return new Error(error.code === PERMISSION_DENIED_CODE ? deniedMessage : message);
}
