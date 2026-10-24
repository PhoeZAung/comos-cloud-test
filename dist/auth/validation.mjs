export function validateAuth(kind, values) {
  if (!['signin','signup','reset'].includes(kind)) throw new Error('Unknown form.');
  const errors = {};
  const email = typeof values.email === 'string' ? values.email.trim() : '';
  const password = typeof values.password === 'string' ? values.password : '';
  if (!email || email.length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) errors.email = 'Enter a valid email address.';
  if (kind !== 'reset' && (!password || password.length > 128)) errors.password = 'Enter your password (up to 128 characters).';
  // Provider password policy remains authoritative; never trim or alter passwords.
  if (kind === 'signup' && password.length < 8) errors.password = 'Use at least 8 characters.';
  if (kind === 'signup' && values.confirm !== password) errors.confirm = 'Passwords do not match.';
  return errors;
}
export function authMessage(error) {
  const messages = {
    'auth/invalid-credential': 'Unable to sign in. Check your email and password.',
    'auth/wrong-password': 'Unable to sign in. Check your email and password.',
    'auth/user-not-found': 'Unable to sign in. Check your email and password.',
    'auth/email-already-in-use': 'Unable to create this account. Try signing in or resetting your password.',
    'auth/weak-password': 'Choose a stronger password that meets the account requirements.',
    'auth/password-does-not-meet-requirements': 'Choose a stronger password that meets the account requirements.',
    'auth/too-many-requests': 'Too many attempts. Wait a moment and try again.',
    'auth/network-request-failed': 'Connection interrupted. Check your connection and try again.',
    'auth/popup-blocked': 'Allow the Google sign-in popup, then try again.',
    'auth/popup-closed-by-user': 'Google sign-in was closed. You can try again.',
    'auth/account-exists-with-different-credential': 'Use your original sign-in method for this account.',
    'session/unavailable': 'The account service is unavailable. Try again shortly.',
    'profile/conflict': 'Your profile changed in another session. Reload to see the latest version.',
    'form/invalid': 'Check the highlighted fields and try again.',
    'session/rate-limited': 'Too many requests. Wait a minute and try again.',
    'session/busy': 'Please wait for the current request to finish.',
    'session/required': 'Your session ended. Please sign in again.',
  };
  return messages[error?.code] || 'Unable to complete this request. Please try again.';
}

export function validateProfile(values) {
  const name = typeof values.displayName === 'string' ? values.displayName.trim() : '';
  return !name || name.length > 80 || /[\u0000-\u001f\u007f]/u.test(name) ? { displayName: 'Enter a display name of 1–80 characters.' } : {};
}
