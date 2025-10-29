/*
  # Rate Limiting System
  
  ## Overview
  Comprehensive rate limiting to prevent abuse on sensitive endpoints including
  login attempts, payment processing, email sending, and API access.
  
  ## New Tables
  
  ### `rate_limit_rules`
  Configurable rate limiting rules
  - `id` (uuid, primary key)
  - `rule_name` (text, unique) - Unique identifier
  - `description` (text) - Rule purpose
  - `endpoint_pattern` (text) - Regex pattern for matching endpoints
  - `limit_type` (text) - ip, user, email, global
  - `requests_allowed` (integer) - Number of requests allowed
  - `window_seconds` (integer) - Time window in seconds
  - `block_duration_seconds` (integer) - How long to block after exceeding
  - `is_active` (boolean) - Whether rule is active
  - `created_at` (timestamptz)
  - `updated_at` (timestamptz)
  
  ### `rate_limit_attempts`
  Tracks individual requests for rate limiting
  - `id` (uuid, primary key)
  - `rule_id` (uuid) - Which rule was checked
  - `identifier` (text) - IP address, user ID, or email
  - `identifier_type` (text) - ip, user, email
  - `endpoint` (text) - Endpoint accessed
  - `request_count` (integer) - Number of requests in window
  - `window_start` (timestamptz) - Start of current window
  - `window_end` (timestamptz) - End of current window
  - `is_blocked` (boolean) - Whether identifier is blocked
  - `blocked_until` (timestamptz) - When block expires
  - `last_request_at` (timestamptz) - Most recent request
  - `created_at` (timestamptz)
  - `updated_at` (timestamptz)
  
  ### `rate_limit_violations`
  Audit log of rate limit violations
  - `id` (uuid, primary key)
  - `rule_id` (uuid) - Which rule was violated
  - `identifier` (text) - Who violated
  - `identifier_type` (text) - Type of identifier
  - `endpoint` (text) - Which endpoint
  - `request_count` (integer) - How many requests made
  - `window_seconds` (integer) - Time window
  - `violation_time` (timestamptz) - When violation occurred
  - `ip_address` (text) - Request IP
  - `user_agent` (text) - Browser/client info
  - `request_metadata` (jsonb) - Additional context
  - `created_at` (timestamptz)
  
  ## Security
  - RLS enabled on all tables
  - Admins can manage rules
  - System can insert attempts and violations
  - Audit trail is immutable
*/

-- ============================================================================
-- RATE LIMIT RULES TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS rate_limit_rules (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  rule_name text UNIQUE NOT NULL,
  description text NOT NULL,
  endpoint_pattern text NOT NULL,
  limit_type text NOT NULL CHECK (limit_type IN ('ip', 'user', 'email', 'global')),
  requests_allowed integer NOT NULL CHECK (requests_allowed > 0),
  window_seconds integer NOT NULL CHECK (window_seconds > 0),
  block_duration_seconds integer NOT NULL DEFAULT 3600 CHECK (block_duration_seconds >= 0),
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- ============================================================================
-- RATE LIMIT ATTEMPTS TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS rate_limit_attempts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  rule_id uuid NOT NULL REFERENCES rate_limit_rules(id) ON DELETE CASCADE,
  identifier text NOT NULL,
  identifier_type text NOT NULL CHECK (identifier_type IN ('ip', 'user', 'email', 'global')),
  endpoint text NOT NULL,
  request_count integer DEFAULT 1,
  window_start timestamptz DEFAULT now(),
  window_end timestamptz NOT NULL,
  is_blocked boolean DEFAULT false,
  blocked_until timestamptz,
  last_request_at timestamptz DEFAULT now(),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  CONSTRAINT unique_rule_identifier_window UNIQUE (rule_id, identifier, window_start)
);

-- ============================================================================
-- RATE LIMIT VIOLATIONS TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS rate_limit_violations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  rule_id uuid NOT NULL REFERENCES rate_limit_rules(id) ON DELETE CASCADE,
  identifier text NOT NULL,
  identifier_type text NOT NULL,
  endpoint text NOT NULL,
  request_count integer NOT NULL,
  window_seconds integer NOT NULL,
  violation_time timestamptz DEFAULT now(),
  ip_address text,
  user_agent text,
  request_metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now()
);

-- ============================================================================
-- INDEXES FOR PERFORMANCE
-- ============================================================================

CREATE INDEX IF NOT EXISTS idx_rate_rules_active ON rate_limit_rules(is_active) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_rate_attempts_identifier ON rate_limit_attempts(identifier, identifier_type);
CREATE INDEX IF NOT EXISTS idx_rate_attempts_window ON rate_limit_attempts(window_start, window_end);
CREATE INDEX IF NOT EXISTS idx_rate_attempts_blocked ON rate_limit_attempts(is_blocked, blocked_until) WHERE is_blocked = true;
CREATE INDEX IF NOT EXISTS idx_rate_violations_time ON rate_limit_violations(violation_time);
CREATE INDEX IF NOT EXISTS idx_rate_violations_identifier ON rate_limit_violations(identifier);

-- ============================================================================
-- ROW LEVEL SECURITY
-- ============================================================================

ALTER TABLE rate_limit_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE rate_limit_attempts ENABLE ROW LEVEL SECURITY;
ALTER TABLE rate_limit_violations ENABLE ROW LEVEL SECURITY;

-- Admins can manage rate limit rules
CREATE POLICY "Admins can manage rate limit rules"
  ON rate_limit_rules FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- System can manage rate limit attempts
CREATE POLICY "System can manage rate limit attempts"
  ON rate_limit_attempts FOR ALL
  TO authenticated, anon
  USING (true)
  WITH CHECK (true);

-- Admins can view attempts
CREATE POLICY "Admins can view rate limit attempts"
  ON rate_limit_attempts FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- System can insert violations
CREATE POLICY "System can insert violations"
  ON rate_limit_violations FOR INSERT
  TO authenticated, anon
  WITH CHECK (true);

-- Admins can view violations
CREATE POLICY "Admins can view violations"
  ON rate_limit_violations FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- ============================================================================
-- TRIGGERS
-- ============================================================================

CREATE TRIGGER update_rate_limit_rules_updated_at
  BEFORE UPDATE ON rate_limit_rules
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_rate_limit_attempts_updated_at
  BEFORE UPDATE ON rate_limit_attempts
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();

-- ============================================================================
-- RATE LIMITING FUNCTION
-- ============================================================================

CREATE OR REPLACE FUNCTION check_rate_limit(
  p_identifier text,
  p_identifier_type text,
  p_endpoint text,
  p_ip_address text DEFAULT NULL,
  p_user_agent text DEFAULT NULL
)
RETURNS jsonb AS $$
DECLARE
  v_rule record;
  v_attempt record;
  v_now timestamptz := now();
  v_result jsonb;
BEGIN
  -- Find matching active rule
  SELECT * INTO v_rule
  FROM rate_limit_rules
  WHERE is_active = true
    AND p_endpoint ~ endpoint_pattern
    AND limit_type = p_identifier_type
  ORDER BY requests_allowed ASC
  LIMIT 1;

  -- If no rule found, allow request
  IF v_rule IS NULL THEN
    RETURN jsonb_build_object(
      'allowed', true,
      'rule_matched', false
    );
  END IF;

  -- Check for existing attempt in current window
  SELECT * INTO v_attempt
  FROM rate_limit_attempts
  WHERE rule_id = v_rule.id
    AND identifier = p_identifier
    AND window_end > v_now
  ORDER BY window_start DESC
  LIMIT 1;

  -- Check if currently blocked
  IF v_attempt IS NOT NULL AND v_attempt.is_blocked AND v_attempt.blocked_until > v_now THEN
    RETURN jsonb_build_object(
      'allowed', false,
      'blocked', true,
      'blocked_until', v_attempt.blocked_until,
      'rule_name', v_rule.rule_name,
      'message', format('Rate limit exceeded. Blocked until %s', v_attempt.blocked_until)
    );
  END IF;

  -- If no attempt or window expired, create new window
  IF v_attempt IS NULL OR v_attempt.window_end <= v_now THEN
    INSERT INTO rate_limit_attempts (
      rule_id,
      identifier,
      identifier_type,
      endpoint,
      request_count,
      window_start,
      window_end
    ) VALUES (
      v_rule.id,
      p_identifier,
      p_identifier_type,
      p_endpoint,
      1,
      v_now,
      v_now + make_interval(secs => v_rule.window_seconds)
    );

    RETURN jsonb_build_object(
      'allowed', true,
      'requests_remaining', v_rule.requests_allowed - 1,
      'window_reset', v_now + make_interval(secs => v_rule.window_seconds)
    );
  END IF;

  -- Increment request count
  UPDATE rate_limit_attempts
  SET 
    request_count = request_count + 1,
    last_request_at = v_now
  WHERE id = v_attempt.id
  RETURNING * INTO v_attempt;

  -- Check if limit exceeded
  IF v_attempt.request_count > v_rule.requests_allowed THEN
    -- Block the identifier
    UPDATE rate_limit_attempts
    SET 
      is_blocked = true,
      blocked_until = v_now + make_interval(secs => v_rule.block_duration_seconds)
    WHERE id = v_attempt.id;

    -- Log violation
    INSERT INTO rate_limit_violations (
      rule_id,
      identifier,
      identifier_type,
      endpoint,
      request_count,
      window_seconds,
      ip_address,
      user_agent
    ) VALUES (
      v_rule.id,
      p_identifier,
      p_identifier_type,
      p_endpoint,
      v_attempt.request_count,
      v_rule.window_seconds,
      p_ip_address,
      p_user_agent
    );

    RETURN jsonb_build_object(
      'allowed', false,
      'blocked', true,
      'blocked_until', v_now + make_interval(secs => v_rule.block_duration_seconds),
      'rule_name', v_rule.rule_name,
      'message', format('Rate limit exceeded. Try again in %s seconds', v_rule.block_duration_seconds)
    );
  END IF;

  -- Request allowed
  RETURN jsonb_build_object(
    'allowed', true,
    'requests_remaining', v_rule.requests_allowed - v_attempt.request_count,
    'window_reset', v_attempt.window_end
  );
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- DEFAULT RATE LIMIT RULES
-- ============================================================================

INSERT INTO rate_limit_rules (rule_name, description, endpoint_pattern, limit_type, requests_allowed, window_seconds, block_duration_seconds) VALUES
(
  'login_attempts_ip',
  'Limit login attempts per IP address',
  '.*/(auth|login|signin).*',
  'ip',
  5,
  300,
  900
),
(
  'login_attempts_email',
  'Limit login attempts per email',
  '.*/(auth|login|signin).*',
  'email',
  3,
  300,
  1800
),
(
  'password_reset_email',
  'Limit password reset requests per email',
  '.*/password-reset.*',
  'email',
  3,
  3600,
  7200
),
(
  'email_sending_global',
  'Global email sending rate limit',
  '.*/send-email.*',
  'global',
  100,
  60,
  300
),
(
  'payment_processing_user',
  'Limit payment processing per user',
  '.*/process-payment.*',
  'user',
  5,
  60,
  1800
),
(
  'api_general_ip',
  'General API rate limit per IP',
  '.*',
  'ip',
  1000,
  3600,
  3600
)
ON CONFLICT (rule_name) DO NOTHING;

-- ============================================================================
-- CLEANUP FUNCTION
-- ============================================================================

CREATE OR REPLACE FUNCTION cleanup_old_rate_limit_data()
RETURNS void AS $$
BEGIN
  -- Delete old attempts (older than 7 days)
  DELETE FROM rate_limit_attempts
  WHERE created_at < now() - interval '7 days';

  -- Delete old violations (older than 30 days)
  DELETE FROM rate_limit_violations
  WHERE created_at < now() - interval '30 days';
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- COMMENTS
-- ============================================================================

COMMENT ON TABLE rate_limit_rules IS 
  'Configurable rate limiting rules for different endpoints and identifier types';

COMMENT ON TABLE rate_limit_attempts IS 
  'Tracks request attempts for rate limiting enforcement';

COMMENT ON TABLE rate_limit_violations IS 
  'Immutable audit log of rate limit violations for security monitoring';

COMMENT ON FUNCTION check_rate_limit(text, text, text, text, text) IS 
  'Main rate limiting function. Returns allowed status and remaining quota.';

COMMENT ON FUNCTION cleanup_old_rate_limit_data() IS 
  'Cleanup function to remove old rate limiting data. Run periodically via cron.';
