export const env = {
  firebaseApiKey: import.meta.env.VITE_FIREBASE_API_KEY || import.meta.env.FIREBASE_API_KEY || "AIzaSyC08B_CEENQfWsAqIw8E15OKc61gA_6e68",
  firebaseAuthDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || import.meta.env.FIREBASE_AUTH_DOMAIN || "club-leones-quetzaltenango.firebaseapp.com",
  firebaseProjectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || import.meta.env.FIREBASE_PROJECT_ID || "club-leones-quetzaltenango",
  firebaseStorageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || import.meta.env.FIREBASE_STORAGE_BUCKET || "club-leones-quetzaltenango.firebasestorage.app",
  firebaseMessagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || import.meta.env.FIREBASE_MESSAGING_SENDER_ID || "373834259776",
  firebaseAppId: import.meta.env.VITE_FIREBASE_APP_ID || import.meta.env.FIREBASE_APP_ID || "1:373834259776:web:7c2ac8c45998abe9b12ea5",
  geminiApiKey: import.meta.env.VITE_GEMINI_API_KEY || import.meta.env.GEMINI_API_KEY || (typeof window !== 'undefined' ? localStorage.getItem('gemini_api_key') || '' : ''),
  googleClientId: import.meta.env.VITE_GOOGLE_CLIENT_ID || '809679443982-1cohbkabbq88i05uk4d620013g5msed6.apps.googleusercontent.com',
  recurrenteTestKey: import.meta.env.VITE_RECURRENTE_TEST_KEY || (typeof window !== 'undefined' ? localStorage.getItem('recurrente_test_key') || '' : ''),
  recurrenteLiveKey: import.meta.env.VITE_RECURRENTE_LIVE_KEY || (typeof window !== 'undefined' ? localStorage.getItem('recurrente_live_key') || '' : ''),
  recurrenteTestMode: import.meta.env.VITE_RECURRENTE_TEST_MODE !== 'false'
};

// Check for critical missing variables in development
if (import.meta.env.DEV) {
  if (!env.firebaseApiKey) {
    console.warn('VITE_FIREBASE_API_KEY no está definido. Asegúrate de configurarlo en .env');
  }
}

