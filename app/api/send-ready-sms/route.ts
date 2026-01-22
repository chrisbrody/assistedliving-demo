import { NextRequest, NextResponse } from "next/server";
import { sendReadyNotification } from "@/lib/twilio";
import { sendPushToAll } from "@/lib/web-push";
import { getEventById, logNotification, updateEventStatus } from "@/lib/queries";

// ===========================================
// POST /api/send-ready-sms
// ===========================================
// Called when nurse taps "Ready" button
// Sends SMS to family and updates event status

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { eventId } = body;

    if (!eventId) {
      return NextResponse.json(
        { error: "eventId is required" },
        { status: 400 }
      );
    }

    // Get the event with resident details
    const event = await getEventById(eventId);

    if (!event) {
      return NextResponse.json(
        { error: "Event not found" },
        { status: 404 }
      );
    }

    // Determine phone number to use
    // Priority: 1) Demo override from env, 2) Event override, 3) Resident's family phone
    const demoPhone = process.env.DEMO_FAMILY_PHONE;
    const phoneToUse = demoPhone || event.family_phone;

    if (!phoneToUse) {
      // No phone number available - still mark as ready but skip SMS
      await updateEventStatus(eventId, "ready");

      return NextResponse.json({
        success: true,
        smsSent: false,
        reason: "No phone number configured",
      });
    }

    // Send the SMS
    const smsResult = await sendReadyNotification({
      to: phoneToUse,
      residentName: event.resident_name,
      roomNumber: event.room_number,
    });

    // Log the notification attempt
    await logNotification({
      event_id: eventId,
      notification_type: "sms",
      recipient: phoneToUse,
      message: `${event.resident_name} (Room ${event.room_number}) is ready for pickup!`,
      status: smsResult.success ? "sent" : "failed",
      error_message: smsResult.error,
    });

    // Update event status to "ready"
    await updateEventStatus(eventId, "ready");

    // Send push notification to admin devices
    const pushResult = await sendPushToAll(
      {
        title: `${event.resident_name} is READY!`,
        body: `Room ${event.room_number} • Waiting in the lobby`,
        tag: eventId,
        data: { eventId, viewType: "admin" },
      },
      "admin" // Only send to admin-subscribed devices
    );

    // Log push notification if any were sent
    if (pushResult.sent > 0) {
      await logNotification({
        event_id: eventId,
        notification_type: "push",
        recipient: `${pushResult.sent} admin devices`,
        message: `${event.resident_name} (Room ${event.room_number}) is ready!`,
        status: "sent",
      });
    }

    return NextResponse.json({
      success: true,
      smsSent: smsResult.success,
      messageId: smsResult.messageId,
      pushSent: pushResult.sent,
      error: smsResult.error,
    });
  } catch (error: any) {
    console.error("[API] send-ready-sms error:", error);

    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: 500 }
    );
  }
}
