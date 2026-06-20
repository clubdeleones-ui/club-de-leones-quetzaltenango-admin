import { initializeApp, getApps, getApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

// Configuración de Firebase para el proyecto 'club-leones-quetzaltenango'
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "AIzaSyC08B_CEENQfWsAqIw8E15OKc61gA_6e68",
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "club-leones-quetzaltenango.firebaseapp.com",
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "club-leones-quetzaltenango",
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || "club-leones-quetzaltenango.firebasestorage.app",
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "373834259776",
  appId: import.meta.env.VITE_FIREBASE_APP_ID || "1:373834259776:web:7c2ac8c45998abe9b12ea5",
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID || "G-5T39KX2E3M"
};

// Inicializamos Firebase
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();
const db = getFirestore(app);
const storage = getStorage(app);

export { app, db, storage };
