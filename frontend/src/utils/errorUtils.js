/**
 * Safely extracts a human-readable string from any error type or structure
 * to prevent React Error #31 (Objects are not valid as a React child).
 *
 * @param {any} err - The error caught (string, Error, Axios error, or server response object)
 * @param {string} fallback - Fallback message if extraction yields nothing
 * @returns {string} - Clean error message string safe to render in JSX
 */
export const formatErrorMessage = (err, fallback = 'An unexpected error occurred. Please try again.') => {
  if (!err) return fallback;

  // Already a string
  if (typeof err === 'string') return err;

  // Standard JS Error instance
  if (err instanceof Error) {
    return err.message || fallback;
  }

  // Object checks
  if (typeof err === 'object') {
    // If err.error is a string (e.g. { success: false, error: "Database connection failed" })
    if (typeof err.error === 'string' && err.error.trim()) {
      return err.error;
    }

    // If err.message is a string (e.g. { message: "Invalid credentials" })
    if (typeof err.message === 'string' && err.message.trim()) {
      return err.message;
    }

    // If err.error is a nested object (e.g. Vercel error payload { error: { code: "...", message: "..." } })
    if (err.error && typeof err.error === 'object') {
      const nested = err.error.message || err.error.code;
      if (nested && typeof nested === 'string') return nested;
      try {
        return JSON.stringify(err.error);
      } catch {
        return fallback;
      }
    }

    // If err has code and message (e.g. { code: "FUNCTION_INVOCATION_FAILED", message: "..." })
    if (err.code && err.message) {
      const codeStr = typeof err.code === 'string' ? err.code : '';
      const msgStr = typeof err.message === 'string' ? err.message : '';
      if (codeStr && msgStr) return `${codeStr}: ${msgStr}`;
      if (msgStr) return msgStr;
      if (codeStr) return codeStr;
    }

    // Fallbacks on object properties
    if (err.msg && typeof err.msg === 'string') return err.msg;
    if (err.statusText && typeof err.statusText === 'string') return err.statusText;

    try {
      const str = JSON.stringify(err);
      if (str && str !== '{}') return str;
    } catch {
      return fallback;
    }
  }

  return String(err) || fallback;
};

export default formatErrorMessage;
