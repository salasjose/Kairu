'use client';
import {
  Auth,
  UserCredential,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
} from 'firebase/auth';

import { errorEmitter } from './error-emitter';
import { FirestorePermissionError } from './errors';

export function createUserWithEmailAndPasswordNonBlocking(
  auth: Auth,
  email: string,
  pass: string
): Promise<UserCredential> {
  const promise = createUserWithEmailAndPassword(auth, email, pass).catch(
    (error) => {
      // Create a generic error for login failure, as detailed context is less critical here.
      const permissionError = new FirestorePermissionError({
        path: 'firebase-auth',
        operation: 'create', // Representing user creation
        requestResourceData: { email: email, error: error.message },
      });

      errorEmitter.emit('permission-error', permissionError);

      // Re-throw the original error to allow the caller's catch block to execute
      throw error;
    }
  );
  return promise;
}


export function signInWithEmailAndPasswordNonBlocking(
  auth: Auth,
  email: string,
  pass: string
): Promise<UserCredential> {
  const promise = signInWithEmailAndPassword(auth, email, pass).catch(
    (error) => {
      // Create a generic error for login failure
      const permissionError = new FirestorePermissionError({
        path: 'firebase-auth',
        operation: 'get', // Representing user login
        requestResourceData: { email: email, error: error.message },
      });

      errorEmitter.emit('permission-error', permissionError);
      throw error;
    }
  );
  return promise;
}
