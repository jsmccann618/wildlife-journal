import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

const firebaseConfig = {
  apiKey: "AIzaSyDJo9nnOVt0hSR6YdngyuZhiimdzvg6n7A",
  authDomain: "wildlife-journal-978fa.firebaseapp.com",
  projectId: "wildlife-journal-978fa",
  storageBucket: "wildlife-journal-978fa.firebasestorage.app",
  messagingSenderId: "456351309551",
  appId: "1:456351309551:web:6f560942ea3e4fd9b7451a"
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
export const storage = getStorage(app);
