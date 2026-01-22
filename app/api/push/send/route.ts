import { NextRequest, NextResponse } from "next/server";
import { sendPushToAll } from "@/lib/web-push";
import { logNotification } from "@/lib/queries";

// ===========================================
// POST /api/push/send
// ===========================================
// Send push notification to all subscribed devices

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { title, body: messageBody, tag, viewType, eventId } = body;

    if (!title || !messageBody) {
      return NextResponse.json(
        { error: "title and body are required" },
        { status: 400 }
      );
    }

    const payload = {
      title,
      body: messageBody,
      tag,
      data: { eventId, viewType },
    };

    const result = await sendPushToAll(payload); // Send to ALL devices

    // Log the notification if there's an associated event
    if (eventId && result.sent > 0) {
      await logNotification({
        event_id: eventId,
        notification_type: "push",
        recipient: `${result.sent} devices`,
        message: `${title}: ${messageBody}`,
        status: "sent",
      });
    }

    return NextResponse.json({
      success: true,
      sent: result.sent,
      failed: result.failed,
    });
  } catch (error: any) {
    console.error("[API] push/send error:", error);

    return NextResponse.json(
      { error: error.message || "Failed to send push notifications" },
      { status: 500 }
    );
  }
}
