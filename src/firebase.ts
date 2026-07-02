import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyAzM9UUBbSIoRi8n1fi08mHxyJBbGHxBTA",
  authDomain: "santa-blanca-news.firebaseapp.com",
  projectId: "santa-blanca-news",
  storageBucket: "santa-blanca-news.firebasestorage.app",
  messagingSenderId: "964213822977",
  appId: "1:964213822977:web:6360d4baf41a5171681200",
  measurementId: "G-XDCK556HFH"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
