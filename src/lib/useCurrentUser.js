import { useState, useEffect } from "react";
import { base44 } from "@/api/mockBase44Client";

/**
 * Hook: useCurrentUser
 * Returns the current authenticated user and their role-specific profile.
 *
 * NOTE FOR NEXT.JS MIGRATION:
 * Replace this with your custom JWT/session hook.
 * e.g., import { useSession } from 'next-auth/react'
 * or your own useAuth() hook that reads from cookie/JWT.
 */
export function useCurrentUser() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    base44.auth
      .me()
      .then(setUser)
      .catch(() => setUser(null))
      .finally(() => setLoading(false));
  }, []);

  return { user, loading };
}
