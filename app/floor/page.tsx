"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { useRealtimeEvents } from "@/hooks/useRealtimeEvents";
import { useCurrentTime } from "@/hooks/useCurrentTime";
import { EventCard } from "@/components/EventCard";
import { useSoundAlert } from "@/components/SoundAlert";
import { Toast } from "@/components/Toast";
import type { TransportEventWithResident } from "@/lib/types";

export default function FloorPage() {
  const { events, isLoading, error, refetch, lastNewEvent } = useRealtimeEvents();
  const currentTime = useCurrentTime(30000); // Update every 30 seconds
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [notificationPermission, setNotificationPermission] = useState<NotificationPermission>("default");
  const [toastEvent, setToastEvent] = useState<TransportEventWithResident | null>(null);
  const { playDing } = useSoundAlert();

  // Check notification permission on mount
  useEffect(() => {
    if ("Notification" in window) {
      setNotificationPermission(Notification.permission);
    }
  }, []);

  // Request notification permission
  const requestNotificationPermission = async () => {
    if ("Notification" in window) {
      const permission = await Notification.requestPermission();
      setNotificationPermission(permission);
    }
  };

  // Send desktop notification for new pickup
  const sendNewPickupNotification = useCallback((event: TransportEventWithResident) => {
    if ("Notification" in window && Notification.permission === "granted") {
      const pickupTime = new Date(event.pickup_time).toLocaleTimeString("en-US", {
        hour: "numeric",
        minute: "2-digit",
        hour12: true,
      });
      new Notification(`New Pickup: ${event.resident_name}`, {
        body: `Room ${event.room_number} • ${pickupTime}`,
        tag: event.id,
        requireInteraction: false,
      });
    }
  }, []);

  // Handle new pickup event - show notification
  useEffect(() => {
    if (lastNewEvent) {
      setToastEvent(lastNewEvent);
      playDing();
      sendNewPickupNotification(lastNewEvent);

      // Auto-hide toast after 5 seconds
      const timer = setTimeout(() => {
        setToastEvent(null);
      }, 5000);

      return () => clearTimeout(timer);
    }
  }, [lastNewEvent, playDing, sendNewPickupNotification]);

  // Test notification handler
  const handleTestNotification = () => {
    const testEvent = {
      id: `test-${Date.now()}`, // Unique ID so desktop notification always shows
      resident_name: "Test Resident",
      room_number: "101",
      pickup_time: new Date().toISOString(),
    } as TransportEventWithResident;
    setToastEvent(testEvent);
    playDing();
    sendNewPickupNotification(testEvent);
    setTimeout(() => setToastEvent(null), 5000);
  };

  // Handle status change (for prepping, departed)
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

  // Handle "Ready" button - sends SMS and updates status
  const handleSendReady = async (eventId: string) => {
    setUpdatingId(eventId);
    try {
      const response = await fetch("/api/send-ready-sms", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ eventId }),
      });

      const result = await response.json();

      if (!response.ok) throw new Error(result.error || "Failed to send ready notification");

      // Sound only - desktop notification goes to admin view per spec
      playDing();

      // Refetch to update UI
      await refetch();
    } catch (e: any) {
      console.error("Failed to send ready notification:", e);
      alert(e.message || "Failed to send ready notification. Please try again.");
    } finally {
      setUpdatingId(null);
    }
  };

  // Filter to only show active events (not departed/cancelled)
  const activeEvents = events.filter(
    (e) => e.status !== "departed" && e.status !== "cancelled"
  );

  // Sort: prepping first, then by pickup time
  const sortedEvents = [...activeEvents].sort((a, b) => {
    // Ready events at top
    if (a.status === "ready" && b.status !== "ready") return -1;
    if (b.status === "ready" && a.status !== "ready") return 1;
    // Then prepping
    if (a.status === "prepping" && b.status !== "prepping" && b.status !== "ready") return -1;
    if (b.status === "prepping" && a.status !== "prepping" && a.status !== "ready") return 1;
    // Then by pickup time
    return new Date(a.pickup_time).getTime() - new Date(b.pickup_time).getTime();
  });

  // Current time for header (uses live-updating currentTime)
  const timeString = currentTime.toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Header */}
      <header className="bg-slate-700 text-white shadow-lg">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Nursing Floor</h1>
            <p className="text-slate-300 text-sm">Tablet View • {timeString}</p>
          </div>
          <div className="flex items-center gap-4">
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
                <span className="text-white text-sm">Alerts On</span>
                <button
                  onClick={handleTestNotification}
                  className="px-4 py-2 bg-slate-600 hover:bg-slate-500 rounded-lg text-sm"
                >
                  Test
                </button>
              </div>
            )}
            <button
              onClick={() => refetch()}
              className="px-4 py-2 bg-slate-600 hover:bg-slate-500 rounded-lg text-sm"
            >
              Refresh
            </button>
            <Link href="/" className="text-slate-300 hover:text-white text-sm">
              Home
            </Link>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-6">
        {/* Stats Bar */}
        <div className="grid grid-cols-3 gap-4 mb-6">
          <div className="bg-white border border-gray-200 rounded-xl p-4 text-center shadow-sm">
            <div className="text-3xl font-bold text-gray-900">
              {activeEvents.filter((e) => e.status === "scheduled" || e.status === "prep_alert").length}
            </div>
            <div className="text-gray-500 text-sm">Pending</div>
          </div>
          <div className="bg-yellow-500 rounded-xl p-4 text-center shadow-sm">
            <div className="text-3xl font-bold text-black">
              {activeEvents.filter((e) => e.status === "prepping").length}
            </div>
            <div className="text-yellow-900 text-sm">Prepping</div>
          </div>
          <div className="bg-emerald-700 rounded-xl p-4 text-center shadow-sm">
            <div className="text-3xl font-bold text-white">
              {activeEvents.filter((e) => e.status === "ready").length}
            </div>
            <div className="text-emerald-100 text-sm">Ready</div>
          </div>
        </div>

        {/* Event List */}
        {isLoading ? (
          <div className="text-center py-12 text-gray-500">Loading...</div>
        ) : error ? (
          <div className="text-center py-12 text-red-500">{error}</div>
        ) : sortedEvents.length === 0 ? (
          <div className="text-center py-16 bg-white border border-gray-200 rounded-xl shadow-sm">
            <p className="text-2xl text-gray-500">No pickups scheduled</p>
            <p className="text-gray-400 mt-2">Check back later</p>
          </div>
        ) : (
          <div className="space-y-4">
            {sortedEvents.map((event) => (
              <EventCard
                key={event.id}
                event={event}
                variant="floor"
                onStatusChange={handleStatusChange}
                onSendReady={handleSendReady}
                isUpdating={updatingId === event.id}
                currentTime={currentTime}
              />
            ))}
          </div>
        )}
      </main>

      {/* New Pickup Toast */}
      {toastEvent && (
        <Toast
          title="New Pickup Added"
          message={`${toastEvent.resident_name} • Room ${toastEvent.room_number}`}
          variant="info"
          onDismiss={() => setToastEvent(null)}
        />
      )}
    </div>
  );
}
