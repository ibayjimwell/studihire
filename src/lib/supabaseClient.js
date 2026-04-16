/**
 * Supabase Client Configuration
 * Central place for all Supabase setup and initialization
 * All environment variables are loaded here and exported
 */

import { createClient } from "@supabase/supabase-js";

// Load environment variables
const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY;

// Validate required environment variables
if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  throw new Error(
    "Missing required Supabase environment variables. Please check your .env file.",
  );
}

// Initialize Supabase client
export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true,
    storageKey: "sb-studihire-auth-token",
    storage: typeof window !== "undefined" ? window.localStorage : undefined,
  },
});

// Export configuration constants
export const SUPABASE_CONFIG = {
  URL: SUPABASE_URL,
  ANON_KEY: SUPABASE_ANON_KEY,
  PROJECT_ID: import.meta.env.VITE_SUPABASE_PROJECT_ID,
  PROJECT_NAME: import.meta.env.VITE_SUPABASE_PROJECT_NAME,
};

/**
 * Export for use in other parts of the app
 */
export default supabase;
