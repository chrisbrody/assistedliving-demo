import webpush from "web-push";
import { supabase } from "./supabase";

// ===========================================
// WEB PUSH CONFIGURATION
// ===========================================

const vapidPublicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!;
const vapidPrivateKey = process.env.VAPID_PRIVATE_KEY!;
const vapidSubject = process.env.VAPID_SUBJECT || "mailto:admin@facility.local";

// Configure web-push with VAPID keys
if (vapidPublicKey && vapidPrivateKey) {
  webpush.setVapidDetails(vapidSubject, vapidPublicKey, vapidPrivateKey);
}

// ===========================================
// TYPES
// ===========================================

export interface PushSubscription {
  endpoint: string;
  keys: {
    p256dh: string;
    auth: string;
  };
}

export interface PushPayload {
  title: string;
  body: string;
  tag?: string;
  data?: Record<string, any>;
}

// ===========================================
// SUBSCRIPTION MANAGEMENT
// ===========================================

export async function savePushSubscription(
  subscription: PushSubscription,
  viewType: "admin" | "floor" = "floor",
  userAgent?: string
): Promise<void> {
  const { error } = await supabase.from("push_subscriptions").upsert(
    {
      endpoint: subscription.endpoint,
      p256dh: subscription.keys.p256dh,
      auth: subscription.keys.auth,
      view_type: viewType,
      user_agent: userAgent,
    },
    {
      onConflict: "endpoint",
    }
  );

  if (error) throw error;
}

export async function deletePushSubscription(endpoint: string): Promise<void> {
  const { error } = await supabase
    .from("push_subscriptions")
    .delete()
    .eq("endpoint", endpoint);

  if (error) throw error;
}

export async function getSubscriptionsByViewType(
  viewType?: "admin" | "floor"
): Promise<Array<{ endpoint: string; p256dh: string; auth: string }>> {
  let query = supabase.from("push_subscriptions").select("endpoint, p256dh, auth");

  if (viewType) {
    query = query.eq("view_type", viewType);
  }

  const { data, error } = await query;

  if (error) throw error;
  return data || [];
}

// ===========================================
// SEND PUSH NOTIFICATIONS
// ===========================================

export async function sendPushNotification(
  subscription: { endpoint: string; p256dh: string; auth: string },
  payload: PushPayload
): Promise<{ success: boolean; error?: string }> {
  const pushSubscription = {
    endpoint: subscription.endpoint,
    keys: {
      p256dh: subscription.p256dh,
      auth: subscription.auth,
    },
  };

  try {
    await webpush.sendNotification(
      pushSubscription,
      JSON.stringify(payload),
      {
        TTL: 60 * 60, // 1 hour
        urgency: "high",
      }
    );
    return { success: true };
  } catch (error: any) {
    // If subscription is invalid/expired, remove it
    if (error.statusCode === 410 || error.statusCode === 404) {
      await deletePushSubscription(subscription.endpoint);
    }
    return { success: false, error: error.message };
  }
}

export async function sendPushToAll(
  payload: PushPayload,
  viewType?: "admin" | "floor"
): Promise<{ sent: number; failed: number }> {
  const subscriptions = await getSubscriptionsByViewType(viewType);

  let sent = 0;
  let failed = 0;

  await Promise.all(
    subscriptions.map(async (sub) => {
      const result = await sendPushNotification(sub, payload);
      if (result.success) {
        sent++;
      } else {
        failed++;
        console.error(`[Push] Failed to send to ${sub.endpoint}:`, result.error);
      }
    })
  );

  return { sent, failed };
}
