import { initializeApp, getApps, getApp } from "firebase/app";

const firebaseConfig = {
  apiKey: "AIzaSyAN87MAmB-DuuHKvhB8fFGCyLX3KDLjVFw",
  authDomain: "stravafy-e40cb.firebaseapp.com",
  projectId: "stravafy-e40cb",
  storageBucket: "stravafy-e40cb.appspot.com",
  messagingSenderId: "920752560346",
  appId: "1:920752560346:web:c9f71e3eadb7fc29af2de3",
};

// Check if there are no initialized apps
const apps = getApps();
const app = apps.length ? getApp() : initializeApp(firebaseConfig);

export default app;
