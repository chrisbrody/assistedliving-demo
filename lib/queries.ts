import { supabase } from "./supabase";
import type {
  Resident,
  TransportEvent,
  TransportEventWithResident,
  CreateTransportEventInput,
  EventStatus,
} from "./types";

// ===========================================
// RESIDENT QUERIES
// ===========================================

export async function getActiveResidents(): Promise<Resident[]> {
  const { data, error } = await supabase
    .from("residents")
    .select("*")
    .eq("is_active", true)
    .order("room_number", { ascending: true });

  if (error) throw error;
  return data || [];
}

export async function getResidentById(id: string): Promise<Resident | null> {
  const { data, error } = await supabase
    .from("residents")
    .select("*")
    .eq("id", id)
    .single();

  if (error) throw error;
  return data;
}

// ===========================================
// TRANSPORT EVENT QUERIES
// ===========================================

export async function getTodaysEvents(): Promise<TransportEventWithResident[]> {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  const { data, error } = await supabase
    .from("transport_events")
    .select(
      `
      *,
      residents!inner (
        full_name,
        room_number,
        family_phone
      )
    `
    )
    .gte("pickup_time", today.toISOString())
    .lt("pickup_time", tomorrow.toISOString())
    .neq("status", "cancelled")
    .order("pickup_time", { ascending: true });

  if (error) throw error;

  // Flatten the nested resident data
  return (data || []).map((event: any) => ({
    ...event,
    resident_name: event.residents.full_name,
    room_number: event.residents.room_number,
    family_phone: event.family_phone_override || event.residents.family_phone,
    residents: undefined, // Remove nested object
  }));
}

export async function getEventById(
  id: string
): Promise<TransportEventWithResident | null> {
  const { data, error } = await supabase
    .from("transport_events")
    .select(
      `
      *,
      residents!inner (
        full_name,
        room_number,
        family_phone
      )
    `
    )
    .eq("id", id)
    .single();

  if (error) throw error;
  if (!data) return null;

  return {
    ...data,
    resident_name: (data as any).residents.full_name,
    room_number: (data as any).residents.room_number,
    family_phone:
      data.family_phone_override || (data as any).residents.family_phone,
  };
}

export async function createTransportEvent(
  input: CreateTransportEventInput
): Promise<TransportEvent> {
  const { data, error } = await supabase
    .from("transport_events")
    .insert({
      resident_id: input.resident_id,
      pickup_time: input.pickup_time,
      event_type: input.event_type || "family_pickup",
      purpose: input.purpose || null,
      notes: input.notes || null,
      family_phone_override: input.family_phone_override || null,
      status: "scheduled",
    })
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function updateEventStatus(
  id: string,
  status: EventStatus
): Promise<TransportEvent> {
  const { data, error } = await supabase
    .from("transport_events")
    .update({ status })
    .eq("id", id)
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function deleteEvent(id: string): Promise<void> {
  const { error } = await supabase
    .from("transport_events")
    .delete()
    .eq("id", id);

  if (error) throw error;
}

// ===========================================
// NOTIFICATION LOG QUERIES
// ===========================================

export async function logNotification(params: {
  event_id: string;
  notification_type: "sms" | "email" | "push";
  recipient: string;
  message: string;
  status: "pending" | "sent" | "delivered" | "failed";
  error_message?: string;
}): Promise<void> {
  const { error } = await supabase.from("notifications_log").insert(params);

  if (error) throw error;
}

// ===========================================
// DEMO UTILITIES
// ===========================================

export async function resetDemoData(): Promise<void> {
  // Delete all transport events (for demo reset)
  const { error } = await supabase
    .from("transport_events")
    .delete()
    .neq("id", "00000000-0000-0000-0000-000000000000"); // Delete all

  if (error) throw error;
}

export async function createDemoEvent(
  residentId: string,
  minutesFromNow: number
): Promise<TransportEvent> {
  const pickupTime = new Date();
  pickupTime.setMinutes(pickupTime.getMinutes() + minutesFromNow);

  return createTransportEvent({
    resident_id: residentId,
    pickup_time: pickupTime.toISOString(),
    event_type: "family_pickup",
    purpose: "Family visit",
  });
}
