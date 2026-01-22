import { NextRequest, NextResponse } from "next/server";
import {
  getTodaysEvents,
  createTransportEvent,
  resetDemoData,
  getResidentById,
} from "@/lib/queries";
import { sendPushToAll } from "@/lib/web-push";

// ===========================================
// GET /api/events
// ===========================================
// Returns today's transport events

export async function GET() {
  try {
    const events = await getTodaysEvents();
    return NextResponse.json(events);
  } catch (error: any) {
    console.error("[API] GET /events error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to fetch events" },
      { status: 500 }
    );
  }
}

// ===========================================
// POST /api/events
// ===========================================
// Create a new transport event

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { resident_id, pickup_time, event_type, purpose, notes } = body;

    if (!resident_id || !pickup_time) {
      return NextResponse.json(
        { error: "resident_id and pickup_time are required" },
        { status: 400 }
      );
    }

    const event = await createTransportEvent({
      resident_id,
      pickup_time,
      event_type,
      purpose,
      notes,
    });

    // Get resident details for push notification
    const resident = await getResidentById(resident_id);
    if (resident) {
      const pickupTimeStr = new Date(pickup_time).toLocaleTimeString("en-US", {
        hour: "numeric",
        minute: "2-digit",
        hour12: true,
        timeZone: "America/New_York", // Eastern Time
      });

      // Send push notification to ALL subscribed devices
      try {
        const pushResult = await sendPushToAll({
          title: `New Pickup: ${resident.full_name}`,
          body: `Room ${resident.room_number} • ${pickupTimeStr}`,
          tag: event.id,
          data: { eventId: event.id },
        });
        console.log("[API] Push notification result:", pushResult);
      } catch (pushError) {
        console.error("[API] Push notification error:", pushError);
      }
    }

    return NextResponse.json(event, { status: 201 });
  } catch (error: any) {
    console.error("[API] POST /events error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to create event" },
      { status: 500 }
    );
  }
}

// ===========================================
// DELETE /api/events
// ===========================================
// Reset all demo data (hidden feature for demo)

export async function DELETE() {
  try {
    await resetDemoData();
    return NextResponse.json({ success: true, message: "Demo data reset" });
  } catch (error: any) {
    console.error("[API] DELETE /events error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to reset data" },
      { status: 500 }
    );
  }
}
