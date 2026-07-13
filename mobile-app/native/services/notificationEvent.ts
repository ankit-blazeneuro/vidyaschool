/**
 * notificationEvent.ts
 *
 * Thin event bus that bridges a native DeviceEventEmitter "notification_tapped"
 * event to any JS listener (e.g. DashboardLayout → open notification drawer).
 *
 * Usage
 *   Emit (from MainActivity via DeviceEventEmitter) → handled automatically.
 *   Subscribe: NotificationEvent.onTap(callback)
 *   Unsubscribe: return the cleanup fn from useEffect.
 */

import { DeviceEventEmitter, NativeEventEmitter, NativeModules, Platform } from "react-native";

/** Event name that MainActivity emits when a notification is tapped. */
export const NOTIFICATION_TAP_EVENT = "notification_tapped";

type Callback = () => void;

const NotificationEvent = {
  /**
   * Subscribe to notification tap events.
   * Returns a cleanup function — call it in useEffect's return.
   */
  onTap(callback: Callback): () => void {
    const subscription = DeviceEventEmitter.addListener(
      NOTIFICATION_TAP_EVENT,
      callback
    );
    return () => subscription.remove();
  },
};

export default NotificationEvent;
