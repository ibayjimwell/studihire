-- ═══════════════════════════════════════════════════════════════════════════════
-- Migration 006: Delivery System, Payments, Reviews, Comments, Credentials
-- ═══════════════════════════════════════════════════════════════════════════════

-- ─────────────────────────────────────────────────────────────────────────────
-- 1. DELIVERIES — Students submit work deliverables (files + messages)
-- ─────────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS deliveries (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id      UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  student_id    UUID NOT NULL,
  message       TEXT NOT NULL DEFAULT '',
  files         JSONB DEFAULT '[]'::jsonb,  -- [{ name, url, size, type }]
  version       INTEGER NOT NULL DEFAULT 1,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_deliveries_order_id ON deliveries(order_id);

-- ─────────────────────────────────────────────────────────────────────────────
-- 2. PAYMENTS — Tracks payment lifecycle (escrow → released)
-- ─────────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS payments (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id          UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  client_id         UUID NOT NULL,
  student_id        UUID NOT NULL,
  amount            NUMERIC(12,2) NOT NULL CHECK (amount > 0),
  platform_fee_pct  NUMERIC(5,2) NOT NULL DEFAULT 10.00,  -- platform % cut
  platform_fee      NUMERIC(12,2) NOT NULL DEFAULT 0,
  net_amount        NUMERIC(12,2) NOT NULL DEFAULT 0,      -- amount - fee
  currency          TEXT NOT NULL DEFAULT 'PHP',
  status            TEXT NOT NULL DEFAULT 'pending'
                      CHECK (status IN ('pending','held','released','refunded','disputed')),
  gateway           TEXT DEFAULT 'manual',                  -- 'paymongo','stripe','manual'
  gateway_payment_id TEXT,                                  -- external gateway reference
  paid_at           TIMESTAMPTZ,
  released_at       TIMESTAMPTZ,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_payments_order_id ON payments(order_id);
CREATE INDEX idx_payments_client_id ON payments(client_id);
CREATE INDEX idx_payments_student_id ON payments(student_id);

-- ─────────────────────────────────────────────────────────────────────────────
-- 3. REVIEWS — Client rates student after completion
-- ─────────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS reviews (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id      UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  gig_id        UUID NOT NULL REFERENCES gigs(id) ON DELETE CASCADE,
  reviewer_id   UUID NOT NULL,                  -- client user_id
  reviewee_id   UUID NOT NULL,                  -- student user_id
  rating        INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  comment       TEXT DEFAULT '',
  is_public     BOOLEAN NOT NULL DEFAULT true,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_reviews_gig_id ON reviews(gig_id);
CREATE INDEX idx_reviews_student_id ON reviews(reviewee_id);
CREATE INDEX idx_reviews_order_id ON reviews(order_id);

-- ─────────────────────────────────────────────────────────────────────────────
-- 4. GIG COMMENTS — Community comments on gigs with likes
-- ─────────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS gig_comments (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  gig_id        UUID NOT NULL REFERENCES gigs(id) ON DELETE CASCADE,
  user_id       UUID NOT NULL,
  content       TEXT NOT NULL CHECK (char_length(content) >= 1),
  parent_id     UUID REFERENCES gig_comments(id) ON DELETE CASCADE,  -- for replies
  is_edited     BOOLEAN NOT NULL DEFAULT false,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_gig_comments_gig_id ON gig_comments(gig_id);
CREATE INDEX idx_gig_comments_parent_id ON gig_comments(parent_id);

-- Comment likes (many-to-many)
CREATE TABLE IF NOT EXISTS comment_likes (
  comment_id  UUID NOT NULL REFERENCES gig_comments(id) ON DELETE CASCADE,
  user_id     UUID NOT NULL,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (comment_id, user_id)
);

-- ─────────────────────────────────────────────────────────────────────────────
-- 5. STUDENT CREDENTIALS — Certificates, awards, achievements
-- ─────────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS credentials (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id      UUID NOT NULL,
  title           TEXT NOT NULL,
  issuer          TEXT DEFAULT '',              -- who issued (e.g. Coursera, University)
  description     TEXT DEFAULT '',
  category        TEXT DEFAULT 'certificate'
                    CHECK (category IN ('certificate','award','badge','license','other')),
  file_url        TEXT,                         -- uploaded certificate image/pdf
  thumbnail_url   TEXT,                         -- smaller preview
  extracted_text  TEXT,                         -- OCR/AI extracted text from file
  ai_verified     BOOLEAN NOT NULL DEFAULT false,
  ai_confidence   NUMERIC(5,2) DEFAULT 0,       -- 0-100 confidence score
  ai_analysis     JSONB DEFAULT '{}'::jsonb,    -- full AI analysis result
  validity_score  NUMERIC(5,2) DEFAULT 0,       -- 0-100 composite validity score
  is_verified     BOOLEAN NOT NULL DEFAULT false,-- manually verified by admin
  is_public       BOOLEAN NOT NULL DEFAULT true,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_credentials_student_id ON credentials(student_id);
CREATE INDEX idx_credentials_category ON credentials(category);

-- ─────────────────────────────────────────────────────────────────────────────
-- 6. STUDENT CREDENTIAL SCORE — cached aggregate for filtering
-- ─────────────────────────────────────────────────────────────────────────────
ALTER TABLE student_profiles
  ADD COLUMN IF NOT EXISTS credential_score NUMERIC(5,2) DEFAULT 0,
  ADD COLUMN IF NOT EXISTS credential_count INTEGER DEFAULT 0;

-- ─────────────────────────────────────────────────────────────────────────────
-- 7. GIGS — ensure review aggregation columns exist
-- ─────────────────────────────────────────────────────────────────────────────
ALTER TABLE gigs
  ADD COLUMN IF NOT EXISTS avg_rating NUMERIC(3,2) DEFAULT 0,
  ADD COLUMN IF NOT EXISTS total_ratings INTEGER DEFAULT 0;

-- ─────────────────────────────────────────────────────────────────────────────
-- 8. STORAGE BUCKETS — for delivery files and credentials
-- ─────────────────────────────────────────────────────────────────────────────
-- NOTE: Run these in Supabase Dashboard SQL Editor if storage API not available
-- INSERT INTO storage.buckets (id, name, public) VALUES ('deliveries', 'deliveries', true) ON CONFLICT DO NOTHING;
-- INSERT INTO storage.buckets (id, name, public) VALUES ('credentials', 'credentials', true) ON CONFLICT DO NOTHING;

-- ─────────────────────────────────────────────────────────────────────────────
-- 9. FUNCTION: recalculate_gig_ratings — updates avg_rating + total_ratings
-- ─────────────────────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION recalculate_gig_ratings(p_gig_id UUID)
RETURNS void AS $$
DECLARE
  v_avg   NUMERIC(3,2);
  v_count INTEGER;
BEGIN
  SELECT COALESCE(AVG(rating), 0), COUNT(*)
    INTO v_avg, v_count
    FROM reviews
   WHERE gig_id = p_gig_id;

  UPDATE gigs
     SET avg_rating = v_avg,
         total_ratings = v_count,
         rating = v_avg,
         total_reviews = v_count
   WHERE id = p_gig_id;
END;
$$ LANGUAGE plpgsql;

-- ─────────────────────────────────────────────────────────────────────────────
-- 10. FUNCTION: recalculate_credential_score — aggregates student credential quality
-- ─────────────────────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION recalculate_credential_score(p_student_id UUID)
RETURNS void AS $$
DECLARE
  v_score  NUMERIC(5,2);
  v_count  INTEGER;
BEGIN
  SELECT
    COALESCE(ROUND(AVG(validity_score), 2), 0),
    COUNT(*)
    INTO v_score, v_count
    FROM credentials
   WHERE student_id = p_student_id
     AND is_public = true;

  UPDATE student_profiles
     SET credential_score = v_score,
         credential_count = v_count
   WHERE user_id = p_student_id;
END;
$$ LANGUAGE plpgsql;

-- ─────────────────────────────────────────────────────────────────────────────
-- 11. TRIGGER: auto-update gig ratings when a review is inserted
-- ─────────────────────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION trigger_recalculate_gig_ratings()
RETURNS trigger AS $$
BEGIN
  PERFORM recalculate_gig_ratings(NEW.gig_id);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_recalculate_gig_ratings ON reviews;
CREATE TRIGGER trg_recalculate_gig_ratings
  AFTER INSERT OR UPDATE ON reviews
  FOR EACH ROW EXECUTE FUNCTION trigger_recalculate_gig_ratings();

-- ─────────────────────────────────────────────────────────────────────────────
-- 12. TRIGGER: auto-update credential score when credentials change
-- ─────────────────────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION trigger_recalculate_credential_score()
RETURNS trigger AS $$
BEGIN
  IF TG_OP = 'DELETE' THEN
    PERFORM recalculate_credential_score(OLD.student_id);
  ELSE
    PERFORM recalculate_credential_score(NEW.student_id);
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_recalculate_credential_score ON credentials;
CREATE TRIGGER trg_recalculate_credential_score
  AFTER INSERT OR UPDATE OR DELETE ON credentials
  FOR EACH ROW EXECUTE FUNCTION trigger_recalculate_credential_score();