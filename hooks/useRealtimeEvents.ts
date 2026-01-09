"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { supabase } from "@/lib/supabase";
import type { TransportEventWithResident, EventStatus } from "@/lib/types";

interface UseRealtimeEventsReturn {
  events: TransportEventWithResident[];
  isLoading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
  lastReadyEvent: TransportEventWithResident | null;
  lastNewEvent: TransportEventWithResident | null;
}

export function useRealtimeEvents(): UseRealtimeEventsReturn {
  const [events, setEvents] = useState<TransportEventWithResident[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastReadyEvent, setLastReadyEvent] = useState<TransportEventWithResident | null>(null);
  const [lastNewEvent, setLastNewEvent] = useState<TransportEventWithResident | null>(null);

  // Track what we've already notified about (prevents repeat notifications)
  const notifiedNewEventsRef = useRef<Set<string>>(new Set());
  const notifiedReadyEventsRef = useRef<Set<string>>(new Set());
  const prevEventIdsRef = useRef<Set<string>>(new Set());
  const prevStatusesRef = useRef<Map<string, EventStatus>>(new Map());
  const isInitialLoadRef = useRef(true);

  // Fetch all today's events
  const fetchEvents = useCallback(async () => {
    try {
      const response = await fetch("/api/events");
      if (!response.ok) throw new Error("Failed to fetch events");
      const data = await response.json();

      const newEvents = data as TransportEventWithResident[];

      // Skip notifications on initial load
      if (!isInitialLoadRef.current) {
        newEvents.forEach((event) => {
          // Check for new events - only notify once per event
          if (!prevEventIdsRef.current.has(event.id) && !notifiedNewEventsRef.current.has(event.id)) {
            console.log("[Realtime] New event detected:", event.resident_name);
            notifiedNewEventsRef.current.add(event.id);
            setLastNewEvent(event);
            // Clear after a tick so the useEffect fires once
            setTimeout(() => setLastNewEvent(null), 100);
          }

          // Check for "ready" status transitions - only notify once per event
          const prevStatus = prevStatusesRef.current.get(event.id);
          if (prevStatus && prevStatus !== "ready" && event.status === "ready" && !notifiedReadyEventsRef.current.has(event.id)) {
            console.log("[Realtime] Ready transition:", event.resident_name);
            notifiedReadyEventsRef.current.add(event.id);
            setLastReadyEvent(event);
            // Clear after a tick so the useEffect fires once
            setTimeout(() => setLastReadyEvent(null), 100);
          }
        });
      }

      // Update tracking refs
      prevEventIdsRef.current = new Set(newEvents.map((e) => e.id));
      newEvents.forEach((event) => {
        prevStatusesRef.current.set(event.id, event.status);
      });
      isInitialLoadRef.current = false;

      setEvents(newEvents);
      setError(null);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Initial fetch
  useEffect(() => {
    fetchEvents();
  }, [fetchEvents]);

  // Set up real-time subscription
  useEffect(() => {
    const channel = supabase
      .channel("transport_events_changes")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "transport_events",
        },
        (payload) => {
          console.log("[Realtime] Change received:", payload.eventType);
          fetchEvents();
        }
      )
      .subscribe((status) => {
        console.log("[Realtime] Subscription status:", status);
      });

    return () => {
      supabase.removeChannel(channel);
    };
  }, [fetchEvents]);

  return {
    events,
    isLoading,
    error,
    refetch: fetchEvents,
    lastReadyEvent,
    lastNewEvent,
  };
}
