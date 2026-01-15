import { supabase } from "@/lib/supabase";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    // Simple query to keep the database active
    const { count, error } = await supabase
      .from("residents")
      .select("*", { count: "exact", head: true });

    if (error) throw error;

    return NextResponse.json({
      success: true,
      message: "Database pinged successfully",
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: String(error) },
      { status: 500 }
    );
  }
}
