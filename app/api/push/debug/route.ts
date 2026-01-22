import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

// ===========================================
// GET /api/push/debug
// ===========================================
// Debug endpoint to check push notification setup

export async function GET() {
  try {
    // Check environment variables
    const vapidPublicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
    const vapidPrivateKey = process.env.VAPID_PRIVATE_KEY;
    const vapidSubject = process.env.VAPID_SUBJECT;

    // Get all subscriptions
    const { data: subscriptions, error } = await supabase
      .from("push_subscriptions")
      .select("id, view_type, user_agent, created_at, endpoint")
      .order("created_at", { ascending: false });

    if (error) {
      return NextResponse.json({
        error: error.message,
        hint: "Make sure you ran the migration to create push_subscriptions table",
      }, { status: 500 });
    }

    return NextResponse.json({
      config: {
        vapidPublicKeySet: !!vapidPublicKey,
        vapidPrivateKeySet: !!vapidPrivateKey,
        vapidSubjectSet: !!vapidSubject,
        vapidPublicKeyPreview: vapidPublicKey ? vapidPublicKey.substring(0, 20) + "..." : null,
      },
      subscriptions: subscriptions?.map(s => ({
        id: s.id,
        view_type: s.view_type,
        user_agent: s.user_agent?.substring(0, 50),
        created_at: s.created_at,
        endpoint_preview: s.endpoint?.substring(0, 60) + "...",
      })),
      subscriptionCount: subscriptions?.length || 0,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
