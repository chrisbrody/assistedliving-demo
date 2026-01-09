import { NextResponse } from "next/server";
import { getActiveResidents } from "@/lib/queries";

// ===========================================
// GET /api/residents
// ===========================================
// Returns all active residents (for dropdown selection)

export async function GET() {
  try {
    const residents = await getActiveResidents();
    return NextResponse.json(residents);
  } catch (error: any) {
    console.error("[API] GET /residents error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to fetch residents" },
      { status: 500 }
    );
  }
}
