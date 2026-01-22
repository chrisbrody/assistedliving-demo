"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { useRealtimeEvents } from "@/hooks/useRealtimeEvents";
import { useCurrentTime } from "@/hooks/useCurrentTime";
import { EventCard } from "@/components/EventCard";
import { AddEventForm } from "@/components/AddEventForm";
import { useSoundAlert } from "@/components/SoundAlert";
import { Toast } from "@/components/Toast";
import { PushSubscribe } from "@/components/PushSubscribe";
import type { Resident, EventType, TransportEventWithResident } from "@/lib/types";

export default function AdminPage() {
  const { events, isLoading, error, refetch, lastReadyEvent } = useRealtimeEvents();
  const currentTime = useCurrentTime(30000); // Update time display every 30 seconds
  const [residents, setResidents] = useState<Resident[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const [toastEvent, setToastEvent] = useState<TransportEventWithResident | null>(null);
  const [notificationPermission, setNotificationPermission] = useState<NotificationPermission>(() => {
    if (typeof window !== "undefined" && "Notification" in window) {
      return Notification.permission;
    }
    return "default";
  });
  const { playDing } = useSoundAlert();

  // Request notification permission
  const requestNotificationPermission = async () => {
    if ("Notification" in window) {
      const permission = await Notification.requestPermission();
      setNotificationPermission(permission);
    }
  };

  // Send desktop notification (with PWA service worker support)
  const sendDesktopNotification = useCallback((event: TransportEventWithResident) => {
    if ("Notification" in window && Notification.permission === "granted") {
      const title = `${event.resident_name} is READY!`;
      const options = {
        body: `Room ${event.room_number} • Waiting in the lobby`,
        tag: event.id,
        requireInteraction: true,
      };

      // Use service worker notification for better PWA support
      if ("serviceWorker" in navigator && navigator.serviceWorker.controller) {
        navigator.serviceWorker.ready.then((registration) => {
          registration.showNotification(title, options);
        });
      } else {
        // Fallback to regular notification
        new Notification(title, options);
      }
    }
  }, []);

  // Handle ready event - show toast, play sound, send desktop notification
  useEffect(() => {
    if (lastReadyEvent) {
      setToastEvent(lastReadyEvent);
      playDing();
      sendDesktopNotification(lastReadyEvent);

      // Auto-hide toast after 5 seconds
      const timer = setTimeout(() => {
        setToastEvent(null);
      }, 5000);

      return () => clearTimeout(timer);
    }
  }, [lastReadyEvent, playDing, sendDesktopNotification]);

  // Fetch residents for the form
  useEffect(() => {
    fetch("/api/residents")
      .then((res) => res.json())
      .then(setResidents)
      .catch(console.error);
  }, []);

  // Handle new event submission
  const handleAddEvent = async (data: {
    resident_id: string;
    pickup_time: string;
    event_type: EventType;
    purpose: string;
    notes: string;
  }) => {
    setIsSubmitting(true);
    try {
      const response = await fetch("/api/events", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      if (!response.ok) throw new Error("Failed to create event");

      // Real-time will handle the update, but refetch to be safe
      await refetch();
    } catch (e) {
      console.error("Failed to add event:", e);
      alert("Failed to add event. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle status change
  const handleStatusChange = async (eventId: string, newStatus: string) => {
    setUpdatingId(eventId);
    try {
      const response = await fetch(`/api/events/${eventId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });

      if (!response.ok) throw new Error("Failed to update status");
    } catch (e) {
      console.error("Failed to update status:", e);
      alert("Failed to update status. Please try again.");
    } finally {
      setUpdatingId(null);
    }
  };

  // Handle demo reset
  const handleReset = async () => {
    try {
      await fetch("/api/events", { method: "DELETE" });
      setShowResetConfirm(false);
      setToastEvent(null); // Clear toast on reset
      await refetch();
    } catch (e) {
      console.error("Failed to reset:", e);
    }
  };

  // Group events by status for better display
  const activeEvents = events.filter(
    (e) => e.status !== "departed" && e.status !== "cancelled"
  );
  const completedEvents = events.filter((e) => e.status === "departed");

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Header */}
      <header className="bg-blue-600 text-white shadow-lg">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Front Desk Dashboard</h1>
            <p className="text-blue-100 text-sm">Clerk View</p>
          </div>
          <div className="flex items-center gap-4">
            {/* Notification Permission Button */}
            {notificationPermission === "default" && (
              <button
                onClick={requestNotificationPermission}
                className="px-3 py-1.5 bg-yellow-500 hover:bg-yellow-400 text-black rounded-lg text-sm font-medium"
              >
                Enable Alerts
              </button>
            )}
            {notificationPermission === "granted" && (
              <div className="flex items-center gap-2">
                <span className="text-blue-200 text-sm">Alerts On</span>
                <button
                  onClick={() => {
                    const testEvent = {
                      id: `test-${Date.now()}`, // Unique ID so desktop notification always shows
                      resident_name: "Test Resident",
                      room_number: "101",
                    } as TransportEventWithResident;
                    setToastEvent(testEvent);
                    playDing();
                    sendDesktopNotification(testEvent);
                  }}
                  className="px-4 py-2 bg-blue-500 hover:bg-blue-400 rounded-lg text-sm"
                >
                  Test
                </button>
              </div>
            )}
            <Link
              href="/floor"
              className="px-4 py-2 bg-blue-500 hover:bg-blue-400 rounded-lg text-sm w-[160px] text-center"
            >
              Open Floor View
            </Link>
            <Link href="/" className="text-blue-200 hover:text-white text-sm">
              Home
            </Link>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-6">
        <div className="grid lg:grid-cols-3 gap-6">
          {/* Left Column: Add Event Form */}
          <div className="lg:col-span-1">
            <AddEventForm
              residents={residents}
              onSubmit={handleAddEvent}
              isSubmitting={isSubmitting}
            />

            {/* Push Notification Subscription */}
            <div className="mt-4 p-4 bg-white rounded-xl border border-gray-200 shadow-sm">
              <h3 className="font-medium text-gray-900 mb-2">Mobile Notifications</h3>
              <p className="text-sm text-gray-500 mb-3">Get alerts on this device when a resident is ready</p>
              <PushSubscribe viewType="admin" />
            </div>

            {/* Demo Reset Button */}
            <div className="mt-4">
              {!showResetConfirm ? (
                <button
                  onClick={() => setShowResetConfirm(true)}
                  className="w-full py-2 text-sm text-gray-500 hover:text-red-600
                           border border-gray-300 hover:border-red-300 rounded-lg"
                >
                  Reset Demo Data
                </button>
              ) : (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                  <p className="text-sm text-red-700 mb-3">
                    Delete all pickup events? (Residents will remain)
                  </p>
                  <div className="flex gap-2">
                    <button
                      onClick={handleReset}
                      className="flex-1 py-2 bg-red-600 text-white rounded-lg text-sm"
                    >
                      Yes, Reset
                    </button>
                    <button
                      onClick={() => setShowResetConfirm(false)}
                      className="flex-1 py-2 bg-gray-200 rounded-lg text-sm"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Right Column: Event List */}
          <div className="lg:col-span-2 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-bold text-gray-900">
                Today's Pickups
              </h2>
              <span className="text-sm text-gray-500">
                {activeEvents.length} active
              </span>
            </div>

            {isLoading ? (
              <div className="text-center py-12 text-gray-500">Loading...</div>
            ) : error ? (
              <div className="text-center py-12 text-red-500">{error}</div>
            ) : activeEvents.length === 0 ? (
              <div className="text-center py-12 bg-white rounded-xl border">
                <p className="text-gray-500">No pickups scheduled for today</p>
                <p className="text-sm text-gray-400 mt-1">
                  Add one using the form
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {activeEvents.map((event) => (
                  <EventCard
                    key={event.id}
                    event={event}
                    variant="admin"
                    onStatusChange={handleStatusChange}
                    isUpdating={updatingId === event.id}
                    currentTime={currentTime}
                  />
                ))}
              </div>
            )}

            {/* Completed Section */}
            {completedEvents.length > 0 && (
              <div className="mt-8">
                <h3 className="text-lg font-semibold text-gray-600 mb-3">
                  Completed ({completedEvents.length})
                </h3>
                <div className="space-y-3 opacity-60">
                  {completedEvents.map((event) => (
                    <EventCard
                      key={event.id}
                      event={event}
                      variant="admin"
                      currentTime={currentTime}
                    />
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </main>

      {/* Ready Alert Toast */}
      {toastEvent && (
        <Toast
          title={`${toastEvent.resident_name} is READY!`}
          message={`Room ${toastEvent.room_number} • In the lobby`}
          variant="success"
          onDismiss={() => setToastEvent(null)}
        />
      )}
    </div>
  );
}
