'use client';

import { useMemo, type DependencyList } from 'react';
import type { Query, DocumentReference } from 'firebase/firestore';

type FirebaseRef = (Query | DocumentReference) & { __memo?: boolean };

/**
 * A hook to memoize Firebase queries and document references.
 * It's a wrapper around `useMemo` that adds a `__memo` property to the returned object.
 * This property is used by `useCollection` and `useDoc` to ensure that the query/reference
 * is properly memoized, preventing infinite loops.
 */
export function useMemoFirebase<T extends FirebaseRef | null | undefined>(
  factory: () => T,
  deps: DependencyList | undefined
): T {
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const memoizedRef = useMemo(factory, deps);

  if (memoizedRef) {
    memoizedRef.__memo = true;
  }

  return memoizedRef;
}
