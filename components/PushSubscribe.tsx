"use client";

import { useState, useEffect } from "react";

interface PushSubscribeProps {
  viewType: "admin" | "floor";
}

// Convert URL-safe base64 to Uint8Array for applicationServerKey
function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

export function PushSubscribe({ viewType }: PushSubscribeProps) {
  const [isSupported, setIsSupported] = useState(false);
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Check if push notifications are supported
  useEffect(() => {
    const checkSupport = async () => {
      if (!("serviceWorker" in navigator) || !("PushManager" in window)) {
        setIsSupported(false);
        setIsLoading(false);
        return;
      }

      setIsSupported(true);

      // Check if already subscribed
      try {
        const registration = await navigator.serviceWorker.ready;
        const subscription = await registration.pushManager.getSubscription();
        setIsSubscribed(!!subscription);
      } catch (err) {
        console.error("Error checking push subscription:", err);
      }

      setIsLoading(false);
    };

    checkSupport();
  }, []);

  const subscribe = async () => {
    setIsLoading(true);
    setError(null);

    try {
      // Request notification permission
      const permission = await Notification.requestPermission();
      if (permission !== "granted") {
        setError("Notification permission denied");
        setIsLoading(false);
        return;
      }

      // Get service worker registration
      const registration = await navigator.serviceWorker.ready;

      // Get VAPID public key from environment
      const vapidPublicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
      if (!vapidPublicKey) {
        setError("Push notifications not configured");
        setIsLoading(false);
        return;
      }

      // Subscribe to push
      const applicationServerKey = urlBase64ToUint8Array(vapidPublicKey);
      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: applicationServerKey.buffer as ArrayBuffer,
      });

      // Send subscription to server
      const response = await fetch("/api/push/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          subscription: subscription.toJSON(),
          viewType,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to save subscription");
      }

      setIsSubscribed(true);
    } catch (err: any) {
      console.error("Error subscribing to push:", err);
      setError(err.message || "Failed to subscribe");
    }

    setIsLoading(false);
  };

  const unsubscribe = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const registration = await navigator.serviceWorker.ready;
      const subscription = await registration.pushManager.getSubscription();

      if (subscription) {
        // Unsubscribe from push
        await subscription.unsubscribe();

        // Remove from server
        await fetch("/api/push/subscribe", {
          method: "DELETE",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ endpoint: subscription.endpoint }),
        });
      }

      setIsSubscribed(false);
    } catch (err: any) {
      console.error("Error unsubscribing from push:", err);
      setError(err.message || "Failed to unsubscribe");
    }

    setIsLoading(false);
  };

  const testPush = async () => {
    setError(null);
    try {
      const response = await fetch("/api/push/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: "Test Notification",
          body: "Push notifications are working!",
          tag: `test-${Date.now()}`,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Failed to send test notification");
      }

      if (result.sent === 0) {
        setError(`No devices received the notification (${result.failed} failed)`);
      } else {
        // Show success briefly
        setError(`Sent to ${result.sent} device(s)`);
        setTimeout(() => setError(null), 3000);
      }
    } catch (err: any) {
      setError(err.message || "Failed to send test");
    }
  };

  if (!isSupported) {
    return (
      <div className="text-sm text-gray-500 bg-gray-100 rounded-lg p-3">
        Push notifications not supported on this device.
        {typeof window !== "undefined" && /iPhone|iPad/.test(navigator.userAgent) && (
          <span className="block mt-1 text-xs">
            On iOS, add this app to your home screen first.
          </span>
        )}
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="text-sm text-gray-500">Checking notification status...</div>
    );
  }

  return (
    <div className="space-y-2">
      {isSubscribed ? (
        <div className="flex items-center gap-2">
          <span className="text-sm text-green-600 font-medium">
            Push notifications enabled
          </span>
          <button
            onClick={testPush}
            className="px-3 py-1 text-xs bg-blue-100 text-blue-700 rounded hover:bg-blue-200"
          >
            Test
          </button>
          <button
            onClick={unsubscribe}
            disabled={isLoading}
            className="px-3 py-1 text-xs bg-gray-100 text-gray-600 rounded hover:bg-gray-200"
          >
            Disable
          </button>
        </div>
      ) : (
        <button
          onClick={subscribe}
          disabled={isLoading}
          className="px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-500
                     disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium"
        >
          Enable Push Notifications
        </button>
      )}
      {error && <div className="text-sm text-red-500">{error}</div>}
    </div>
  );
}
