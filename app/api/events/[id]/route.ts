import { NextRequest, NextResponse } from "next/server";
import { updateEventStatus, deleteEvent, getEventById } from "@/lib/queries";
import type { EventStatus } from "@/lib/types";

// ===========================================
// PATCH /api/events/[id]
// ===========================================
// Update event status

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { status } = body as { status: EventStatus };

    if (!status) {
      return NextResponse.json(
        { error: "status is required" },
        { status: 400 }
      );
    }

    const validStatuses: EventStatus[] = [
      "scheduled",
      "prep_alert",
      "prepping",
      "ready",
      "departed",
      "cancelled",
    ];

    if (!validStatuses.includes(status)) {
      return NextResponse.json(
        { error: `Invalid status. Must be one of: ${validStatuses.join(", ")}` },
        { status: 400 }
      );
    }

    const event = await updateEventStatus(id, status);
    return NextResponse.json(event);
  } catch (error: any) {
    console.error("[API] PATCH /events/[id] error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to update event" },
      { status: 500 }
    );
  }
}

// ===========================================
// GET /api/events/[id]
// ===========================================
// Get single event with resident info

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const event = await getEventById(id);

    if (!event) {
      return NextResponse.json(
        { error: "Event not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(event);
  } catch (error: any) {
    console.error("[API] GET /events/[id] error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to fetch event" },
      { status: 500 }
    );
  }
}

// ===========================================
// DELETE /api/events/[id]
// ===========================================
// Delete a specific event

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    await deleteEvent(id);
    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("[API] DELETE /events/[id] error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to delete event" },
      { status: 500 }
    );
  }
}
