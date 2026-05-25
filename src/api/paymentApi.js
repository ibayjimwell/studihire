/**
 * Payment API — Supabase CRUD for payment lifecycle
 * Manages escrow, release, and platform fee deductions.
 *
 * Flow:
 * 1. Order placed → payment record created with status 'pending'
 * 2. Student starts work → payment status → 'held' (escrow)
 * 3. Client approves delivery → payment status → 'released'
 * 4. Platform fee deducted automatically
 *
 * Gateway integration notes:
 * - Currently uses 'manual' gateway placeholder
 * - To integrate PayMongo: set gateway='paymongo', store gateway_payment_id
 * - To integrate Stripe: set gateway='stripe', store gateway_payment_id
 * - See docs: https://developers.paymongo.com / https://stripe.com/docs/api
 */

import supabase from "@/lib/supabaseClient";

export const PAYMENT_STATUS = {
  PENDING: "pending",
  HELD: "held",
  RELEASED: "released",
  REFUNDED: "refunded",
  DISPUTED: "disputed",
};

export const PAYMENT_GATEWAYS = {
  MANUAL: "manual",
  PAYMONGO: "paymongo",
  STRIPE: "stripe",
};

const DEFAULT_FEE_PCT = 10.00;

// ---------------------------------------------------------------------------
// CREATE — Create a payment record for a new order
// ---------------------------------------------------------------------------

/**
 * Creates a payment record when an order transitions to in_progress.
 *
 * @param {{
 *   order_id:    string,
 *   client_id:   string,
 *   student_id:  string,
 *   amount:      number,
 *   fee_pct?:    number,
 * }} params
 * @returns {Promise<{ payment: object|null, error: object|null }>}
 */
export const paymentCreate = async (params) => {
  try {
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user)
      return { payment: null, error: { message: "Not authenticated." } };

    const { order_id, client_id, student_id, amount, fee_pct = DEFAULT_FEE_PCT } = params;

    if (!order_id) return { payment: null, error: { message: "Order ID required." } };
    if (!amount || amount <= 0) return { payment: null, error: { message: "Invalid amount." } };

    const platformFee = Math.round(amount * (fee_pct / 100) * 100) / 100;
    const netAmount = Math.round((amount - platformFee) * 100) / 100;

    const { data, error } = await supabase
      .from("payments")
      .insert({
        order_id,
        client_id,
        student_id,
        amount,
        platform_fee_pct: fee_pct,
        platform_fee: platformFee,
        net_amount: netAmount,
        currency: "PHP",
        status: PAYMENT_STATUS.HELD,
        paid_at: new Date().toISOString(),
        gateway: PAYMENT_GATEWAYS.MANUAL,
      })
      .select()
      .single();

    if (error) return { payment: null, error };
    return { payment: data, error: null };
  } catch (err) {
    return { payment: null, error: { message: err.message || "Failed to create payment." } };
  }
};

// ---------------------------------------------------------------------------
// READ — Get payments
// ---------------------------------------------------------------------------

/**
 * Get payment for a specific order.
 *
 * @param {string} orderId
 * @returns {Promise<{ payment: object|null, error: object|null }>}
 */
export const paymentGetByOrder = async (orderId) => {
  try {
    if (!orderId) return { payment: null, error: { message: "Order ID required." } };

    const { data, error } = await supabase
      .from("payments")
      .select("*")
      .eq("order_id", orderId)
      .maybeSingle();

    if (error) return { payment: null, error };
    return { payment: data ?? null, error: null };
  } catch (err) {
    return { payment: null, error: { message: err.message || "Failed to fetch payment." } };
  }
};

/**
 * Get payments for a client.
 *
 * @param {string} clientId
 * @param {{ limit?: number }} [options]
 * @returns {Promise<{ payments: object[], error: object|null }>}
 */
export const paymentGetByClient = async (clientId, options = {}) => {
  try {
    const { limit = 50 } = options;

    const { data, error } = await supabase
      .from("payments")
      .select("*")
      .eq("client_id", clientId)
      .order("created_at", { ascending: false })
      .limit(limit);

    if (error) return { payments: [], error };
    return { payments: data ?? [], error: null };
  } catch (err) {
    return { payments: [], error: { message: err.message || "Failed to fetch payments." } };
  }
};

/**
 * Get payments for a student (earnings).
 *
 * @param {string} studentId
 * @param {{ limit?: number }} [options]
 * @returns {Promise<{ payments: object[], error: object|null }>}
 */
export const paymentGetByStudent = async (studentId, options = {}) => {
  try {
    const { limit = 50 } = options;

    const { data, error } = await supabase
      .from("payments")
      .select("*")
      .eq("student_id", studentId)
      .order("created_at", { ascending: false })
      .limit(limit);

    if (error) return { payments: [], error };
    return { payments: data ?? [], error: null };
  } catch (err) {
    return { payments: [], error: { message: err.message || "Failed to fetch payments." } };
  }
};

// ---------------------------------------------------------------------------
// UPDATE — Release payment (on completion)
// ---------------------------------------------------------------------------

/**
 * Release payment to the student after client approval.
 *
 * @param {string} paymentId
 * @returns {Promise<{ payment: object|null, error: object|null }>}
 */
export const paymentRelease = async (paymentId) => {
  try {
    if (!paymentId) return { payment: null, error: { message: "Payment ID required." } };

    const { data, error } = await supabase
      .from("payments")
      .update({
        status: PAYMENT_STATUS.RELEASED,
        released_at: new Date().toISOString(),
      })
      .eq("id", paymentId)
      .select()
      .single();

    if (error) return { payment: null, error };
    return { payment: data, error: null };
  } catch (err) {
    return { payment: null, error: { message: err.message || "Failed to release payment." } };
  }
};

/**
 * Refund a payment.
 *
 * @param {string} paymentId
 * @returns {Promise<{ payment: object|null, error: object|null }>}
 */
export const paymentRefund = async (paymentId) => {
  try {
    if (!paymentId) return { payment: null, error: { message: "Payment ID required." } };

    const { data, error } = await supabase
      .from("payments")
      .update({
        status: PAYMENT_STATUS.REFUNDED,
        released_at: new Date().toISOString(),
      })
      .eq("id", paymentId)
      .select()
      .single();

    if (error) return { payment: null, error };
    return { payment: data, error: null };
  } catch (err) {
    return { payment: null, error: { message: err.message || "Failed to refund payment." } };
  }
};

// ---------------------------------------------------------------------------
// STATS — Get earnings stats for a student
// ---------------------------------------------------------------------------

/**
 * Get aggregated earnings stats for a student.
 *
 * @param {string} studentId
 * @returns {Promise<{ stats: object, error: object|null }>}
 */
export const paymentGetStudentStats = async (studentId) => {
  try {
    const { data, error } = await supabase
      .from("payments")
      .select("amount, platform_fee, net_amount, status")
      .eq("student_id", studentId);

    if (error) return { stats: {}, error };

    const stats = {
      total_gross: 0,
      total_fees: 0,
      total_net: 0,
      total_released: 0,
      total_pending: 0,
      count: data?.length || 0,
    };

    (data ?? []).forEach((p) => {
      stats.total_gross += Number(p.amount) || 0;
      stats.total_fees += Number(p.platform_fee) || 0;
      if (p.status === PAYMENT_STATUS.RELEASED) {
        stats.total_released += Number(p.net_amount) || 0;
      } else if (p.status === PAYMENT_STATUS.HELD || p.status === PAYMENT_STATUS.PENDING) {
        stats.total_pending += Number(p.net_amount) || 0;
      }
    });

    stats.total_net = stats.total_gross - stats.total_fees;
    stats.platform_took_pct = stats.total_gross > 0
      ? Math.round((stats.total_fees / stats.total_gross) * 100 * 100) / 100
      : 0;

    return { stats, error: null };
  } catch (err) {
    return { stats: {}, error: { message: err.message || "Failed to fetch stats." } };
  }
};