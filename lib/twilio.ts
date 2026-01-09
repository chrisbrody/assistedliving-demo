// ===========================================
// TWILIO SMS CLIENT (Server-side only)
// ===========================================

// Note: This file should only be imported in API routes / server components
// Twilio credentials must never be exposed to the client

import twilio from "twilio";

const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;
const fromNumber = process.env.TWILIO_PHONE_NUMBER;
const demoPhone = process.env.DEMO_FAMILY_PHONE;

// Debug logging on startup
console.log("[TWILIO] Config check:", {
  hasAccountSid: !!accountSid,
  hasAuthToken: !!authToken,
  fromNumber: fromNumber || "NOT SET",
  demoPhone: demoPhone || "NOT SET",
});

// Create client (will be null if credentials not set)
const client =
  accountSid && authToken ? twilio(accountSid, authToken) : null;

export interface SendSmsParams {
  to: string;
  residentName: string;
  roomNumber: string;
}

export interface SendSmsResult {
  success: boolean;
  messageId?: string;
  error?: string;
}

export async function sendReadyNotification(
  params: SendSmsParams
): Promise<SendSmsResult> {
  const { to, residentName, roomNumber } = params;

  console.log("[TWILIO] sendReadyNotification called with:", {
    to,
    residentName,
    roomNumber,
    hasClient: !!client,
    fromNumber: fromNumber || "NOT SET",
    demoPhone: demoPhone || "NOT SET",
  });

  // Validate phone number format
  const cleanPhone = to.replace(/\D/g, "");
  if (cleanPhone.length < 10) {
    return {
      success: false,
      error: "Invalid phone number",
    };
  }

  // Format to E.164 (add +1 for US if needed)
  const formattedPhone = cleanPhone.startsWith("1")
    ? `+${cleanPhone}`
    : `+1${cleanPhone}`;

  // Check if Twilio is configured
  if (!client || !fromNumber) {
    console.log("[TWILIO] Not configured - would send SMS to:", formattedPhone);
    console.log(
      "[TWILIO] Message:",
      `${residentName} (Room ${roomNumber}) is ready for pickup!`
    );
    return {
      success: true,
      messageId: "demo-mode-no-sms",
    };
  }

  // For demo: Skip actual SMS, just simulate success
  // Real SMS requires A2P 10DLC registration (takes days)
  const DEMO_MODE = true;

  if (DEMO_MODE) {
    console.log("[TWILIO] DEMO MODE - Would send SMS:");
    console.log(`  To: ${formattedPhone}`);
    console.log(`  Message: Good news! ${residentName} (Room ${roomNumber}) is ready and waiting for you at the front lobby. See you soon!`);

    return {
      success: true,
      messageId: "demo-mode-simulated",
    };
  }

  try {
    const message = await client.messages.create({
      body: `Good news! ${residentName} (Room ${roomNumber}) is ready and waiting for you at the front lobby. See you soon!`,
      from: fromNumber,
      to: formattedPhone,
    });

    console.log("[TWILIO] SMS sent successfully:", message.sid);

    return {
      success: true,
      messageId: message.sid,
    };
  } catch (error: any) {
    console.error("[TWILIO] Failed to send SMS:", error.message);

    return {
      success: false,
      error: error.message || "Failed to send SMS",
    };
  }
}

// ===========================================
// DEMO HELPER
// ===========================================

export function getTwilioStatus(): {
  configured: boolean;
  fromNumber: string | null;
} {
  return {
    configured: !!(client && fromNumber),
    fromNumber: fromNumber || null,
  };
}
