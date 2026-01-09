import { NextRequest, NextResponse } from "next/server";
import {
  getTodaysEvents,
  createTransportEvent,
  resetDemoData,
} from "@/lib/queries";

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
