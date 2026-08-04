/**
 * Utility to extract CSRF token from document cookies.
 * Saved with the server's XSRF-TOKEN cookie implementation.
 */
export function getCsrfToken(): string {
  if (typeof document === 'undefined') return '';
  
  const value = `; ${document.cookie}`;
  const parts = value.split(`; XSRF-TOKEN=`);
  if (parts.length === 2) {
    return parts.pop()?.split(';').shift() || '';
  }
  
  return '';
}
