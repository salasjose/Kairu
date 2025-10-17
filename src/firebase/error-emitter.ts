'use client';
import type { FirestorePermissionError } from '@/firebase/errors';

// Define the event map with typed payloads.
type Events = {
  'permission-error': FirestorePermissionError;
};

type EventName = keyof Events;

/**
 * A simple, typed event emitter for handling specific app-wide events.
 * This is used to decouple error generation from error handling.
 */
class EventEmitter<T extends Record<string, any>> {
  private listeners: { [K in keyof T]?: ((payload: T[K]) => void)[] } = {};

  /**
   * Registers a listener for a specific event.
   * @param eventName The name of the event to listen for.
   * @param callback The function to execute when the event is emitted.
   */
  on<K extends keyof T>(eventName: K, callback: (payload: T[K]) => void) {
    if (!this.listeners[eventName]) {
      this.listeners[eventName] = [];
    }
    this.listeners[eventName]!.push(callback);
  }

  /**
   * Unregisters a listener for a specific event.
   * @param eventName The name of the event.
   * @param callback The listener function to remove.
   */
  off<K extends keyof T>(eventName: K, callback: (payload: T[K]) => void) {
    if (!this.listeners[eventName]) {
      return;
    }
    this.listeners[eventName] = this.listeners[eventName]!.filter(
      (cb) => cb !== callback
    );
  }

  /**
   * Emits an event with a payload, calling all registered listeners.
   * @param eventName The name of the event to emit.
   * @param payload The data to pass to the listeners.
   */
  emit<K extends keyof T>(eventName: K, payload: T[K]) {
    if (!this.listeners[eventName]) {
      return;
    }
    this.listeners[eventName]!.forEach((callback) => {
      callback(payload);
    });
  }
}

// Create and export a singleton instance of the event emitter for Firestore permission errors.
export const errorEmitter = new EventEmitter<Events>();
