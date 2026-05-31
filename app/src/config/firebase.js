import { initializeApp, getApps, getApp } from 'firebase/app';
import { getDatabase } from 'firebase/database';

// Full Firebase configuration — all fields required for production APK
const firebaseConfig = {
  apiKey: "xxxxxxxxxxxxxxxxxxxxxxxx",
  authDomain: "xxxxxxxxxxxxxx.firebaseapp.com",
  databaseURL: "https://xxxxxxxxxxxxxxxxxxxxxx.asia-southeast1.firebasedatabase.app",
  projectId: "xxxxxxxxxxxxxxxxxxxx",
  storageBucket: "xxxxxxxxxxxxxxxx.appspot.com",
  messagingSenderId: "3847438xxxxxxxxx",
  appId: "xxxxxxxxxxxxxxxxxxxxxx"
};

// Guard against hot-reload re-initialization (causes crash in dev + APK)
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();

// Export the database instance for use in components
export const database = getDatabase(app);
