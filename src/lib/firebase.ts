import { getApp, getApps, initializeApp } from "firebase/app";
import { getFirestore, initializeFirestore, persistentLocalCache, persistentMultipleTabManager } from "firebase/firestore";
import { getStorage } from "firebase/storage";

const firebaseConfig = {
  apiKey: "AIzaSyBvrUwZe1RyOW2CYohGnktX0gVNtRc6rz8",
  authDomain: "signage-12.firebaseapp.com",
  projectId: "signage-12",
  storageBucket: "signage-12.firebasestorage.app",
  messagingSenderId: "669989951114",
  appId: "1:669989951114:web:8674df71a6d34e7d097f73",
  measurementId: "G-VKCTJHLF9H"
};

let app;
let db: ReturnType<typeof getFirestore>;
let storage: ReturnType<typeof getStorage>;

if (!getApps().length) {
  app = initializeApp(firebaseConfig);
  if (typeof window !== "undefined") {
    try {
      db = initializeFirestore(app, {
        localCache: persistentLocalCache({ tabManager: persistentMultipleTabManager() })
      });
    } catch(e) {
      db = getFirestore(app);
    }
  } else {
    db = getFirestore(app);
  }
} else {
  app = getApp();
  db = getFirestore(app);
}

storage = getStorage(app);

export { app, db, storage };
