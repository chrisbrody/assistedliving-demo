import { NextResponse } from "next/server";
import { sendReadyNotification } from "@/lib/twilio";

// ===========================================
// GET /api/test-sms
// ===========================================
// Quick test endpoint to debug Twilio

export async function GET() {
  console.log("[TEST-SMS] Test endpoint called");

  const result = await sendReadyNotification({
    to: process.env.DEMO_FAMILY_PHONE || "",
    residentName: "Test Resident",
    roomNumber: "101",
  });

  return NextResponse.json({
    ...result,
    debug: {
      demoPhone: process.env.DEMO_FAMILY_PHONE || "NOT SET",
      twilioConfigured: !!(process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN),
      fromNumber: process.env.TWILIO_PHONE_NUMBER || "NOT SET",
    },
  });
}
