/*
  # Méga Migration Part 2 - Automation & Monitoring
  
  ## Tables créées
  7. cancellation_automation_monitor
  8. cron_job_executions
  9. system_health_checks
  10. error_analytics
  11. performance_analytics
*/

-- 7. cancellation_automation_monitor
CREATE TABLE IF NOT EXISTS cancellation_automation_monitor (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id uuid REFERENCES profiles(id) ON DELETE SET NULL,
  appointment_id uuid REFERENCES appointments(id) ON DELETE SET NULL,
  event_type text NOT NULL,
  status text DEFAULT 'pending',
  waitlist_notified_count int DEFAULT 0,
  emails_sent_count int DEFAULT 0,
  error_message text,
  executed_at timestamptz,
  created_at timestamptz DEFAULT now(),
  CONSTRAINT valid_event_type CHECK (
    event_type IN ('cancellation_detected', 'waitlist_notified', 'slot_filled', 'failed')
  ),
  CONSTRAINT valid_status CHECK (
    status IN ('pending', 'processing', 'completed', 'failed')
  )
);

ALTER TABLE cancellation_automation_monitor ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users view own automation monitor" ON cancellation_automation_monitor;
CREATE POLICY "Users view own automation monitor"
  ON cancellation_automation_monitor FOR SELECT
  TO authenticated
  USING (owner_id = auth.uid());

CREATE INDEX IF NOT EXISTS idx_cancel_monitor_owner ON cancellation_automation_monitor(owner_id);
CREATE INDEX IF NOT EXISTS idx_cancel_monitor_status ON cancellation_automation_monitor(status);
CREATE INDEX IF NOT EXISTS idx_cancel_monitor_created ON cancellation_automation_monitor(created_at DESC);

-- 8. cron_job_executions
CREATE TABLE IF NOT EXISTS cron_job_executions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  job_name text NOT NULL,
  status text DEFAULT 'running',
  started_at timestamptz DEFAULT now(),
  completed_at timestamptz,
  duration_ms int,
  records_processed int DEFAULT 0,
  records_failed int DEFAULT 0,
  error_message text,
  metadata jsonb,
  CONSTRAINT valid_cron_status CHECK (
    status IN ('running', 'completed', 'failed', 'timeout')
  )
);

ALTER TABLE cron_job_executions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admins view cron executions" ON cron_job_executions;
CREATE POLICY "Admins view cron executions"
  ON cron_job_executions FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

CREATE INDEX IF NOT EXISTS idx_cron_job_name ON cron_job_executions(job_name);
CREATE INDEX IF NOT EXISTS idx_cron_started ON cron_job_executions(started_at DESC);
CREATE INDEX IF NOT EXISTS idx_cron_status ON cron_job_executions(status);

-- 9. system_health_checks
CREATE TABLE IF NOT EXISTS system_health_checks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  check_type text NOT NULL,
  status text DEFAULT 'healthy',
  response_time_ms int,
  error_message text,
  metadata jsonb,
  checked_at timestamptz DEFAULT now(),
  CONSTRAINT valid_health_status CHECK (
    status IN ('healthy', 'degraded', 'unhealthy', 'unknown')
  )
);

ALTER TABLE system_health_checks ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admins view health checks" ON system_health_checks;
CREATE POLICY "Admins view health checks"
  ON system_health_checks FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

CREATE INDEX IF NOT EXISTS idx_health_check_type ON system_health_checks(check_type);
CREATE INDEX IF NOT EXISTS idx_health_checked_at ON system_health_checks(checked_at DESC);

-- 10. error_analytics
CREATE TABLE IF NOT EXISTS error_analytics (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  error_type text NOT NULL,
  error_message text,
  stack_trace text,
  user_id uuid REFERENCES profiles(id) ON DELETE SET NULL,
  page_url text,
  user_agent text,
  browser_info jsonb,
  count int DEFAULT 1,
  first_seen_at timestamptz DEFAULT now(),
  last_seen_at timestamptz DEFAULT now(),
  resolved boolean DEFAULT false,
  resolved_at timestamptz
);

ALTER TABLE error_analytics ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admins view error analytics" ON error_analytics;
CREATE POLICY "Admins view error analytics"
  ON error_analytics FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

CREATE INDEX IF NOT EXISTS idx_error_type ON error_analytics(error_type);
CREATE INDEX IF NOT EXISTS idx_error_last_seen ON error_analytics(last_seen_at DESC);
CREATE INDEX IF NOT EXISTS idx_error_resolved ON error_analytics(resolved);

-- 11. performance_analytics
CREATE TABLE IF NOT EXISTS performance_analytics (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  metric_name text NOT NULL,
  metric_value numeric NOT NULL,
  metric_unit text,
  page_url text,
  user_id uuid REFERENCES profiles(id) ON DELETE SET NULL,
  metadata jsonb,
  recorded_at timestamptz DEFAULT now()
);

ALTER TABLE performance_analytics ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admins view performance analytics" ON performance_analytics;
CREATE POLICY "Admins view performance analytics"
  ON performance_analytics FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

CREATE INDEX IF NOT EXISTS idx_perf_metric_name ON performance_analytics(metric_name);
CREATE INDEX IF NOT EXISTS idx_perf_recorded_at ON performance_analytics(recorded_at DESC);

GRANT SELECT, INSERT, UPDATE, DELETE ON cancellation_automation_monitor TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON cron_job_executions TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON system_health_checks TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON error_analytics TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON performance_analytics TO authenticated;

COMMENT ON TABLE cancellation_automation_monitor IS 'Surveillance des automatisations d''annulation';
COMMENT ON TABLE cron_job_executions IS 'Historique d''exécution des tâches cron';
COMMENT ON TABLE system_health_checks IS 'Vérifications de santé système';
COMMENT ON TABLE error_analytics IS 'Analytiques des erreurs frontend/backend';
COMMENT ON TABLE performance_analytics IS 'Métriques de performance application';
