import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyBwW2ESIFKrTVMauwYvi9GTNmuSo5Kj5p0",
  authDomain: "evencers-3078b.firebaseapp.com",
  projectId: "evencers-3078b",
  appId: "1:382533521520:web:8307d67304b68804c6e4b5"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);