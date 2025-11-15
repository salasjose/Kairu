
import * as admin from 'firebase-admin';
import { firebaseConfig } from './config';

// This file is only ever imported on the server
// "use server" is not needed here because the functions that use this
// will be in files that are already marked as server-side.

let adminApp: admin.app.App;

function initializeAdminApp() {
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

export function getAdminStorage() {
    const app = initializeAdminApp();
    return app.storage();
}
