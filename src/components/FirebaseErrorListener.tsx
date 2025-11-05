"use client";

import { useEffect } from "react";
import { errorEmitter } from "@/firebase/error-emitter";
import type { FirestorePermissionError } from "@/firebase/errors";
import { toast } from "@/hooks/use-toast";

/**
 * A client-side component that listens for Firestore permission errors
 * and displays them as toasts during development. This provides immediate
 * feedback for security rule violations.
 */
export default function FirebaseErrorListener() {
  useEffect(() => {
    const handleError = (error: FirestorePermissionError) => {
      console.error(
        "Firestore Permission Error Caught:",
        JSON.stringify(error.request, null, 2)
      );

      // In a real app, you might use a more sophisticated logging service.
      // For this demo, we'll show a toast in development.
      if (process.env.NODE_ENV === "development") {
        toast({
          variant: "destructive",
          title: "Firestore Security Rule Denied",
          description: (
            <pre className="mt-2 w-[340px] rounded-md bg-slate-950 p-4">
              <code className="text-white">{error.message}</code>
            </pre>
          ),
        });
      }
    };

    // Subscribe to the event
    errorEmitter.on("permission-error", handleError);

    // Unsubscribe on cleanup
    return () => {
      errorEmitter.off("permission-error", handleError);
    };
  }, []);

  return null; // This component does not render anything
}
