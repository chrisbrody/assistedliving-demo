// ===========================================
// DATABASE TYPES
// ===========================================

export type EventStatus =
  | "scheduled"
  | "prep_alert"
  | "prepping"
  | "ready"
  | "departed"
  | "cancelled";

export type EventType =
  | "family_pickup"
  | "doctor_appointment"
  | "facility_van"
  | "other";

export type NotificationType = "sms" | "email" | "push";
export type NotificationStatus = "pending" | "sent" | "delivered" | "failed";

// ===========================================
// TABLE TYPES
// ===========================================

export interface Resident {
  id: string;
  full_name: string;
  room_number: string;
  family_phone: string | null;
  dietary_notes: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface TransportEvent {
  id: string;
  resident_id: string;
  pickup_time: string;
  event_type: EventType;
  purpose: string | null;
  status: EventStatus;
  notes: string | null;
  family_phone_override: string | null;
  created_at: string;
  updated_at: string;
}

export interface NotificationLog {
  id: string;
  event_id: string;
  notification_type: NotificationType;
  recipient: string;
  message: string | null;
  status: NotificationStatus;
  error_message: string | null;
  created_at: string;
}

// ===========================================
// VIEW / JOINED TYPES
// ===========================================

export interface TransportEventWithResident extends TransportEvent {
  resident_name: string;
  room_number: string;
  family_phone: string | null;
}

// ===========================================
// FORM / INPUT TYPES
// ===========================================

export interface CreateTransportEventInput {
  resident_id: string;
  pickup_time: string;
  event_type?: EventType;
  purpose?: string;
  notes?: string;
  family_phone_override?: string;
}

export interface UpdateEventStatusInput {
  id: string;
  status: EventStatus;
}

// ===========================================
// UI HELPER TYPES
// ===========================================

export const STATUS_CONFIG: Record<
  EventStatus,
  { label: string; color: string; bgClass: string }
> = {
  scheduled: {
    label: "Scheduled",
    color: "gray",
    bgClass: "bg-white border-gray-200",
  },
  prep_alert: {
    label: "Prep Alert",
    color: "amber",
    bgClass: "bg-amber-50 border-amber-300",
  },
  prepping: {
    label: "Prepping",
    color: "yellow",
    bgClass: "bg-yellow-100 border-yellow-400",
  },
  ready: {
    label: "Ready",
    color: "green",
    bgClass: "bg-green-100 border-green-500",
  },
  departed: {
    label: "Departed",
    color: "gray",
    bgClass: "bg-gray-100 border-gray-300 opacity-60",
  },
  cancelled: {
    label: "Cancelled",
    color: "red",
    bgClass: "bg-red-50 border-red-200 opacity-60",
  },
};

export const EVENT_TYPE_LABELS: Record<EventType, string> = {
  family_pickup: "Family Pickup",
  doctor_appointment: "Doctor Appt",
  facility_van: "Facility Van",
  other: "Other",
};
