/**
 * Authentication Utilities
 * Handles all auth operations with Supabase
 * Clean separation of concerns - all logic here, not in components
 */

import supabase from "@/lib/supabaseClient";

/**
 * Sign up a new user with email and password
 * @param {string} email - User email
 * @param {string} password - User password (min 6 chars)
 * @param {object} userData - Additional user data (full_name, role, etc.)
 * @returns {Promise<{user, session, error}>}
 */
export const authSignUp = async (email, password, userData = {}) => {
  try {
    // Validate inputs
    if (!email || !password) {
      return {
        user: null,
        session: null,
        error: { message: "Email and password are required" },
      };
    }

    if (password.length < 6) {
      return {
        user: null,
        session: null,
        error: { message: "Password must be at least 6 characters" },
      };
    }

    // Sign up user
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: userData.full_name || "",
          role: userData.role || "student",
          ...userData,
        },
      },
    });

    if (error) {
      return { user: null, session: null, error };
    }

    return {
      user: data.user,
      session: data.session,
      error: null,
    };
  } catch (error) {
    return {
      user: null,
      session: null,
      error: { message: error.message || "An error occurred during signup" },
    };
  }
};

/**
 * Log in a user with email and password
 * @param {string} email - User email
 * @param {string} password - User password
 * @returns {Promise<{user, session, error}>}
 */
export const authLogin = async (email, password) => {
  try {
    // Validate inputs
    if (!email || !password) {
      return {
        user: null,
        session: null,
        error: { message: "Email and password are required" },
      };
    }

    // Sign in user
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      return { user: null, session: null, error };
    }

    return {
      user: data.user,
      session: data.session,
      error: null,
    };
  } catch (error) {
    return {
      user: null,
      session: null,
      error: { message: error.message || "An error occurred during login" },
    };
  }
};

/**
 * Log out the current user
 * Clears all session data
 * @returns {Promise<{error}>}
 */
export const authLogout = async () => {
  try {
    const { error } = await supabase.auth.signOut();

    if (error) {
      return { error };
    }

    return { error: null };
  } catch (error) {
    return {
      error: { message: error.message || "An error occurred during logout" },
    };
  }
};

/**
 * Get the current authenticated user
 * @returns {Promise<{user, error}>}
 */
export const authGetCurrentUser = async () => {
  try {
    const {
      data: { user },
      error,
    } = await supabase.auth.getUser();

    if (error) {
      return { user: null, error };
    }

    return { user, error: null };
  } catch (error) {
    return {
      user: null,
      error: { message: error.message || "Failed to get current user" },
    };
  }
};

/**
 * Get the current session
 * @returns {Promise<{session, error}>}
 */
export const authGetSession = async () => {
  try {
    const {
      data: { session },
      error,
    } = await supabase.auth.getSession();

    if (error) {
      return { session: null, error };
    }

    return { session, error: null };
  } catch (error) {
    return {
      session: null,
      error: { message: error.message || "Failed to get session" },
    };
  }
};

/**
 * Listen to authentication state changes
 * @param {function} callback - Function to call when auth state changes
 * @returns {function} Unsubscribe function
 */
export const authOnAuthStateChange = (callback) => {
  const {
    data: { subscription },
  } = supabase.auth.onAuthStateChange(async (event, session) => {
    callback(event, session);
  });

  // Return unsubscribe function
  return () => {
    subscription.unsubscribe();
  };
};

/**
 * Send password reset email
 * @param {string} email - User email
 * @returns {Promise<{error}>}
 */
export const authSendPasswordResetEmail = async (email) => {
  try {
    if (!email) {
      return { error: { message: "Email is required" } };
    }

    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/auth/reset-password`,
    });

    if (error) {
      return { error };
    }

    return { error: null };
  } catch (error) {
    return {
      error: { message: error.message || "Failed to send reset email" },
    };
  }
};

/**
 * Update user password
 * @param {string} newPassword - New password
 * @returns {Promise<{error}>}
 */
export const authUpdatePassword = async (newPassword) => {
  try {
    if (!newPassword || newPassword.length < 6) {
      return {
        error: { message: "Password must be at least 6 characters" },
      };
    }

    const { error } = await supabase.auth.updateUser({
      password: newPassword,
    });

    if (error) {
      return { error };
    }

    return { error: null };
  } catch (error) {
    return {
      error: { message: error.message || "Failed to update password" },
    };
  }
};

/**
 * Update user profile information
 * @param {object} updates - Object with fields to update (full_name, role, etc.)
 * @returns {Promise<{user, error}>}
 */
export const authUpdateProfile = async (updates) => {
  try {
    if (!updates || Object.keys(updates).length === 0) {
      return { user: null, error: { message: "No updates provided" } };
    }

    const { data, error } = await supabase.auth.updateUser({
      data: updates,
    });

    if (error) {
      return { user: null, error };
    }

    return { user: data.user, error: null };
  } catch (error) {
    return {
      user: null,
      error: { message: error.message || "Failed to update profile" },
    };
  }
};

/**
 * Validate email format
 * @param {string} email - Email to validate
 * @returns {boolean}
 */
export const authValidateEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

/**
 * Validate password strength
 * @param {string} password - Password to validate
 * @returns {object} - { isValid, feedback }
 */
export const authValidatePassword = (password) => {
  const feedback = [];
  let isValid = true;

  if (password.length < 6) {
    feedback.push("At least 6 characters");
    isValid = false;
  }
  if (!/[A-Z]/.test(password)) {
    feedback.push("At least one uppercase letter");
  }
  if (!/[a-z]/.test(password)) {
    feedback.push("At least one lowercase letter");
  }
  if (!/[0-9]/.test(password)) {
    feedback.push("At least one number");
  }

  return { isValid: isValid && feedback.length === 0, feedback };
};

/**
 * Get error message from Supabase error
 * @param {object} error - Error object from Supabase
 * @returns {string} - User-friendly error message
 */
export const authGetErrorMessage = (error) => {
  if (!error) return "An error occurred";

  // Map common Supabase errors to user-friendly messages
  const errorMap = {
    "User already registered": "This email is already registered",
    "Invalid login credentials": "Invalid email or password",
    "Email not confirmed": "Invalid email or password",
    "Password should be at least 6 characters":
      "Password must be at least 6 characters",
    "Invalid email": "Please enter a valid email address",
  };

  const message = error.message || "";

  for (const [key, value] of Object.entries(errorMap)) {
    if (message.includes(key)) {
      return value;
    }
  }

  return message || "An error occurred";
};

/**
 * Check if email is verified
 * @param {object} user - User object
 * @returns {boolean}
 */
export const authIsEmailVerified = (user) => {
  return user?.email_confirmed_at ? true : false;
};
