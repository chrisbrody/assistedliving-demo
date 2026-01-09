import { createClient } from "@supabase/supabase-js";

// ===========================================
// SUPABASE CLIENT
// ===========================================

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// ===========================================
// TYPE EXPORTS
// ===========================================

export type { RealtimePostgresChangesPayload } from "@supabase/supabase-js";
