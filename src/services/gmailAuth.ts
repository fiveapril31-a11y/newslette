import { initializeApp, getApps, getApp } from 'firebase/app';
import {
  getAuth,
  signInWithPopup,
  GoogleAuthProvider,
  onAuthStateChanged,
  signOut,
  User,
} from 'firebase/auth';
import firebaseConfig from '../../firebase-applet-config.json';

// Initialize Firebase App singleton
const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);
export const auth = getAuth(app);

// Configure Google Auth Provider with required Gmail workspace scopes
export const GMAIL_SCOPES = [
  'https://www.googleapis.com/auth/gmail.readonly',
  'https://www.googleapis.com/auth/gmail.modify',
  'https://www.googleapis.com/auth/gmail.send',
];

const provider = new GoogleAuthProvider();
GMAIL_SCOPES.forEach((scope) => provider.addScope(scope));

// Configure provider parameters to allow selecting account with hint for akaar.entertainment@gmail.com
provider.setCustomParameters({
  prompt: 'select_account',
  login_hint: 'akaar.entertainment@gmail.com',
});

// Cache the access token in memory ONLY (never in localStorage/sessionStorage)
let cachedAccessToken: string | null = null;
let isSigningIn = false;

/**
 * Initialize auth listener. Call on application load.
 */
export const initAuth = (
  onAuthSuccess?: (user: User, token: string) => void,
  onAuthFailure?: () => void
) => {
  return onAuthStateChanged(auth, async (user: User | null) => {
    if (user) {
      if (cachedAccessToken) {
        if (onAuthSuccess) onAuthSuccess(user, cachedAccessToken);
      } else if (!isSigningIn) {
        cachedAccessToken = null;
        if (onAuthFailure) onAuthFailure();
      }
    } else {
      cachedAccessToken = null;
      if (onAuthFailure) onAuthFailure();
    }
  });
};

export interface SignInResult {
  success: boolean;
  user?: User;
  accessToken?: string;
  cancelled?: boolean;
  blocked?: boolean;
  error?: string;
}

/**
 * Trigger Google Sign-In with popup
 */
export const googleSignIn = async (
  preferredEmail = 'akaar.entertainment@gmail.com'
): Promise<SignInResult> => {
  if (isSigningIn) {
    return { success: false, cancelled: true };
  }

  try {
    isSigningIn = true;
    if (preferredEmail) {
      provider.setCustomParameters({
        prompt: 'select_account',
        login_hint: preferredEmail,
      });
    }

    const result = await signInWithPopup(auth, provider);
    const credential = GoogleAuthProvider.credentialFromResult(result);

    if (!credential?.accessToken) {
      throw new Error('Failed to obtain Gmail OAuth access token from Google sign in');
    }

    cachedAccessToken = credential.accessToken;
    return {
      success: true,
      user: result.user,
      accessToken: cachedAccessToken,
    };
  } catch (error: any) {
    const code = error?.code || '';
    const message = typeof error?.message === 'string' ? error.message : '';

    // Check for popup blocked by browser
    if (code === 'auth/popup-blocked' || message.includes('popup-blocked')) {
      return {
        success: false,
        blocked: true,
        error: 'Pop-up window was blocked by your browser. Please allow popups or open the app in a new tab.',
      };
    }

    // Check for access denied or test user restriction
    if (
      code === 'auth/access-denied' ||
      message.includes('access_denied') ||
      message.includes('access-denied') ||
      message.includes('developer-approved testers')
    ) {
      return {
        success: false,
        error: 'Access blocked (Error 403: access_denied). Please add akaar.entertainment@gmail.com to "Test users" in Google Cloud Console.',
      };
    }

    // Check for user-initiated dismissal / popup closed
    const isUserDismissal =
      code === 'auth/popup-closed-by-user' ||
      code === 'auth/cancelled-popup-request' ||
      message.includes('popup-closed-by-user') ||
      message.includes('cancelled-popup-request');

    if (isUserDismissal) {
      return {
        success: false,
        cancelled: true,
        error:
          'Sign-in was closed before completing. If you saw "Access blocked: Error 403", add your email to Google Cloud Test Users.',
      };
    }

    // Check for unauthorized domain
    if (code === 'auth/unauthorized-domain' || message.includes('unauthorized-domain')) {
      return {
        success: false,
        error: 'Current domain is not authorized in Firebase Auth. Open the app in a new browser tab.',
      };
    }

    console.error('Google Gmail Sign-in Error:', error);
    return {
      success: false,
      error: message || 'Failed to sign in with Google.',
    };
  } finally {
    isSigningIn = false;
  }
};

/**
 * Retrieve cached memory access token
 */
export const getAccessToken = async (): Promise<string | null> => {
  return cachedAccessToken;
};

/**
 * Set memory access token
 */
export const setCachedToken = (token: string | null) => {
  cachedAccessToken = token;
};

/**
 * Log out and clear memory token
 */
export const logout = async () => {
  await signOut(auth);
  cachedAccessToken = null;
};
