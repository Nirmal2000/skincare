import { supabase } from './supabase-client';

/**
 * Send OTP to user's email for authentication
 * Creates user account if it doesn't exist
 */
export async function sendEmailOtp(email: string) {
  console.log('[Email Auth] Sending OTP to:', email);

  const { data, error } = await supabase.auth.signInWithOtp({
    email,
    options: {
      // Auto-create user if doesn't exist (signup flow)
      shouldCreateUser: true,
    },
  });

  if (error) {
    console.error('[Email Auth] Error sending OTP:', error);
    throw error;
  }

  console.log('[Email Auth] OTP sent successfully');
  // data.user & data.session are null here; OTP is sent by email
  return data;
}

/**
 * Verify the OTP code and create session
 * Returns session if successful
 */
export async function verifyEmailOtp(email: string, code: string) {
  console.log('[Email Auth] Verifying OTP for:', email);

  const { data, error } = await supabase.auth.verifyOtp({
    email,
    token: code,
    type: 'email', // email OTP type
  });

  if (error) {
    console.error('[Email Auth] Error verifying OTP:', error);
    throw error;
  }

  console.log('[Email Auth] OTP verified successfully, session created');
  console.log('[Email Auth] Access Token:', data.session?.access_token);
  console.log('[Email Auth] Refresh Token:', data.session?.refresh_token);
  // If successful, you now have a valid session and a user
  return data.session;
}

/**
 * Set password for the currently logged-in user
 * Call this after OTP verification for new users
 */
export async function setInitialPassword(password: string) {
  console.log('[Email Auth] Setting initial password for user');

  const { data, error } = await supabase.auth.updateUser({
    password,
  });

  if (error) {
    console.error('[Email Auth] Error setting password:', error);
    throw error;
  }

  console.log('[Email Auth] Password set successfully');
  return data.user;
}

/**
 * Sign in with email and password
 * For returning users who already have a password
 */
export async function signInWithPassword(email: string, password: string) {
  console.log('[Email Auth] Signing in with email and password:', email);

  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    console.error('[Email Auth] Error signing in with password:', error);
    throw error;
  }

  console.log('[Email Auth] Signed in successfully with password');
  console.log('[Email Auth] Access Token:', data.session?.access_token);
  console.log('[Email Auth] Refresh Token:', data.session?.refresh_token);
  return data.session;
}

/**
 * Request password reset OTP
 * Sends OTP to user's email for password reset verification
 */
export async function requestPasswordReset(email: string) {
  console.log('[Email Auth] Requesting password reset for:', email);

  const { data, error } = await supabase.auth.signInWithOtp({
    email,
    options: {
      shouldCreateUser: false, // Don't create new user for password reset
    },
  });

  if (error) {
    console.error('[Email Auth] Error requesting password reset:', error);
    throw error;
  }

  console.log('[Email Auth] Password reset OTP sent');
  return data;
}

/**
 * Get user-friendly error message from Supabase error
 */
export function getAuthErrorMessage(error: any): string {
  if (!error) return 'An unknown error occurred';

  const message = error.message?.toLowerCase() || '';

  // OTP-related errors
  if (message.includes('otp') && message.includes('expired')) {
    return 'Your verification code has expired. Please request a new one.';
  }
  if (message.includes('otp') && message.includes('invalid')) {
    return 'Invalid verification code. Please check and try again.';
  }
  if (message.includes('email rate limit')) {
    return 'Too many attempts. Please wait a minute before trying again.';
  }

  // Password-related errors
  if (message.includes('invalid login credentials')) {
    return 'Invalid email or password. Please check your credentials.';
  }
  if (message.includes('password') && message.includes('weak')) {
    return 'Password is too weak. Please use at least 6 characters.';
  }
  if (message.includes('user not found')) {
    return 'No account found with this email. Please sign up first.';
  }
  if (message.includes('user already registered')) {
    return 'An account with this email already exists. Please sign in instead.';
  }

  // Email-related errors
  if (message.includes('invalid email')) {
    return 'Please enter a valid email address.';
  }

  // Network errors
  if (message.includes('network') || message.includes('fetch')) {
    return 'Network error. Please check your connection and try again.';
  }

  // Default fallback
  return error.message || 'An error occurred. Please try again.';
}
