export const env = {
  firebaseApiKey: import.meta.env.VITE_FIREBASE_API_KEY || import.meta.env.FIREBASE_API_KEY,
  firebaseAuthDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || import.meta.env.FIREBASE_AUTH_DOMAIN,
  firebaseProjectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || import.meta.env.FIREBASE_PROJECT_ID,
  firebaseStorageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || import.meta.env.FIREBASE_STORAGE_BUCKET,
  firebaseMessagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || import.meta.env.FIREBASE_MESSAGING_SENDER_ID,
  firebaseAppId: import.meta.env.VITE_FIREBASE_APP_ID || import.meta.env.FIREBASE_APP_ID,
  geminiApiKey: import.meta.env.VITE_GEMINI_API_KEY || import.meta.env.GEMINI_API_KEY,
  googleClientId: import.meta.env.VITE_GOOGLE_CLIENT_ID || '809679443982-1cohbkabbq88i05uk4d620013g5msed6.apps.googleusercontent.com'
};

// Check for critical missing variables in development
if (import.meta.env.DEV) {
  if (!env.firebaseApiKey) {
    console.warn('VITE_FIREBASE_API_KEY no está definido. Asegúrate de configurarlo en .env');
  }
}
