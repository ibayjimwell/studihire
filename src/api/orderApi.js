/**
 * Order API — Supabase CRUD operations for gig orders
 * All order-related database interactions live here.
 * Follows the same pattern as gigApi.js: clean separation of concerns.
 */

import supabase from "@/lib/supabaseClient";

// ---------------------------------------------------------------------------
// Types / constants
// ---------------------------------------------------------------------------

/** @typedef {'awaiting_payment'|'pending'|'in_progress'|'delivered'|'revision_requested'|'completed'|'cancelled'|'disputed'} OrderStatus */

export const ORDER_STATUS = {
  AWAITING_PAYMENT: "awaiting_payment",
  PENDING: "pending",
  IN_PROGRESS: "in_progress",
  DELIVERED: "delivered",
  REVISION_REQUESTED: "revision_requested",
  COMPLETED: "completed",
  CANCELLED: "cancelled",
  DISPUTED: "disputed",
};

// ---------------------------------------------------------------------------
// CREATE — Place a new order
// ---------------------------------------------------------------------------

/**
 * Places a new order for a gig. Returns the created order.
 *
 * @param {{
 *   gig_id:         string,
 *   student_id:     string,
 *   package_name:   string,
 *   package_index:  number,
 *   amount:         number,
 *   platform_fee:   number,
 *   delivery_days:  number,
 *   revisions:      number,
 *   requirements:   string,
 *   gig_title:      string,
 * }} orderData
 * @returns {Promise<{ order: object|null, error: object|null }>}
 */
export const orderPlace = async (orderData) => {
  try {
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return { order: null, error: { message: "You must be logged in to place an order." } };
    }

    // Fetch client profile for name
    const { data: clientProfile } = await supabase
      .from("client_profiles")
      .select("full_name, email")
      .eq("user_id", user.id)
      .single();

    // Fetch student profile for name
    const { data: studentProfile } = await supabase
      .from("student_profiles")
      .select("full_name, email")
      .eq("user_id", orderData.student_id)
      .single();

    // Calculate due date
    const dueDate = new Date();
    dueDate.setDate(dueDate.getDate() + (orderData.delivery_days || 7));

    const payload = {
      gig_id:         orderData.gig_id,
      client_id:      user.id,
      student_id:     orderData.student_id,
      package_name:   orderData.package_name,
      package_index:  orderData.package_index,
      amount:         orderData.amount,
      platform_fee:   orderData.platform_fee,
      delivery_days:  orderData.delivery_days,
      revisions:      orderData.revisions,
      requirements:   orderData.requirements || "",
      status:         ORDER_STATUS.AWAITING_PAYMENT,
      due_date:       dueDate.toISOString(),
      client_name:    clientProfile?.full_name || user.email?.split("@")[0] || "Client",
      client_email:   clientProfile?.email || user.email || "",
      gig_title:      orderData.gig_title || "",
      student_name:   studentProfile?.full_name || "",
      student_email:  studentProfile?.email || "",
    };

    const { data, error } = await supabase
      .from("orders")
      .insert(payload)
      .select()
      .single();

    if (error) return { order: null, error };
    return { order: data, error: null };
  } catch (err) {
    return { order: null, error: { message: err.message || "Failed to place order." } };
  }
};

// ---------------------------------------------------------------------------
// READ — Get orders for the current client
// ---------------------------------------------------------------------------

/**
 * Fetches all orders placed by the current authenticated client.
 *
 * @param {{
 *   status?:  OrderStatus,
 *   limit?:   number,
 *   offset?:  number,
 * }} [options]
 * @returns {Promise<{ orders: object[], error: object|null }>}
 */
export const orderGetMyClientOrders = async (options = {}) => {
  try {
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return { orders: [], error: { message: "Not authenticated." } };
    }

    const { status, limit = 50, offset = 0 } = options;

    let query = supabase
      .from("orders")
      .select("*")
      .eq("client_id", user.id)
      .order("created_at", { ascending: false })
      .range(offset, offset + limit - 1);

    if (status) {
      query = query.eq("status", status);
    }

    const { data, error } = await query;
    if (error) return { orders: [], error };
    return { orders: data ?? [], error: null };
  } catch (err) {
    return { orders: [], error: { message: err.message || "Failed to fetch orders." } };
  }
};

// ---------------------------------------------------------------------------
// READ — Get orders for the current student
// ---------------------------------------------------------------------------

/**
 * Fetches all orders received by the current authenticated student.
 *
 * @param {{
 *   status?:  OrderStatus,
 *   limit?:   number,
 *   offset?:  number,
 * }} [options]
 * @returns {Promise<{ orders: object[], error: object|null }>}
 */
export const orderGetMyStudentOrders = async (options = {}) => {
  try {
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return { orders: [], error: { message: "Not authenticated." } };
    }

    const { status, limit = 50, offset = 0 } = options;

    let query = supabase
      .from("orders")
      .select("*")
      .eq("student_id", user.id)
      .order("created_at", { ascending: false })
      .range(offset, offset + limit - 1);

    if (status) {
      query = query.eq("status", status);
    }

    const { data, error } = await query;
    if (error) return { orders: [], error };
    return { orders: data ?? [], error: null };
  } catch (err) {
    return { orders: [], error: { message: err.message || "Failed to fetch orders." } };
  }
};

// ---------------------------------------------------------------------------
// READ — Get a single order by ID
// ---------------------------------------------------------------------------

/**
 * Fetches a single order by ID.
 * Accessible to both client and student who are parties to the order.
 *
 * @param {string} orderId
 * @returns {Promise<{ order: object|null, error: object|null }>}
 */
export const orderGetById = async (orderId) => {
  try {
    if (!orderId) return { order: null, error: { message: "Order ID is required." } };

    const { data, error } = await supabase
      .from("orders")
      .select("*")
      .eq("id", orderId)
      .single();

    if (error) return { order: null, error };
    return { order: data, error: null };
  } catch (err) {
    return { order: null, error: { message: err.message || "Failed to fetch order." } };
  }
};

// ---------------------------------------------------------------------------
// UPDATE — Update order status
// ---------------------------------------------------------------------------

/**
 * Updates the status of an order.
 *
 * @param {string} orderId
 * @param {OrderStatus} newStatus
 * @returns {Promise<{ order: object|null, error: object|null }>}
 */
export const orderUpdateStatus = async (orderId, newStatus) => {
  try {
    if (!orderId) {
      return { order: null, error: { message: "Order ID is required." } };
    }

    const allowed = Object.values(ORDER_STATUS);
    if (!allowed.includes(newStatus)) {
      return { order: null, error: { message: `Invalid status: ${newStatus}` } };
    }

    const { data, error } = await supabase
      .from("orders")
      .update({ status: newStatus })
      .eq("id", orderId)
      .select()
      .single();

    if (error) return { order: null, error };
    return { order: data, error: null };
  } catch (err) {
    return { order: null, error: { message: err.message || "Failed to update order status." } };
  }
};

// ---------------------------------------------------------------------------
// UPDATE — Update order requirements
// ---------------------------------------------------------------------------

/**
 * Updates the requirements of an order.
 *
 * @param {string} orderId
 * @param {string} requirements
 * @returns {Promise<{ order: object|null, error: object|null }>}
 */
export const orderUpdateRequirements = async (orderId, requirements) => {
  try {
    if (!orderId) {
      return { order: null, error: { message: "Order ID is required." } };
    }

    const { data, error } = await supabase
      .from("orders")
      .update({ requirements })
      .eq("id", orderId)
      .select()
      .single();

    if (error) return { order: null, error };
    return { order: data, error: null };
  } catch (err) {
    return { order: null, error: { message: err.message || "Failed to update requirements." } };
  }
};

// ---------------------------------------------------------------------------
// COUNT — Get order counts for student dashboard
// ---------------------------------------------------------------------------

/**
 * Returns counts of orders grouped by status for the current student.
 *
 * @returns {Promise<{ counts: object, error: object|null }>}
 */
export const orderGetStudentCounts = async () => {
  try {
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return { counts: {}, error: { message: "Not authenticated." } };
    }

    const { data, error } = await supabase
      .from("orders")
      .select("status")
      .eq("student_id", user.id);

    if (error) return { counts: {}, error };

    const counts = {
      total: data.length,
      active: data.filter((o) =>
        ["pending", "in_progress", "revision_requested", "delivered"].includes(o.status)
      ).length,
      completed: data.filter((o) => o.status === "completed").length,
      cancelled: data.filter((o) => o.status === "cancelled").length,
    };

    return { counts, error: null };
  } catch (err) {
    return { counts: {}, error: { message: err.message || "Failed to fetch counts." } };
  }
};

/**
 * Returns counts of orders grouped by status for the current client.
 *
 * @returns {Promise<{ counts: object, error: object|null }>}
 */
export const orderGetClientCounts = async () => {
  try {
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return { counts: {}, error: { message: "Not authenticated." } };
    }

    const { data, error } = await supabase
      .from("orders")
      .select("status")
      .eq("client_id", user.id);

    if (error) return { counts: {}, error };

    const counts = {
      total: data.length,
      active: data.filter((o) =>
        ["pending", "in_progress", "revision_requested", "delivered"].includes(o.status)
      ).length,
      completed: data.filter((o) => o.status === "completed").length,
      cancelled: data.filter((o) => o.status === "cancelled").length,
    };

    return { counts, error: null };
  } catch (err) {
    return { counts: {}, error: { message: err.message || "Failed to fetch counts." } };
  }
};