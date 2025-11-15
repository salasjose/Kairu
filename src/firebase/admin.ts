import * as admin from 'firebase-admin';
import { firebaseConfig } from '@/firebase/config';

let adminApp: admin.app.App;

export function initializeAdminApp() {
  if (admin.apps.length > 0) {
    adminApp = admin.app();
  } else {
    adminApp = admin.initializeApp({
      credential: admin.credential.applicationDefault(),
      storageBucket: firebaseConfig.storageBucket
    });
  }
  return adminApp;
}

export function getAdminStorage(app: admin.app.App) {
    return app.storage();
}
