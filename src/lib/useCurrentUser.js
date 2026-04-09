import { useAuth } from "./AuthContext";

/**
 * Hook: useCurrentUser
 * Returns the current authenticated user from AuthContext.
 * Uses the AuthContext to get the current user and respect role switching.
 */
export function useCurrentUser() {
  const { user, loading } = useAuth();
  return { user, loading };
}
