"use client";

import { TransportEventWithResident, STATUS_CONFIG, EVENT_TYPE_LABELS } from "@/lib/types";

interface EventCardProps {
  event: TransportEventWithResident;
  variant: "admin" | "floor";
  onStatusChange?: (eventId: string, newStatus: string) => void;
  onSendReady?: (eventId: string) => void;
  isUpdating?: boolean;
  currentTime?: Date; // Pass this for consistent timing across components
}

export function EventCard({
  event,
  variant,
  onStatusChange,
  onSendReady,
  isUpdating = false,
  currentTime,
}: EventCardProps) {
  const statusConfig = STATUS_CONFIG[event.status];
  const pickupTime = new Date(event.pickup_time);
  const now = currentTime || new Date();

  // Calculate minutes difference using floor for "until" and ceil for "overdue"
  // This ensures: 6:59 = "1 min until", 7:00 = "due now", 7:01 = "1 min overdue"
  const diffMs = pickupTime.getTime() - now.getTime();
  const diffMinutes = diffMs / 60000;

  // For display: positive means future, negative means past
  // Use Math.ceil for positive (round up remaining time) and Math.floor for negative (round down overdue)
  const minutesUntil = diffMinutes > 0
    ? Math.ceil(diffMinutes)  // "due in 1 min" until the minute passes
    : Math.floor(diffMinutes); // "1 min overdue" once a full minute has passed

  // Format time as "2:30 PM"
  const timeString = pickupTime.toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });

  // Determine urgency styling
  const isUrgent = minutesUntil <= 30 && minutesUntil > 0 && event.status === "scheduled";
  const isPast = minutesUntil < 0 && event.status !== "departed" && event.status !== "ready";

  return (
    <div
      className={`
        relative border-2 rounded-xl p-4 transition-all duration-300
        ${statusConfig.bgClass}
        ${isUrgent ? "ring-2 ring-amber-400" : ""}
        ${isPast ? "ring-2 ring-red-400" : ""}
        ${isUpdating ? "opacity-50 pointer-events-none" : ""}
      `}
    >
      {/* Status Badge */}
      <div className="absolute top-3 right-3">
        <span
          className={`
            px-3 py-1 rounded-full text-sm font-medium
            ${event.status === "ready" ? "bg-emerald-700 text-white" : ""}
            ${event.status === "prepping" ? "bg-yellow-500 text-black" : ""}
            ${event.status === "scheduled" ? "bg-gray-200 text-gray-700" : ""}
            ${event.status === "prep_alert" ? "bg-amber-500 text-white" : ""}
            ${event.status === "departed" ? "bg-gray-400 text-white" : ""}
          `}
        >
          {statusConfig.label}
        </span>
      </div>

      {/* Main Content */}
      <div className="pr-24">
        <h3 className="text-xl font-bold text-gray-900">{event.resident_name}</h3>
        <p className="text-lg text-gray-600">Room {event.room_number}</p>

        <div className="mt-2 flex items-center gap-4 text-sm text-gray-500">
          <span className="font-semibold text-lg text-gray-800">{timeString}</span>
          <span>{EVENT_TYPE_LABELS[event.event_type]}</span>
          {event.purpose && <span>• {event.purpose}</span>}
        </div>

        {/* Time indicator */}
        {event.status !== "departed" && event.status !== "ready" && (
          <div className="mt-2">
            {minutesUntil > 0 ? (
              <span className={`text-sm font-medium ${minutesUntil <= 30 ? "text-amber-600" : "text-gray-500"}`}>
                {minutesUntil} min until pickup
              </span>
            ) : minutesUntil === 0 ? (
              <span className="text-sm font-medium text-amber-600">
                due now
              </span>
            ) : (
              <span className="text-sm font-medium text-red-600">
                {Math.abs(minutesUntil)} min overdue
              </span>
            )}
          </div>
        )}

        {event.notes && (
          <p className="mt-2 text-sm text-gray-600 bg-gray-50 rounded p-2">
            📝 {event.notes}
          </p>
        )}
      </div>

      {/* Action Buttons */}
      {variant === "floor" && event.status !== "departed" && (
        <div className="mt-4 flex gap-3">
          {event.status === "scheduled" || event.status === "prep_alert" ? (
            <button
              onClick={() => onStatusChange?.(event.id, "prepping")}
              className="touch-button flex-1 bg-yellow-400 hover:bg-yellow-500 text-black"
            >
              Start Prep
            </button>
          ) : null}

          {event.status === "prepping" ? (
            <button
              onClick={() => onSendReady?.(event.id)}
              className="touch-button flex-1 bg-emerald-700 hover:bg-emerald-600 text-white"
            >
              ✓ Ready for Pickup
            </button>
          ) : null}

          {event.status === "ready" ? (
            <button
              onClick={() => onStatusChange?.(event.id, "departed")}
              className="touch-button flex-1 bg-gray-500 hover:bg-gray-600 text-white"
            >
              Mark Departed
            </button>
          ) : null}
        </div>
      )}

      {/* Admin Actions */}
      {variant === "admin" && event.status === "ready" && (
        <div className="mt-4">
          <button
            onClick={() => onStatusChange?.(event.id, "departed")}
            className="px-4 py-2 bg-gray-500 hover:bg-gray-600 text-white rounded-lg text-sm"
          >
            Mark Departed
          </button>
        </div>
      )}
    </div>
  );
}
