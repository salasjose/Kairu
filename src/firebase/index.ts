import { initializeApp, getApps, getApp, FirebaseApp } from "firebase/app";
import { getAuth, Auth } from "firebase/auth";
import { getFirestore, Firestore } from "firebase/firestore";
import { firebaseConfig } from "./config";

// This object will hold the initialized Firebase services.
interface FirebaseServices {
  app: FirebaseApp;
  auth: Auth;
  db: Firestore;
}

let firebaseServices: FirebaseServices | null = null;

/**
 * Initializes Firebase and returns the services.
 * This function is safe to call multiple times, as it will only initialize Firebase once.
 * It's designed to work correctly on both the server and the client in a Next.js environment.
 */
export function initializeFirebase(): FirebaseServices {
  if (typeof window === "undefined") {
    // On the server, return a placeholder or null to avoid errors.
    // The actual Firebase services will be initialized on the client.
    if (firebaseServices) {
      return firebaseServices;
    }
    // A bit of a hack to satisfy TypeScript, but these won't actually be used on the server.
    return { app: {} as FirebaseApp, auth: {} as Auth, db: {} as Firestore };
  }

  // On the client, initialize Firebase if it hasn't been already.
  if (!firebaseServices) {
    const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
    const auth = getAuth(app);
    const db = getFirestore(app);
    firebaseServices = { app, auth, db };
  }

  return firebaseServices;
}
