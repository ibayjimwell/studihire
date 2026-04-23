-- ============================================================================
-- Migration 002: Fix verification_status CHECK constraints
-- ============================================================================
-- Problem:
--   - student_submissions only allows: draft, submitted, under_review,
--     approved, rejected
--   - But the frontend sets 'resubmit_required' for admin "needs_revision"
--   - student_profiles only allows: pending, submitted, verified, rejected
--   - But the trigger copies submission_status directly, and the frontend
--     uses 'approved' and 'resubmit_required' everywhere
--
-- Fix:
--   1. Add 'resubmit_required' to student_submissions CHECK constraint
--   2. Add 'approved' and 'resubmit_required' to student_profiles CHECK
--   3. Harden the trigger to map values explicitly instead of blindly copying
-- ============================================================================

-- ── 1. Fix student_submissions CHECK constraint ──────────────────────────────
ALTER TABLE student_submissions
DROP CONSTRAINT IF EXISTS student_submissions_submission_status_check;

ALTER TABLE student_submissions
ADD CONSTRAINT student_submissions_submission_status_check
CHECK (submission_status IN (
  'draft',
  'submitted',
  'under_review',
  'approved',
  'rejected',
  'resubmit_required'
));

-- ── 2. Fix student_profiles CHECK constraint ─────────────────────────────────
ALTER TABLE student_profiles
DROP CONSTRAINT IF EXISTS student_profiles_verification_status_check;

ALTER TABLE student_profiles
ADD CONSTRAINT student_profiles_verification_status_check
CHECK (verification_status IN (
  'pending',
  'submitted',
  'verified',
  'rejected',
  'approved',
  'resubmit_required'
));

-- ── 3. Harden trigger function with explicit value mapping ───────────────────
--    This prevents future issues if new submission_status values are added
--    that don't have a matching profile status.
CREATE OR REPLACE FUNCTION update_student_profile_status()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE student_profiles
  SET
    verification_status = CASE NEW.submission_status
      WHEN 'approved'          THEN 'approved'
      WHEN 'rejected'          THEN 'rejected'
      WHEN 'resubmit_required' THEN 'resubmit_required'
      WHEN 'submitted'         THEN 'submitted'
      WHEN 'under_review'      THEN 'submitted'
      ELSE 'pending'
    END,
    profile_verified = (NEW.submission_status = 'approved'),
    verified_at = CASE WHEN NEW.submission_status = 'approved' THEN NOW() ELSE verified_at END,
    updated_at = NOW()
  WHERE user_id = NEW.user_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;
