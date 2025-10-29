/*
  # Two-Factor Authentication (2FA) System
  
  ## Overview
  Comprehensive 2FA system supporting TOTP (Time-based One-Time Passwords)
  for admin and practitioner accounts with backup codes and recovery options.
  
  ## New Tables
  
  ### `user_2fa_settings`
  Stores 2FA configuration for each user
  - `id` (uuid, primary key)
  - `user_id` (uuid, unique) - Reference to auth.users
  - `is_enabled` (boolean) - Whether 2FA is active
  - `method` (text) - totp, sms, email
  - `totp_secret` (text) - Encrypted TOTP secret key
  - `backup_codes` (text[]) - Hashed backup recovery codes
  - `phone_number` (text) - For SMS 2FA
  - `verified_at` (timestamptz) - When 2FA was verified
  - `last_used_at` (timestamptz) - Last successful 2FA
  - `created_at` (timestamptz)
  - `updated_at` (timestamptz)
  
  ### `user_2fa_attempts`
  Tracks 2FA verification attempts
  - `id` (uuid, primary key)
  - `user_id` (uuid) - User attempting verification
  - `attempt_type` (text) - totp, backup_code, sms
  - `success` (boolean) - Whether attempt succeeded
  - `ip_address` (text) - Request IP
  - `user_agent` (text) - Browser/client info
  - `attempted_at` (timestamptz) - When attempt was made
  - `failure_reason` (text) - Why attempt failed
  - `created_at` (timestamptz)
  
  ### `user_trusted_devices`
  Remembers trusted devices to skip 2FA
  - `id` (uuid, primary key)
  - `user_id` (uuid) - Device owner
  - `device_fingerprint` (text) - Unique device identifier
  - `device_name` (text) - User-friendly device name
  - `ip_address` (text) - IP when device was trusted
  - `user_agent` (text) - Browser/client info
  - `last_used_at` (timestamptz) - Last time device was used
  - `expires_at` (timestamptz) - When trust expires (30 days)
  - `created_at` (timestamptz)
  
  ### `user_2fa_recovery_logs`
  Audit log for 2FA recovery actions
  - `id` (uuid, primary key)
  - `user_id` (uuid) - User who recovered
  - `recovery_method` (text) - backup_code, admin_reset, support_ticket
  - `recovery_details` (jsonb) - Additional context
  - `performed_by` (uuid) - Admin who helped (if applicable)
  - `ip_address` (text) - Recovery request IP
  - `recovered_at` (timestamptz) - When recovery happened
  - `created_at` (timestamptz)
  
  ## Security Features
  - TOTP secrets encrypted at rest
  - Backup codes hashed (bcrypt-style)
  - Rate limiting on verification attempts
  - Trusted device management with expiry
  - Comprehensive audit logging
  - Admin override capability for account recovery
  
  ## Security
  - RLS enabled on all tables
  - Users can only access their own 2FA settings
  - Admins can view all settings for support
  - Audit logs are immutable
*/

-- ============================================================================
-- USER 2FA SETTINGS TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS user_2fa_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid UNIQUE NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  is_enabled boolean DEFAULT false,
  method text NOT NULL DEFAULT 'totp' CHECK (method IN ('totp', 'sms', 'email')),
  totp_secret text,
  backup_codes text[],
  phone_number text,
  verified_at timestamptz,
  last_used_at timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- ============================================================================
-- USER 2FA ATTEMPTS TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS user_2fa_attempts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  attempt_type text NOT NULL CHECK (attempt_type IN ('totp', 'backup_code', 'sms', 'email')),
  success boolean DEFAULT false,
  ip_address text,
  user_agent text,
  attempted_at timestamptz DEFAULT now(),
  failure_reason text,
  created_at timestamptz DEFAULT now()
);

-- ============================================================================
-- USER TRUSTED DEVICES TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS user_trusted_devices (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  device_fingerprint text NOT NULL,
  device_name text NOT NULL,
  ip_address text,
  user_agent text,
  last_used_at timestamptz DEFAULT now(),
  expires_at timestamptz NOT NULL DEFAULT (now() + interval '30 days'),
  created_at timestamptz DEFAULT now(),
  CONSTRAINT unique_user_device UNIQUE (user_id, device_fingerprint)
);

-- ============================================================================
-- USER 2FA RECOVERY LOGS TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS user_2fa_recovery_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  recovery_method text NOT NULL CHECK (recovery_method IN ('backup_code', 'admin_reset', 'support_ticket')),
  recovery_details jsonb DEFAULT '{}'::jsonb,
  performed_by uuid REFERENCES auth.users(id),
  ip_address text,
  recovered_at timestamptz DEFAULT now(),
  created_at timestamptz DEFAULT now()
);

-- ============================================================================
-- INDEXES FOR PERFORMANCE
-- ============================================================================

CREATE INDEX IF NOT EXISTS idx_2fa_settings_user ON user_2fa_settings(user_id);
CREATE INDEX IF NOT EXISTS idx_2fa_settings_enabled ON user_2fa_settings(is_enabled) WHERE is_enabled = true;
CREATE INDEX IF NOT EXISTS idx_2fa_attempts_user ON user_2fa_attempts(user_id);
CREATE INDEX IF NOT EXISTS idx_2fa_attempts_time ON user_2fa_attempts(attempted_at);
CREATE INDEX IF NOT EXISTS idx_trusted_devices_user ON user_trusted_devices(user_id);
CREATE INDEX IF NOT EXISTS idx_trusted_devices_fingerprint ON user_trusted_devices(device_fingerprint);
CREATE INDEX IF NOT EXISTS idx_trusted_devices_expires ON user_trusted_devices(expires_at);
CREATE INDEX IF NOT EXISTS idx_2fa_recovery_user ON user_2fa_recovery_logs(user_id);

-- ============================================================================
-- ROW LEVEL SECURITY
-- ============================================================================

ALTER TABLE user_2fa_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_2fa_attempts ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_trusted_devices ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_2fa_recovery_logs ENABLE ROW LEVEL SECURITY;

-- Users can view and update their own 2FA settings
CREATE POLICY "Users can view own 2FA settings"
  ON user_2fa_settings FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Users can update own 2FA settings"
  ON user_2fa_settings FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can insert own 2FA settings"
  ON user_2fa_settings FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

-- Admins can view all 2FA settings for support
CREATE POLICY "Admins can view all 2FA settings"
  ON user_2fa_settings FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- Users can view their own 2FA attempts
CREATE POLICY "Users can view own 2FA attempts"
  ON user_2fa_attempts FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

-- System can insert 2FA attempts
CREATE POLICY "System can insert 2FA attempts"
  ON user_2fa_attempts FOR INSERT
  TO authenticated, anon
  WITH CHECK (true);

-- Admins can view all attempts
CREATE POLICY "Admins can view all 2FA attempts"
  ON user_2fa_attempts FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- Users can manage their trusted devices
CREATE POLICY "Users can manage own trusted devices"
  ON user_trusted_devices FOR ALL
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- Users can view their own recovery logs
CREATE POLICY "Users can view own recovery logs"
  ON user_2fa_recovery_logs FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

-- Admins can view all recovery logs
CREATE POLICY "Admins can view all recovery logs"
  ON user_2fa_recovery_logs FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- System can insert recovery logs
CREATE POLICY "System can insert recovery logs"
  ON user_2fa_recovery_logs FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- ============================================================================
-- TRIGGERS
-- ============================================================================

CREATE TRIGGER update_2fa_settings_updated_at
  BEFORE UPDATE ON user_2fa_settings
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();

-- ============================================================================
-- 2FA HELPER FUNCTIONS
-- ============================================================================

-- Function to check if user has 2FA enabled
CREATE OR REPLACE FUNCTION user_has_2fa_enabled(p_user_id uuid)
RETURNS boolean AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM user_2fa_settings
    WHERE user_id = p_user_id
    AND is_enabled = true
    AND verified_at IS NOT NULL
  );
END;
$$ LANGUAGE plpgsql STABLE;

-- Function to check if device is trusted
CREATE OR REPLACE FUNCTION is_device_trusted(
  p_user_id uuid,
  p_device_fingerprint text
)
RETURNS boolean AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM user_trusted_devices
    WHERE user_id = p_user_id
    AND device_fingerprint = p_device_fingerprint
    AND expires_at > now()
  );
END;
$$ LANGUAGE plpgsql STABLE;

-- Function to record 2FA attempt
CREATE OR REPLACE FUNCTION record_2fa_attempt(
  p_user_id uuid,
  p_attempt_type text,
  p_success boolean,
  p_ip_address text DEFAULT NULL,
  p_user_agent text DEFAULT NULL,
  p_failure_reason text DEFAULT NULL
)
RETURNS uuid AS $$
DECLARE
  v_attempt_id uuid;
BEGIN
  INSERT INTO user_2fa_attempts (
    user_id,
    attempt_type,
    success,
    ip_address,
    user_agent,
    failure_reason
  ) VALUES (
    p_user_id,
    p_attempt_type,
    p_success,
    p_ip_address,
    p_user_agent,
    p_failure_reason
  )
  RETURNING id INTO v_attempt_id;

  -- Update last_used_at if successful
  IF p_success THEN
    UPDATE user_2fa_settings
    SET last_used_at = now()
    WHERE user_id = p_user_id;
  END IF;

  RETURN v_attempt_id;
END;
$$ LANGUAGE plpgsql;

-- Function to trust a device
CREATE OR REPLACE FUNCTION trust_device(
  p_user_id uuid,
  p_device_fingerprint text,
  p_device_name text,
  p_ip_address text DEFAULT NULL,
  p_user_agent text DEFAULT NULL,
  p_days_valid integer DEFAULT 30
)
RETURNS uuid AS $$
DECLARE
  v_device_id uuid;
BEGIN
  INSERT INTO user_trusted_devices (
    user_id,
    device_fingerprint,
    device_name,
    ip_address,
    user_agent,
    expires_at
  ) VALUES (
    p_user_id,
    p_device_fingerprint,
    p_device_name,
    p_ip_address,
    p_user_agent,
    now() + make_interval(days => p_days_valid)
  )
  ON CONFLICT (user_id, device_fingerprint)
  DO UPDATE SET
    last_used_at = now(),
    expires_at = now() + make_interval(days => p_days_valid)
  RETURNING id INTO v_device_id;

  RETURN v_device_id;
END;
$$ LANGUAGE plpgsql;

-- Function to revoke trusted device
CREATE OR REPLACE FUNCTION revoke_trusted_device(
  p_user_id uuid,
  p_device_id uuid
)
RETURNS boolean AS $$
BEGIN
  DELETE FROM user_trusted_devices
  WHERE id = p_device_id
  AND user_id = p_user_id;

  RETURN FOUND;
END;
$$ LANGUAGE plpgsql;

-- Function to generate backup codes (returns 10 codes)
CREATE OR REPLACE FUNCTION generate_backup_codes()
RETURNS text[] AS $$
DECLARE
  v_codes text[];
  v_code text;
  i integer;
BEGIN
  v_codes := ARRAY[]::text[];
  
  FOR i IN 1..10 LOOP
    -- Generate 8-character alphanumeric code
    v_code := upper(substring(md5(random()::text || clock_timestamp()::text) from 1 for 8));
    v_codes := array_append(v_codes, v_code);
  END LOOP;

  RETURN v_codes;
END;
$$ LANGUAGE plpgsql;

-- Function to cleanup expired trusted devices
CREATE OR REPLACE FUNCTION cleanup_expired_trusted_devices()
RETURNS integer AS $$
DECLARE
  v_deleted_count integer;
BEGIN
  DELETE FROM user_trusted_devices
  WHERE expires_at < now();

  GET DIAGNOSTICS v_deleted_count = ROW_COUNT;
  RETURN v_deleted_count;
END;
$$ LANGUAGE plpgsql;

-- Function to check recent failed attempts (for rate limiting)
CREATE OR REPLACE FUNCTION check_2fa_failed_attempts(
  p_user_id uuid,
  p_minutes integer DEFAULT 15,
  p_max_attempts integer DEFAULT 5
)
RETURNS jsonb AS $$
DECLARE
  v_failed_count integer;
  v_is_locked boolean;
BEGIN
  SELECT COUNT(*) INTO v_failed_count
  FROM user_2fa_attempts
  WHERE user_id = p_user_id
    AND success = false
    AND attempted_at > now() - make_interval(mins => p_minutes);

  v_is_locked := v_failed_count >= p_max_attempts;

  RETURN jsonb_build_object(
    'failed_attempts', v_failed_count,
    'is_locked', v_is_locked,
    'max_attempts', p_max_attempts,
    'window_minutes', p_minutes,
    'attempts_remaining', GREATEST(0, p_max_attempts - v_failed_count)
  );
END;
$$ LANGUAGE plpgsql STABLE;

-- ============================================================================
-- INITIALIZE 2FA FOR ADMINS
-- ============================================================================

-- Create 2FA settings for existing admin users (disabled by default)
INSERT INTO user_2fa_settings (user_id, is_enabled, method)
SELECT 
  p.id,
  false,
  'totp'
FROM profiles p
WHERE p.role = 'admin'
  AND NOT EXISTS (
    SELECT 1 FROM user_2fa_settings
    WHERE user_id = p.id
  );

-- ============================================================================
-- COMMENTS
-- ============================================================================

COMMENT ON TABLE user_2fa_settings IS 
  'Stores 2FA configuration for users with encrypted secrets and backup codes';

COMMENT ON TABLE user_2fa_attempts IS 
  'Audit log of all 2FA verification attempts for security monitoring';

COMMENT ON TABLE user_trusted_devices IS 
  'Manages trusted devices that can skip 2FA for improved UX while maintaining security';

COMMENT ON TABLE user_2fa_recovery_logs IS 
  'Immutable audit trail of 2FA recovery actions for compliance and security review';

COMMENT ON FUNCTION user_has_2fa_enabled(uuid) IS 
  'Quick check if user has active verified 2FA';

COMMENT ON FUNCTION is_device_trusted(uuid, text) IS 
  'Checks if device is trusted and trust has not expired';

COMMENT ON FUNCTION record_2fa_attempt(uuid, text, boolean, text, text, text) IS 
  'Records a 2FA verification attempt with full context';

COMMENT ON FUNCTION trust_device(uuid, text, text, text, text, integer) IS 
  'Marks a device as trusted for the specified duration';

COMMENT ON FUNCTION check_2fa_failed_attempts(uuid, integer, integer) IS 
  'Checks if user has exceeded failed attempt threshold for rate limiting';
