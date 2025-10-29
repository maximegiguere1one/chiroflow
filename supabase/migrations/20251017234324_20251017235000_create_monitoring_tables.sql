/*
  # System Monitoring Tables

  ## Purpose
  Creates comprehensive system monitoring tables to track errors, performance metrics,
  and system health checks for operational visibility and debugging.

  ## New Tables

  ### 1. error_analytics
  - Aggregated error tracking and analytics
  - Groups errors by error code and severity
  - Tracks occurrence counts, affected users, resolution times
  - Helps identify recurring issues and patterns

  ### 2. performance_analytics
  - Performance metrics aggregation
  - Tracks execution times (avg, min, max, percentiles)
  - Monitors system performance across different operations
  - Enables performance optimization and capacity planning

  ### 3. system_health_checks
  - Periodic system health status checks
  - Records component health status (healthy, degraded, unhealthy)
  - Stores detailed check results for diagnostics
  - Enables proactive monitoring and alerting

  ## Security
  - RLS enabled on all tables
  - Admin-only access for viewing monitoring data
  - Automated systems can insert data via service role

  ## Performance
  - Indexed on timestamp columns for fast queries
  - Indexed on status/severity for filtering
  - Optimized for time-series data analysis
*/

-- Error Analytics Table
CREATE TABLE IF NOT EXISTS error_analytics (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  error_code text NOT NULL,
  error_message text,
  severity text NOT NULL DEFAULT 'error',
  occurrence_count integer DEFAULT 1,
  first_occurred timestamptz DEFAULT now(),
  last_occurred timestamptz DEFAULT now(),
  affected_users integer DEFAULT 0,
  avg_resolution_time_minutes numeric,
  stack_trace text,
  context jsonb,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  CONSTRAINT error_severity_check CHECK (
    severity IN ('info', 'warning', 'error', 'critical')
  )
);

ALTER TABLE error_analytics ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view error analytics"
  ON error_analytics FOR SELECT
  TO authenticated
  USING (auth.uid() IN (SELECT id FROM profiles WHERE role IN ('admin', 'practitioner')));

CREATE POLICY "Service role can manage error analytics"
  ON error_analytics FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Performance Analytics Table
CREATE TABLE IF NOT EXISTS performance_analytics (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  metric_name text NOT NULL,
  operation_type text,
  measurement_count integer DEFAULT 1,
  avg_duration_ms numeric NOT NULL,
  min_duration_ms numeric NOT NULL,
  max_duration_ms numeric NOT NULL,
  median_duration_ms numeric,
  p95_duration_ms numeric,
  p99_duration_ms numeric,
  success_count integer DEFAULT 0,
  failure_count integer DEFAULT 0,
  metadata jsonb,
  measured_at timestamptz DEFAULT now(),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE performance_analytics ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view performance analytics"
  ON performance_analytics FOR SELECT
  TO authenticated
  USING (auth.uid() IN (SELECT id FROM profiles WHERE role IN ('admin', 'practitioner')));

CREATE POLICY "Service role can manage performance analytics"
  ON performance_analytics FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- System Health Checks Table
CREATE TABLE IF NOT EXISTS system_health_checks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  check_name text NOT NULL,
  component text NOT NULL,
  status text NOT NULL DEFAULT 'healthy',
  response_time_ms numeric,
  details jsonb,
  error_message text,
  checked_at timestamptz DEFAULT now(),
  created_at timestamptz DEFAULT now(),
  CONSTRAINT health_status_check CHECK (
    status IN ('healthy', 'degraded', 'unhealthy', 'unknown')
  )
);

ALTER TABLE system_health_checks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view health checks"
  ON system_health_checks FOR SELECT
  TO authenticated
  USING (auth.uid() IN (SELECT id FROM profiles WHERE role IN ('admin', 'practitioner')));

CREATE POLICY "Service role can manage health checks"
  ON system_health_checks FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_error_analytics_code
  ON error_analytics(error_code);
CREATE INDEX IF NOT EXISTS idx_error_analytics_severity
  ON error_analytics(severity);
CREATE INDEX IF NOT EXISTS idx_error_analytics_occurred
  ON error_analytics(last_occurred DESC);

CREATE INDEX IF NOT EXISTS idx_performance_analytics_metric
  ON performance_analytics(metric_name);
CREATE INDEX IF NOT EXISTS idx_performance_analytics_measured
  ON performance_analytics(measured_at DESC);

CREATE INDEX IF NOT EXISTS idx_health_checks_component
  ON system_health_checks(component);
CREATE INDEX IF NOT EXISTS idx_health_checks_status
  ON system_health_checks(status);
CREATE INDEX IF NOT EXISTS idx_health_checks_checked
  ON system_health_checks(checked_at DESC);

-- Function to log errors
CREATE OR REPLACE FUNCTION log_error_analytics(
  p_error_code text,
  p_error_message text,
  p_severity text,
  p_stack_trace text DEFAULT NULL,
  p_context jsonb DEFAULT NULL
) RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_error_id uuid;
  v_existing record;
BEGIN
  -- Check if error already exists
  SELECT * INTO v_existing
  FROM error_analytics
  WHERE error_code = p_error_code
    AND last_occurred > now() - interval '1 hour';

  IF FOUND THEN
    -- Update existing error
    UPDATE error_analytics
    SET
      occurrence_count = occurrence_count + 1,
      last_occurred = now(),
      updated_at = now()
    WHERE id = v_existing.id
    RETURNING id INTO v_error_id;
  ELSE
    -- Insert new error
    INSERT INTO error_analytics (
      error_code,
      error_message,
      severity,
      stack_trace,
      context
    ) VALUES (
      p_error_code,
      p_error_message,
      p_severity,
      p_stack_trace,
      p_context
    ) RETURNING id INTO v_error_id;
  END IF;

  RETURN v_error_id;
END;
$$;

-- Function to record performance metrics
CREATE OR REPLACE FUNCTION record_performance_metric(
  p_metric_name text,
  p_operation_type text,
  p_duration_ms numeric,
  p_success boolean DEFAULT true,
  p_metadata jsonb DEFAULT NULL
) RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_metric_id uuid;
BEGIN
  INSERT INTO performance_analytics (
    metric_name,
    operation_type,
    avg_duration_ms,
    min_duration_ms,
    max_duration_ms,
    median_duration_ms,
    success_count,
    failure_count,
    metadata
  ) VALUES (
    p_metric_name,
    p_operation_type,
    p_duration_ms,
    p_duration_ms,
    p_duration_ms,
    p_duration_ms,
    CASE WHEN p_success THEN 1 ELSE 0 END,
    CASE WHEN p_success THEN 0 ELSE 1 END,
    p_metadata
  ) RETURNING id INTO v_metric_id;

  RETURN v_metric_id;
END;
$$;

-- Function to record health check
CREATE OR REPLACE FUNCTION record_health_check(
  p_check_name text,
  p_component text,
  p_status text,
  p_response_time_ms numeric DEFAULT NULL,
  p_details jsonb DEFAULT NULL,
  p_error_message text DEFAULT NULL
) RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_check_id uuid;
BEGIN
  INSERT INTO system_health_checks (
    check_name,
    component,
    status,
    response_time_ms,
    details,
    error_message
  ) VALUES (
    p_check_name,
    p_component,
    p_status,
    p_response_time_ms,
    p_details,
    p_error_message
  ) RETURNING id INTO v_check_id;

  RETURN v_check_id;
END;
$$;

COMMENT ON FUNCTION log_error_analytics IS
  'Logs an error to analytics, aggregating occurrences within the same hour';
COMMENT ON FUNCTION record_performance_metric IS
  'Records a performance metric for monitoring and analysis';
COMMENT ON FUNCTION record_health_check IS
  'Records a system health check result';
