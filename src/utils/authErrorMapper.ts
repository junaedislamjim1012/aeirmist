/**
 * Maps raw Firebase Auth error codes to user-friendly error messages.
 * Logs original Firebase error details to console in development mode.
 */
export function mapAuthError(error: any): string {
  if (!error) return "An unexpected error occurred. Please try again.";
  
  const code = typeof error === 'string' ? error : error?.code || error?.message || '';
  const message = typeof error === 'object' && error?.message ? error.message : '';

  // Log the original Firebase Auth error details clearly to console
  console.error('[Firebase Auth Debug Log]', {
    code: code || 'UNKNOWN_AUTH_CODE',
    message: message || error,
    originalError: error,
    stack: error?.stack
  });

  if (code.includes('auth/wrong-password') || code.includes('auth/invalid-credential')) {
    return "Incorrect password or credentials. If you registered via Google Sign-In, please use Google or create a password in Settings.";
  }
  if (code.includes('auth/user-not-found')) {
    return "No account found matching this email or username.";
  }
  if (code.includes('auth/invalid-email')) {
    return "Invalid email format. Please check for typos in your email address.";
  }
  if (code.includes('auth/account-exists-with-different-credential')) {
    return "This email is associated with a Google Sign-In account. Please log in with Google.";
  }
  if (code.includes('auth/email-already-in-use')) {
    return "An account with this email address already exists. Please log in instead.";
  }
  if (code.includes('auth/too-many-requests')) {
    return "Too many failed attempts. Access to this account is temporarily paused for security. Please try again later or reset your password.";
  }
  if (code.includes('auth/operation-not-allowed')) {
    return "Email/Password sign-in is currently disabled in Firebase Console. Please enable Email/Password under Authentication -> Sign-in Method.";
  }
  if (code.includes('auth/network-request-failed')) {
    return "Network connection error. Please check your connection and try again.";
  }
  if (code.includes('auth/user-disabled')) {
    return "Your account has been suspended or disabled. Please contact support.";
  }
  if (code.includes('auth/weak-password')) {
    return "Password is too weak. Please use at least 6 characters with mixed letters and numbers.";
  }
  if (code.includes('auth/provider-already-linked')) {
    return "This authentication provider is already linked to your account.";
  }
  if (code.includes('auth/requires-recent-login')) {
    return "This security action requires a recent login. Please re-authenticate.";
  }
  if (code.includes('auth/popup-closed-by-user')) {
    return "Sign-in popup was closed before completing authentication.";
  }
  if (code.includes('auth/popup-blocked')) {
    return "Sign-in popup was blocked by your browser. Please allow popups for Aeirmist.";
  }

  // If custom error message is available and readable, present it cleanly
  if (typeof error === 'object' && error?.message && typeof error.message === 'string' && !error.message.startsWith('Firebase:')) {
    return error.message;
  }

  // Development mode: display exact error code in UI for fast developer debugging
  if (import.meta.env.DEV && code) {
    return `Auth Error [${code}]: ${message || 'Check developer console for details.'}`;
  }

  return code ? `Authentication failed (${code}). Please check your login details.` : "Authentication failed. Please verify your details and try again.";
}
