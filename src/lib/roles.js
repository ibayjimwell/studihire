/**
 * Role & Auth Utilities
 * NOTE: This is a UI-layer placeholder for role checking.
 * - JWT verification in middleware.js
 * - Server-side session checks in server actions / API routes
 */

export const ROLES = {
  ADMIN: 'admin',
  STUDENT: 'student',
  CLIENT: 'client',
};

export const VERIFICATION_STATUS = {
  PENDING: 'pending',
  APPROVED: 'approved',
  REJECTED: 'rejected',
  RESUBMIT_REQUIRED: 'resubmit_required',
};

/**
 * Check if a user has a specific role.
 * Replace with JWT claim check in Next.js.
 */
export function hasRole(user, role) {
  return user?.role === role;
}

/**
 * Check if a user is verified (approved).
 * In Next.js: validate against DB or JWT claim.
 */
export function isVerified(profile) {
  return profile?.verification_status === VERIFICATION_STATUS.APPROVED;
}

/**
 * Guard: can post gigs?
 */
export function canPostGigs(user, studentProfile) {
  return hasRole(user, ROLES.STUDENT) && isVerified(studentProfile);
}

/**
 * Guard: can post projects/jobs?
 */
export function canPostProjects(user, clientProfile) {
  return hasRole(user, ROLES.CLIENT) && isVerified(clientProfile);
}

/**
 * Guard: is admin?
 */
export function isAdmin(user) {
  return hasRole(user, ROLES.ADMIN);
}

export const CATEGORIES = [
  'Web Development',
  'Mobile Development',
  'Graphic Design',
  'UI/UX Design',
  'Content Writing',
  'Video Editing',
  'Digital Marketing',
  'Data Analysis',
  'Photography',
  'Music & Audio',
  'Translation',
  'Academic Tutoring',
  'Social Media',
  'SEO',
  'Other',
];

export const VERIFICATION_BADGE_CONFIG = {
  approved: { label: 'Verified', color: 'bg-green-100 text-green-700', icon: '✓' },
  pending: { label: 'Pending Review', color: 'bg-yellow-100 text-yellow-700', icon: '⏳' },
  rejected: { label: 'Rejected', color: 'bg-red-100 text-red-700', icon: '✗' },
  resubmit_required: { label: 'Resubmit Required', color: 'bg-orange-100 text-orange-700', icon: '↺' },
};

