/** Extract a user-facing message from local service errors. */
export function getServiceErrorMessage(error: unknown, fallback = 'Error inesperado'): string {
  if (error instanceof Error && error.message) return error.message;
  if (typeof error === 'string') return error;
  return fallback;
}

/** Shape compatible with old axios error handling in screens. */
export function wrapServiceError(error: unknown): { message: string; response?: undefined } {
  return { message: getServiceErrorMessage(error), response: undefined };
}
