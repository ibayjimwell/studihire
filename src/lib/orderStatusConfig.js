/**
 * Shared Order Status Configuration
 * Used across both Client and Student order views
 */

import {
  AlertCircle,
  Clock,
  CheckCircle,
  AlertTriangle,
  Package,
  CheckCircleIcon,
} from "lucide-react";

export const ORDER_STATUSES = {
  AWAITING_PAYMENT: "awaiting_payment",
  PENDING: "pending",
  IN_PROGRESS: "in_progress",
  DELIVERED: "delivered",
  REVISION_REQUESTED: "revision_requested",
  COMPLETED: "completed",
};

/**
 * Complete status configuration with display properties
 * Used in badges, cards, and timeline components
 */
export const STATUS_DISPLAY_CONFIG = {
  awaiting_payment: {
    label: "Awaiting Payment",
    shortLabel: "Awaiting Payment",
    description: "Order awaiting client payment",
    badge: "bg-gray-100 text-gray-800 border-gray-300",
    dotClass: "bg-gray-400",
    stepNumber: 1,
    icon: AlertCircle,
  },
  pending: {
    label: "Pending",
    shortLabel: "Pending",
    description: "Payment received, awaiting student work",
    badge: "bg-amber-100 text-amber-800 border-amber-300",
    dotClass: "bg-amber-500",
    stepNumber: 2,
    icon: Clock,
  },
  in_progress: {
    label: "In Progress",
    shortLabel: "Working",
    description: "Student actively working on order",
    badge: "bg-blue-100 text-blue-800 border-blue-300",
    dotClass: "bg-blue-500",
    stepNumber: 3,
    icon: CheckCircle,
  },
  delivered: {
    label: "Awaiting Review",
    shortLabel: "Delivered",
    description: "Work delivered, awaiting client approval",
    badge: "bg-purple-100 text-purple-800 border-purple-300",
    dotClass: "bg-purple-500",
    stepNumber: 4,
    icon: Package,
  },
  revision_requested: {
    label: "Revision Needed",
    shortLabel: "Revision",
    description: "Client requested changes to delivery",
    badge: "bg-orange-100 text-orange-800 border-orange-300",
    dotClass: "bg-orange-500",
    stepNumber: 3,
    icon: AlertTriangle,
  },
  completed: {
    label: "Completed",
    shortLabel: "Completed",
    description: "Order completed and payment finalized",
    badge: "bg-green-100 text-green-800 border-green-300",
    dotClass: "bg-green-500",
    stepNumber: 5,
    icon: CheckCircleIcon,
  },
};

/**
 * Timeline progress stages for visual representation
 * Maps status to progress percentage and stage description
 */
export const TIMELINE_STAGES = [
  {
    key: "order_placed",
    label: "Order Placed",
    description: "Order created in system",
  },
  {
    key: "payment_pending",
    label: "Payment Pending",
    description: "Awaiting payment confirmation",
  },
  {
    key: "work_started",
    label: "Work Started",
    description: "Student begins working on order",
  },
  {
    key: "work_delivered",
    label: "Work Delivered",
    description: "Student submitted deliverables",
  },
  {
    key: "completed",
    label: "Completed",
    description: "Order finished and payment settled",
  },
];

/**
 * Get timeline progress step (0-4) based on status
 * @param {string} status - Current order status
 * @returns {number} Progress step index
 */
export const getTimelineStep = (status) => {
  const stepMap = {
    awaiting_payment: 1,
    pending: 2,
    in_progress: 3,
    delivered: 4,
    revision_requested: 3,
    completed: 5,
  };
  return stepMap[status] || 0;
};

/**
 * Get display config for a specific status
 * @param {string} status - Order status
 * @returns {Object} Display configuration
 */
export const getStatusConfig = (status) => {
  return (
    STATUS_DISPLAY_CONFIG[status] || STATUS_DISPLAY_CONFIG.awaiting_payment
  );
};

/**
 * Get badge HTML class for status
 * @param {string} status - Order status
 * @returns {string} TailwindCSS class
 */
export const getStatusBadgeClass = (status) => {
  return (
    getStatusConfig(status)?.badge ||
    STATUS_DISPLAY_CONFIG.awaiting_payment.badge
  );
};

/**
 * Get status label for display
 * @param {string} status - Order status
 * @returns {string} Status label
 */
export const getStatusLabel = (status) => {
  return getStatusConfig(status)?.label || "Unknown";
};

/**
 * Get all available statusses
 * @returns {Array} Array of status keys
 */
export const getAllStatuses = () => {
  return Object.values(ORDER_STATUSES);
};

/**
 * Check if status indicates work completion path
 * @param {string} status - Order status
 * @returns {boolean} True if order is completed or in final states
 */
export const isOrderFinalized = (status) => {
  return [
    STATUS_DISPLAY_CONFIG.completed.label,
    STATUS_DISPLAY_CONFIG.delivered.label,
  ].includes(getStatusLabel(status));
};

/**
 * Get next expected status based on current status
 * @param {string} status - Current order status
 * @returns {string} Next expected status
 */
export const getNextExpectedStatus = (status) => {
  const nextStatusMap = {
    awaiting_payment: "pending",
    pending: "in_progress",
    in_progress: "delivered",
    delivered: "completed",
    revision_requested: "in_progress",
    completed: "completed",
  };
  return nextStatusMap[status] || null;
};
