"use client";

import { useEffect, useRef } from "react";

// Simple sound alert component that plays a ding when triggered
// Uses Web Audio API for reliable cross-browser support

interface SoundAlertProps {
  trigger: number; // Increment this to play sound
}

export function SoundAlert({ trigger }: SoundAlertProps) {
  const audioContextRef = useRef<AudioContext | null>(null);
  const lastTriggerRef = useRef(0);

  useEffect(() => {
    // Only play if trigger changed and is > 0
    if (trigger > 0 && trigger !== lastTriggerRef.current) {
      lastTriggerRef.current = trigger;
      playDing();
    }
  }, [trigger]);

  const playDing = () => {
    try {
      // Create audio context on first use (must be after user interaction)
      if (!audioContextRef.current) {
        audioContextRef.current = new (window.AudioContext ||
          (window as any).webkitAudioContext)();
      }

      const ctx = audioContextRef.current;

      // Create a pleasant "ding" sound
      const oscillator = ctx.createOscillator();
      const gainNode = ctx.createGain();

      oscillator.connect(gainNode);
      gainNode.connect(ctx.destination);

      // Pleasant bell-like frequency
      oscillator.frequency.setValueAtTime(830, ctx.currentTime); // Ab5
      oscillator.type = "sine";

      // Quick fade in/out for a "ding" effect
      gainNode.gain.setValueAtTime(0, ctx.currentTime);
      gainNode.gain.linearRampToValueAtTime(0.3, ctx.currentTime + 0.01);
      gainNode.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.5);

      oscillator.start(ctx.currentTime);
      oscillator.stop(ctx.currentTime + 0.5);
    } catch (e) {
      console.log("Could not play sound:", e);
    }
  };

  return null; // This component doesn't render anything
}

// Hook version for easier use
export function useSoundAlert() {
  const audioContextRef = useRef<AudioContext | null>(null);

  const playDing = () => {
    try {
      if (!audioContextRef.current) {
        audioContextRef.current = new (window.AudioContext ||
          (window as any).webkitAudioContext)();
      }

      const ctx = audioContextRef.current;
      const oscillator = ctx.createOscillator();
      const gainNode = ctx.createGain();

      oscillator.connect(gainNode);
      gainNode.connect(ctx.destination);

      oscillator.frequency.setValueAtTime(830, ctx.currentTime);
      oscillator.type = "sine";

      gainNode.gain.setValueAtTime(0, ctx.currentTime);
      gainNode.gain.linearRampToValueAtTime(0.3, ctx.currentTime + 0.01);
      gainNode.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.5);

      oscillator.start(ctx.currentTime);
      oscillator.stop(ctx.currentTime + 0.5);
    } catch (e) {
      console.log("Could not play sound:", e);
    }
  };

  return { playDing };
}
