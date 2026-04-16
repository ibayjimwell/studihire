// Student Order Status Configuration and Helpers

export const STUDENT_ORDER_STATUSES = {
  AWAITING_PAYMENT: "awaiting_payment",
  PENDING_APPROVAL: "pending",
  IN_PROGRESS: "in_progress",
  DELIVERED: "delivered",
  REVISION_REQUESTED: "revision_requested",
  COMPLETED: "completed",
};

export const STUDENT_STATUS_CONFIG = {
  awaiting_payment: {
    label: "Awaiting Payment",
    description: "Order pending client payment",
    color: "bg-gray-100 text-gray-700",
    dotColor: "bg-gray-400",
    icon: "AlertCircle",
    actionLabel: "Review & Approve",
  },
  pending: {
    label: "Pending Approval",
    description: "Order approved, payment processing",
    color: "bg-amber-100 text-amber-700",
    dotColor: "bg-amber-500",
    icon: "Clock",
    actionLabel: "Start Work",
  },
  in_progress: {
    label: "In Progress",
    description: "Currently working on order",
    color: "bg-blue-100 text-blue-700",
    dotColor: "bg-blue-500",
    icon: "CheckCircle",
    actionLabel: "Deliver Work",
  },
  delivered: {
    label: "Awaiting Review",
    description: "Work delivered, awaiting client approval",
    color: "bg-purple-100 text-purple-700",
    dotColor: "bg-purple-500",
    icon: "CheckCircle",
    actionLabel: "Awaiting Review",
  },
  revision_requested: {
    label: "Revision Needed",
    description: "Client requested revisions",
    color: "bg-orange-100 text-orange-700",
    dotColor: "bg-orange-500",
    icon: "AlertTriangle",
    actionLabel: "Submit Revision",
  },
  completed: {
    label: "Completed",
    description: "Order completed and paid",
    color: "bg-green-100 text-green-700",
    dotColor: "bg-green-500",
    icon: "CheckCircle",
    actionLabel: "Completed",
  },
};

/**
 * Calculate progress percentage based on order status
 * @param {string} status - Current order status
 * @returns {number} Progress percentage (0-100)
 */
export const getOrderProgress = (status) => {
  const progressMap = {
    awaiting_payment: 0,
    pending: 25,
    in_progress: 50,
    delivered: 75,
    revision_requested: 50,
    completed: 100,
  };
  return progressMap[status] || 0;
};

/**
 * Calculate student's earning from order
 * @param {number} amount - Order amount
 * @param {number} platformFeePercent - Platform fee percentage (default 10%)
 * @returns {number} Student's earning after fees
 */
export const calculateStudentEarning = (amount, platformFeePercent = 0.1) => {
  const fee = Math.round(amount * platformFeePercent);
  return amount - fee;
};

/**
 * Get next action based on current status
 * @param {string} status - Current order status
 * @returns {string} Next action to take
 */
export const getNextAction = (status) => {
  const actionMap = {
    awaiting_payment: "approve",
    pending: "start_work",
    in_progress: "deliver",
    delivered: "awaiting_review",
    revision_requested: "submit_revision",
    completed: "completed",
  };
  return actionMap[status] || null;
};

/**
 * Check if student can perform an action on the order
 * @param {string} status - Current order status
 * @param {string} action - Action to perform
 * @returns {boolean} Whether action is allowed
 */
export const canPerformAction = (status, action) => {
  const allowedActions = {
    awaiting_payment: ["approve", "decline"],
    pending: ["start_work"],
    in_progress: ["deliver"],
    delivered: [],
    revision_requested: ["submit_revision"],
    completed: [],
  };

  return (allowedActions[status] || []).includes(action);
};

/**
 * Format remaining time until due date
 * @param {string} dueDate - ISO date string
 * @returns {string} Formatted time remaining
 */
export const getTimeRemaining = (dueDate) => {
  const now = new Date();
  const due = new Date(dueDate);
  const diff = due - now;

  if (diff < 0) return "Overdue";

  const hours = Math.floor(diff / (1000 * 60 * 60));
  const days = Math.floor(hours / 24);

  if (days > 0) return `${days} day${days > 1 ? "s" : ""} remaining`;
  if (hours > 0) return `${hours} hour${hours > 1 ? "s" : ""} remaining`;

  return "Due soon";
};

/**
 * Get color for time remaining indicator
 * @param {string} dueDate - ISO date string
 * @returns {string} Color class
 */
export const getTimeRemainingColor = (dueDate) => {
  const now = new Date();
  const due = new Date(dueDate);
  const diff = due - now;
  const hoursRemaining = diff / (1000 * 60 * 60);

  if (hoursRemaining < 0) return "text-red-600"; // Overdue
  if (hoursRemaining < 24) return "text-red-500"; // Less than 1 day
  if (hoursRemaining < 72) return "text-yellow-500"; // Less than 3 days
  return "text-green-500"; // More than 3 days
};

/**
 * Status categories for filtering orders
 */
export const STATUS_CATEGORIES = {
  PENDING: ["awaiting_payment", "pending"],
  ACTIVE: ["in_progress", "revision_requested"],
  COMPLETED: ["delivered", "completed"],
};

/**
 * Check if order status is in a specific category
 * @param {string} status - Order status
 * @param {string} category - Category key (PENDING, ACTIVE, COMPLETED)
 * @returns {boolean} Whether status belongs to category
 */
export const isStatusInCategory = (status, category) => {
  return (STATUS_CATEGORIES[category] || []).includes(status);
};

/**
 * Filter orders by category
 * @param {Array} orders - Array of order objects
 * @param {string} category - Category to filter by (all, pending, active, completed)
 * @returns {Array} Filtered orders
 */
export const filterOrdersByCategory = (orders, category) => {
  if (category === "all") return orders;

  const categoryKey = category.toUpperCase();
  if (!STATUS_CATEGORIES[categoryKey]) return orders;

  return orders.filter((order) =>
    isStatusInCategory(order.status, categoryKey),
  );
};

/**
 * Calculate order statistics
 * @param {Array} orders - Array of order objects
 * @returns {Object} Statistics object with counts by category
 */
export const calculateOrderStats = (orders) => {
  return {
    total: orders.length,
    pending: orders.filter((o) => isStatusInCategory(o.status, "PENDING"))
      .length,
    active: orders.filter((o) => isStatusInCategory(o.status, "ACTIVE")).length,
    completed: orders.filter((o) => isStatusInCategory(o.status, "COMPLETED"))
      .length,
  };
};
