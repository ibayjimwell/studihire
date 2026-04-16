-- Create student_profiles table
CREATE TABLE IF NOT EXISTS student_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Basic Info
  full_name VARCHAR(255),
  email VARCHAR(255),
  phone_number VARCHAR(20),
  location VARCHAR(255),
  bio TEXT,
  profile_image_url TEXT,
  
  -- Status
  verification_status VARCHAR(50) DEFAULT 'pending' CHECK (verification_status IN ('pending', 'submitted', 'verified', 'rejected')),
  onboarding_completed BOOLEAN DEFAULT FALSE,
  profile_verified BOOLEAN DEFAULT FALSE,
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  verified_at TIMESTAMP WITH TIME ZONE
);

-- Create student_submissions table (for tracking onboarding submissions)
CREATE TABLE IF NOT EXISTS student_submissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Personal Info
  full_name VARCHAR(255),
  email VARCHAR(255),
  phone_number VARCHAR(20),
  location VARCHAR(255),
  bio TEXT,
  
  -- Education Details
  education_level VARCHAR(100),
  institution VARCHAR(255),
  graduation_year INTEGER,
  field_of_study VARCHAR(255),
  
  -- Skills
  skills TEXT[],
  proficiency_level JSONB,
  
  -- Experience
  experience TEXT,
  years_of_experience DECIMAL(3,1),
  
  -- Documents
  resume_url TEXT,
  student_id_url TEXT,
  
  -- Submission Status
  submission_status VARCHAR(50) DEFAULT 'draft' CHECK (submission_status IN ('draft', 'submitted', 'under_review', 'approved', 'rejected')),
  submission_notes TEXT,
  admin_comments TEXT,
  rejected_reason TEXT,
  
  -- AI Parsed Data (from resume)
  ai_parsed_resume JSONB,
  ai_extraction_confidence DECIMAL(3,2),
  
  -- Assignments
  assigned_admin_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  submitted_at TIMESTAMP WITH TIME ZONE,
  reviewed_at TIMESTAMP WITH TIME ZONE,
  verified_at TIMESTAMP WITH TIME ZONE,
  
  UNIQUE(user_id, created_at)
);

-- Create student_submissions indexes
CREATE INDEX idx_student_submissions_user_id ON student_submissions(user_id);
CREATE INDEX idx_student_submissions_status ON student_submissions(submission_status);
CREATE INDEX idx_student_submissions_assigned_admin ON student_submissions(assigned_admin_id);

-- Create student_profiles indexes
CREATE INDEX idx_student_profiles_user_id ON student_profiles(user_id);
CREATE INDEX idx_student_profiles_verification_status ON student_profiles(verification_status);

-- Create admin_reviews table
CREATE TABLE IF NOT EXISTS admin_reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  submission_id UUID NOT NULL REFERENCES student_submissions(id) ON DELETE CASCADE,
  admin_id UUID NOT NULL REFERENCES auth.users(id),
  
  -- Review Details
  review_status VARCHAR(50) DEFAULT 'pending' CHECK (review_status IN ('pending', 'approved', 'rejected', 'needs_revision')),
  comments TEXT,
  rejection_reason TEXT,
  
  -- Fields Verified
  basic_info_verified BOOLEAN DEFAULT FALSE,
  education_verified BOOLEAN DEFAULT FALSE,
  skills_verified BOOLEAN DEFAULT FALSE,
  experience_verified BOOLEAN DEFAULT FALSE,
  documents_verified BOOLEAN DEFAULT FALSE,
  student_id_verified BOOLEAN DEFAULT FALSE,
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  reviewed_at TIMESTAMP WITH TIME ZONE,
  
  UNIQUE(submission_id, admin_id)
);

-- Create admin_reviews indexes
CREATE INDEX idx_admin_reviews_admin_id ON admin_reviews(admin_id);
CREATE INDEX idx_admin_reviews_submission_id ON admin_reviews(submission_id);
CREATE INDEX idx_admin_reviews_status ON admin_reviews(review_status);

-- Enable RLS (Row Level Security)
ALTER TABLE student_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE student_submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin_reviews ENABLE ROW LEVEL SECURITY;

-- RLS Policies for student_profiles
CREATE POLICY "Students can view their own profile"
  ON student_profiles FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all profiles"
  ON student_profiles FOR SELECT
  USING ((auth.jwt() -> 'user_metadata' ->> 'role') = 'admin');

CREATE POLICY "Students can update their own profile"
  ON student_profiles FOR UPDATE
  USING (auth.uid() = user_id);

-- RLS Policies for student_submissions
CREATE POLICY "Students can view their own submissions"
  ON student_submissions FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all submissions"
  ON student_submissions FOR SELECT
  USING ((auth.jwt() -> 'user_metadata' ->> 'role') = 'admin');

CREATE POLICY "Students can insert their own submissions"
  ON student_submissions FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Students can update their own draft submissions"
  ON student_submissions FOR UPDATE
  USING (auth.uid() = user_id AND submission_status = 'draft');

CREATE POLICY "Admins can update submissions for review"
  ON student_submissions FOR UPDATE
  USING ((auth.jwt() -> 'user_metadata' ->> 'role') = 'admin');

-- RLS Policies for admin_reviews
CREATE POLICY "Admins can view all reviews"
  ON admin_reviews FOR SELECT
  USING ((auth.jwt() -> 'user_metadata' ->> 'role') = 'admin');

CREATE POLICY "Admins can create reviews"
  ON admin_reviews FOR INSERT
  WITH CHECK (
    (auth.jwt() -> 'user_metadata' ->> 'role') = 'admin'
    AND auth.uid() = admin_id
  );

CREATE POLICY "Admins can update their own reviews"
  ON admin_reviews FOR UPDATE
  USING (
    (auth.jwt() -> 'user_metadata' ->> 'role') = 'admin'
    AND auth.uid() = admin_id
  );

-- Trigger function: sync profile status when submission status changes
CREATE OR REPLACE FUNCTION update_student_profile_status()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE student_profiles
  SET 
    verification_status = NEW.submission_status,
    profile_verified = (NEW.submission_status = 'approved'),
    verified_at = CASE WHEN NEW.submission_status = 'approved' THEN NOW() ELSE verified_at END,
    updated_at = NOW()
  WHERE user_id = NEW.user_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER submission_status_change
AFTER UPDATE ON student_submissions
FOR EACH ROW
WHEN (OLD.submission_status IS DISTINCT FROM NEW.submission_status)
EXECUTE FUNCTION update_student_profile_status();

-- Helper function: get pending submissions (admin use)
CREATE OR REPLACE FUNCTION get_pending_submissions()
RETURNS SETOF student_submissions AS $$
  SELECT *
  FROM student_submissions
  WHERE submission_status IN ('submitted', 'under_review', 'needs_revision')
  ORDER BY created_at ASC;
$$ LANGUAGE SQL SECURITY DEFINER;

-- Helper function: count pending verifications
CREATE OR REPLACE FUNCTION count_pending_verifications()
RETURNS INTEGER AS $$
  SELECT COUNT(*)::INTEGER
  FROM student_submissions
  WHERE submission_status IN ('submitted', 'under_review');
$$ LANGUAGE SQL SECURITY DEFINER;