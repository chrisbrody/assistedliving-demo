"use client";

import { useState, useEffect } from "react";

/**
 * Hook that provides the current time, updating every 30 seconds.
 * This ensures consistent timing across all components and automatic updates.
 */
export function useCurrentTime(intervalMs: number = 30000): Date {
  const [currentTime, setCurrentTime] = useState(() => new Date());

  useEffect(() => {
    // Update immediately to sync with current time
    setCurrentTime(new Date());

    // Set up interval to update time
    const interval = setInterval(() => {
      setCurrentTime(new Date());
    }, intervalMs);

    return () => clearInterval(interval);
  }, [intervalMs]);

  return currentTime;
}
