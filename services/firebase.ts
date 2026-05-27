import { initializeApp, getApps, getApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

// Configuración de Firebase para el proyecto 'parqueo-cueva'
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "AIzaSyCw7TDB7dX1zKHgv_aRwW6a0oeEhzuVgwo",
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "parqueo-cueva.firebaseapp.com",
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "parqueo-cueva",
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || "parqueo-cueva.firebasestorage.app",
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "1068918179614",
  appId: import.meta.env.VITE_FIREBASE_APP_ID || "1:1068918179614:web:9fc85b670023058c3fab0f",
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID || "G-378VBWF19W"
};

// Inicializamos Firebase
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();
const db = getFirestore(app);
const storage = getStorage(app);

export { app, db, storage };
