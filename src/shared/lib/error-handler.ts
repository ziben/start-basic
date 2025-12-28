export function getErrorMessage(error: unknown): string {
  if (error && typeof error === 'object') {
    if ('type' in error && 'message' in error) {
      const apiError = error as { type: string; message: string }
      return apiError.message
    }
    if ('name' in error && error.name === 'ZodError') {
      return 'Validation failed. Please check your input.'
    }
    if ('message' in error && typeof error.message === 'string') {
      return error.message
    }
  }
  if (typeof error === 'string') {
    return error
  }
  return 'An unexpected error occurred'
}
