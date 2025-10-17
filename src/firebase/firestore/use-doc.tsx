'use client';

import { useState, useEffect } from 'react';
import {
  doc,
  onSnapshot,
  DocumentReference,
  DocumentData,
  FirestoreError,
} from 'firebase/firestore';
import { useFirestore, useMemoFirebase } from '@/firebase/provider';
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError } from '@/firebase/errors';


/** Utility type to add an 'id' field to a given type T. */
export type WithId<T> = T & { id: string };

/**
 * Interface for the return value of the useDoc hook.
 * @template T Type of the document data.
 */
export interface UseDocResult<T> {
  data: WithId<T> | null;
  isLoading: boolean;
  error: FirestoreError | Error | null;
}

/**
 * React hook to subscribe to a single Firestore document in real-time.
 * It gracefully handles cases where the path might be undefined during initial renders.
 * 
 * IMPORTANT! YOU MUST MEMOIZE the inputted memoizedTargetRefOrQuery or BAD THINGS WILL HAPPEN
 * use useMemo to memoize it per React guidence.  Also make sure that it's dependencies are stable
 * references
 *
 * @template T The expected type of the document data.
 * @param {DocumentReference<DocumentData> | null | undefined} targetRef - The Firestore
 * DocumentReference to subscribe to. If null or undefined, the hook will wait.
 * @returns {UseDocResult<T>} An object containing the document data, loading state, and any error.
 */
export function useDoc<T = any>(
  memoizedTargetRef: (DocumentReference<DocumentData> & {__memo?: boolean})  | null | undefined
): UseDocResult<T> {
  type ResultType = WithId<T> | null;

  const [data, setData] = useState<ResultType>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<FirestoreError | Error | null>(null);

  useEffect(() => {
    // If the reference is not provided, reset state and do nothing.
    if (!memoizedTargetRef) {
      setIsLoading(false);
      setData(null);
      setError(null);
      return;
    }

    setIsLoading(true);

    const unsubscribe = onSnapshot(
      memoizedTargetRef,
      (docSnapshot) => {
        if (docSnapshot.exists()) {
          setData({ ...(docSnapshot.data() as T), id: docSnapshot.id });
        } else {
          setData(null); // Document does not exist
        }
        setError(null);
        setIsLoading(false);
      },
      (err: FirestoreError) => {
        const contextualError = new FirestorePermissionError({
          path: memoizedTargetRef.path,
          operation: 'get',
        });
        setError(contextualError);
        setData(null);
        setIsLoading(false);

        // trigger global error propagation
        errorEmitter.emit('permission-error', contextualError);
      }
    );

    // Cleanup subscription on unmount or when the reference changes.
    return () => unsubscribe();
  }, [memoizedTargetRef]); // Dependency array ensures effect re-runs if the ref changes.

  if(memoizedTargetRef && !memoizedTargetRef.__memo) {
    throw new Error(memoizedTargetRef + ' was not properly memoized using useMemoFirebase');
  }

  return { data, isLoading, error };
}
