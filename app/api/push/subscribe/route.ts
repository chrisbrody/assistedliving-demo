import { NextRequest, NextResponse } from "next/server";
import { savePushSubscription, deletePushSubscription } from "@/lib/web-push";

// ===========================================
// POST /api/push/subscribe
// ===========================================
// Save a new push subscription

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { subscription, viewType } = body;

    if (!subscription || !subscription.endpoint || !subscription.keys) {
      return NextResponse.json(
        { error: "Invalid subscription object" },
        { status: 400 }
      );
    }

    const userAgent = request.headers.get("user-agent") || undefined;

    await savePushSubscription(subscription, viewType || "floor", userAgent);

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("[API] push/subscribe error:", error);

    return NextResponse.json(
      { error: error.message || "Failed to save subscription" },
      { status: 500 }
    );
  }
}

// ===========================================
// DELETE /api/push/subscribe
// ===========================================
// Remove a push subscription

export async function DELETE(request: NextRequest) {
  try {
    const body = await request.json();
    const { endpoint } = body;

    if (!endpoint) {
      return NextResponse.json(
        { error: "endpoint is required" },
        { status: 400 }
      );
    }

    await deletePushSubscription(endpoint);

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("[API] push/unsubscribe error:", error);

    return NextResponse.json(
      { error: error.message || "Failed to remove subscription" },
      { status: 500 }
    );
  }
}
