import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyBhqkYfsGMLREgMm9NYstLfRzRJdILTFDY",
  authDomain: "flashcard-app-6ab27.firebaseapp.com",
  projectId: "flashcard-app-6ab27",
  storageBucket: "flashcard-app-6ab27.firebasestorage.app",
  messagingSenderId: "144730253457",
  appId: "1:144730253457:web:920e2b33de530bc288f730"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();