import { initializeApp, getApps, getApp } from 'firebase/app';
import { getDatabase } from 'firebase/database';

export const firebaseConfig = {
 apiKey: "xxxxxxxxxxxxxxxxxxxxxxxx",
  authDomain: "xxxxxxxxxxxxxx.firebaseapp.com",
  databaseURL: "https://xxxxxxxxxxxxxxxxxxxxxx.asia-southeast1.firebasedatabase.app",
  projectId: "xxxxxxxxxxxxxxxxxxxx",
  storageBucket: "xxxxxxxxxxxxxxxx.appspot.com",
  messagingSenderId: "3847438xxxxxxxxx",
  appId: "xxxxxxxxxxxxxxxxxxxxxx"
};

// Initialize Firebase app, guard against duplicate initializations
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();

export const database = getDatabase(app);
