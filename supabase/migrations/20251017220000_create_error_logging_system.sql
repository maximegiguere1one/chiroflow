/*
  # Create error logging and monitoring system

  1. New Tables
    - `error_logs`
      - `id` (uuid, primary key)
      - `error_code` (text, indexed)
      - `message` (text)
      - `stack` (text)
      - `user_id` (uuid, nullable)
      - `session_id` (text, nullable)
      - `context` (jsonb)
      - `severity` (text)
      - `created_at` (timestamptz)
      - `resolved_at` (timestamptz, nullable)
      - `resolved_by` (uuid, nullable)

    - `performance_metrics`
      - `id` (uuid, primary key)
      - `metric_name` (text, indexed)
      - `duration_ms` (numeric)
      - `metadata` (jsonb)
      - `user_id` (uuid, nullable)
      - `created_at` (timestamptz)

    - `system_health_checks`
      - `id` (uuid, primary key)
      - `check_name` (text)
      - `status` (text)
      - `details` (jsonb)
      - `checked_at` (timestamptz)

  2. Security
    - Enable RLS on all tables
    - Admin-only write policies
    - System can insert anonymously for error logging
*/

-- Error Logs Table
CREATE TABLE IF NOT EXISTS error_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  error_code text NOT NULL,
  message text NOT NULL,
  stack text,
  user_id uuid REFERENCES auth.users(id),
  session_id text,
  context jsonb DEFAULT '{}'::jsonb,
  severity text NOT NULL CHECK (severity IN ('low', 'medium', 'high', 'critical')),
  created_at timestamptz DEFAULT now(),
  resolved_at timestamptz,
  resolved_by uuid REFERENCES auth.users(id)
);

CREATE INDEX IF NOT EXISTS idx_error_logs_code ON error_logs(error_code);
CREATE INDEX IF NOT EXISTS idx_error_logs_severity ON error_logs(severity);
CREATE INDEX IF NOT EXISTS idx_error_logs_created_at ON error_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_error_logs_user_id ON error_logs(user_id) WHERE user_id IS NOT NULL;

-- Performance Metrics Table
CREATE TABLE IF NOT EXISTS performance_metrics (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  metric_name text NOT NULL,
  duration_ms numeric NOT NULL,
  metadata jsonb DEFAULT '{}'::jsonb,
  user_id uuid REFERENCES auth.users(id),
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_perf_metrics_name ON performance_metrics(metric_name);
CREATE INDEX IF NOT EXISTS idx_perf_metrics_created_at ON performance_metrics(created_at DESC);

-- System Health Checks Table
CREATE TABLE IF NOT EXISTS system_health_checks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  check_name text NOT NULL,
  status text NOT NULL CHECK (status IN ('healthy', 'degraded', 'unhealthy')),
  details jsonb DEFAULT '{}'::jsonb,
  checked_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_health_checks_name ON system_health_checks(check_name);
CREATE INDEX IF NOT EXISTS idx_health_checks_checked_at ON system_health_checks(checked_at DESC);

-- Enable RLS
ALTER TABLE error_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE performance_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE system_health_checks ENABLE ROW LEVEL SECURITY;

-- Error Logs Policies
CREATE POLICY "Authenticated users can view their own error logs"
  ON error_logs
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id OR auth.uid() IN (
    SELECT id FROM auth.users WHERE raw_app_meta_data->>'role' = 'admin'
  ));

CREATE POLICY "Admins can view all error logs"
  ON error_logs
  FOR SELECT
  TO authenticated
  USING (auth.uid() IN (
    SELECT id FROM auth.users WHERE raw_app_meta_data->>'role' = 'admin'
  ));

CREATE POLICY "System can insert error logs"
  ON error_logs
  FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

CREATE POLICY "Admins can update error logs"
  ON error_logs
  FOR UPDATE
  TO authenticated
  USING (auth.uid() IN (
    SELECT id FROM auth.users WHERE raw_app_meta_data->>'role' = 'admin'
  ))
  WITH CHECK (auth.uid() IN (
    SELECT id FROM auth.users WHERE raw_app_meta_data->>'role' = 'admin'
  ));

-- Performance Metrics Policies
CREATE POLICY "Admins can view all performance metrics"
  ON performance_metrics
  FOR SELECT
  TO authenticated
  USING (auth.uid() IN (
    SELECT id FROM auth.users WHERE raw_app_meta_data->>'role' = 'admin'
  ));

CREATE POLICY "System can insert performance metrics"
  ON performance_metrics
  FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

-- System Health Checks Policies
CREATE POLICY "Admins can view health checks"
  ON system_health_checks
  FOR SELECT
  TO authenticated
  USING (auth.uid() IN (
    SELECT id FROM auth.users WHERE raw_app_meta_data->>'role' = 'admin'
  ));

CREATE POLICY "System can insert health checks"
  ON system_health_checks
  FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

-- Create view for error analytics
CREATE OR REPLACE VIEW error_analytics AS
SELECT
  error_code,
  severity,
  COUNT(*) as occurrence_count,
  MAX(created_at) as last_occurred,
  MIN(created_at) as first_occurred,
  COUNT(DISTINCT user_id) as affected_users,
  AVG(CASE WHEN resolved_at IS NOT NULL
    THEN EXTRACT(EPOCH FROM (resolved_at - created_at))/60
    ELSE NULL END) as avg_resolution_time_minutes
FROM error_logs
WHERE created_at > NOW() - INTERVAL '30 days'
GROUP BY error_code, severity
ORDER BY occurrence_count DESC;

-- Create view for performance analytics
CREATE OR REPLACE VIEW performance_analytics AS
SELECT
  metric_name,
  COUNT(*) as measurement_count,
  AVG(duration_ms) as avg_duration_ms,
  MIN(duration_ms) as min_duration_ms,
  MAX(duration_ms) as max_duration_ms,
  PERCENTILE_CONT(0.5) WITHIN GROUP (ORDER BY duration_ms) as median_duration_ms,
  PERCENTILE_CONT(0.95) WITHIN GROUP (ORDER BY duration_ms) as p95_duration_ms,
  PERCENTILE_CONT(0.99) WITHIN GROUP (ORDER BY duration_ms) as p99_duration_ms
FROM performance_metrics
WHERE created_at > NOW() - INTERVAL '24 hours'
GROUP BY metric_name
ORDER BY avg_duration_ms DESC;

-- Grant select on views to authenticated users
GRANT SELECT ON error_analytics TO authenticated;
GRANT SELECT ON performance_analytics TO authenticated;

-- Function to cleanup old logs (run periodically)
CREATE OR REPLACE FUNCTION cleanup_old_logs()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Delete error logs older than 90 days (except critical)
  DELETE FROM error_logs
  WHERE created_at < NOW() - INTERVAL '90 days'
    AND severity != 'critical';

  -- Delete performance metrics older than 30 days
  DELETE FROM performance_metrics
  WHERE created_at < NOW() - INTERVAL '30 days';

  -- Delete health checks older than 7 days
  DELETE FROM system_health_checks
  WHERE checked_at < NOW() - INTERVAL '7 days';
END;
$$;
