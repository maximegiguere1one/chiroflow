/*
  # Méga Migration Part 4 - Payments, Rebooking & Security (Fixed)
  
  ## Tables créées
  17. payment_methods
  18. payment_subscriptions
  19. payment_transactions_extended (VIEW)
  20. rebooking_responses
  21. rebooking_time_slots
  22. user_2fa_attempts
  23. user_2fa_settings
*/

-- 17. payment_methods
CREATE TABLE IF NOT EXISTS payment_methods (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id uuid REFERENCES profiles(id) ON DELETE CASCADE,
  contact_id uuid REFERENCES contacts(id) ON DELETE CASCADE,
  method_type text NOT NULL,
  card_last4 text,
  card_brand text,
  card_exp_month int,
  card_exp_year int,
  is_default boolean DEFAULT false,
  stripe_payment_method_id text,
  metadata jsonb,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  CONSTRAINT valid_payment_method CHECK (
    method_type IN ('card', 'bank_account', 'cash', 'check', 'other')
  )
);

ALTER TABLE payment_methods ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users manage own payment methods" ON payment_methods;
CREATE POLICY "Users manage own payment methods"
  ON payment_methods FOR ALL
  TO authenticated
  USING (owner_id = auth.uid())
  WITH CHECK (owner_id = auth.uid());

CREATE INDEX IF NOT EXISTS idx_payment_methods_owner ON payment_methods(owner_id);
CREATE INDEX IF NOT EXISTS idx_payment_methods_contact ON payment_methods(contact_id);

-- 18. payment_subscriptions
CREATE TABLE IF NOT EXISTS payment_subscriptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  contact_id uuid REFERENCES contacts(id) ON DELETE CASCADE NOT NULL,
  payment_method_id uuid REFERENCES payment_methods(id) ON DELETE SET NULL,
  subscription_type text NOT NULL,
  amount decimal(10,2) NOT NULL,
  currency text DEFAULT 'CAD',
  interval text DEFAULT 'month',
  interval_count int DEFAULT 1,
  status text DEFAULT 'active',
  start_date date DEFAULT CURRENT_DATE,
  end_date date,
  next_billing_date date,
  stripe_subscription_id text,
  metadata jsonb,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  CONSTRAINT valid_subscription_interval CHECK (
    interval IN ('day', 'week', 'month', 'year')
  ),
  CONSTRAINT valid_subscription_status CHECK (
    status IN ('active', 'paused', 'cancelled', 'expired')
  )
);

ALTER TABLE payment_subscriptions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users manage own subscriptions" ON payment_subscriptions;
CREATE POLICY "Users manage own subscriptions"
  ON payment_subscriptions FOR ALL
  TO authenticated
  USING (owner_id = auth.uid())
  WITH CHECK (owner_id = auth.uid());

CREATE INDEX IF NOT EXISTS idx_subscriptions_owner ON payment_subscriptions(owner_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_contact ON payment_subscriptions(contact_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_status ON payment_subscriptions(status);
CREATE INDEX IF NOT EXISTS idx_subscriptions_next_billing ON payment_subscriptions(next_billing_date);

-- 19. payment_transactions_extended (VIEW)
CREATE OR REPLACE VIEW payment_transactions_extended AS
SELECT 
  pt.*,
  c.full_name as patient_name,
  c.email as patient_email,
  pm.card_last4,
  pm.card_brand,
  pm.method_type as payment_method_type
FROM payment_transactions pt
LEFT JOIN contacts c ON c.id = pt.patient_id
LEFT JOIN payment_methods pm ON pm.contact_id = pt.patient_id AND pm.is_default = true;

ALTER VIEW payment_transactions_extended SET (security_invoker = true);

GRANT SELECT ON payment_transactions_extended TO authenticated;

-- 20. rebooking_responses
CREATE TABLE IF NOT EXISTS rebooking_responses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  rebooking_request_id uuid REFERENCES rebooking_requests(id) ON DELETE CASCADE NOT NULL,
  response_type text NOT NULL,
  selected_slot_date date,
  selected_slot_time time,
  notes text,
  responded_at timestamptz DEFAULT now(),
  CONSTRAINT valid_response_type CHECK (
    response_type IN ('accepted', 'declined', 'propose_alternative')
  )
);

ALTER TABLE rebooking_responses ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users view responses for own requests" ON rebooking_responses;
CREATE POLICY "Users view responses for own requests"
  ON rebooking_responses FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM rebooking_requests rr
      WHERE rr.id = rebooking_responses.rebooking_request_id
    )
  );

DROP POLICY IF EXISTS "Users insert responses for own requests" ON rebooking_responses;
CREATE POLICY "Users insert responses for own requests"
  ON rebooking_responses FOR INSERT
  TO authenticated, anon
  WITH CHECK (true);

CREATE INDEX IF NOT EXISTS idx_rebooking_responses_request ON rebooking_responses(rebooking_request_id);

-- 21. rebooking_time_slots
CREATE TABLE IF NOT EXISTS rebooking_time_slots (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  rebooking_request_id uuid REFERENCES rebooking_requests(id) ON DELETE CASCADE NOT NULL,
  slot_date date NOT NULL,
  slot_time time NOT NULL,
  is_available boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE rebooking_time_slots ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users view slots for own requests" ON rebooking_time_slots;
CREATE POLICY "Users view slots for own requests"
  ON rebooking_time_slots FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM rebooking_requests rr
      WHERE rr.id = rebooking_time_slots.rebooking_request_id
    )
  );

DROP POLICY IF EXISTS "Public can view available slots" ON rebooking_time_slots;
CREATE POLICY "Public can view available slots"
  ON rebooking_time_slots FOR SELECT
  TO anon, authenticated
  USING (is_available = true);

CREATE INDEX IF NOT EXISTS idx_rebooking_slots_request ON rebooking_time_slots(rebooking_request_id);
CREATE INDEX IF NOT EXISTS idx_rebooking_slots_date ON rebooking_time_slots(slot_date, slot_time);

-- 22. user_2fa_attempts
CREATE TABLE IF NOT EXISTS user_2fa_attempts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  attempt_type text NOT NULL,
  success boolean DEFAULT false,
  ip_address text,
  user_agent text,
  error_message text,
  attempted_at timestamptz DEFAULT now(),
  CONSTRAINT valid_2fa_attempt_type CHECK (
    attempt_type IN ('setup', 'verify', 'recovery')
  )
);

ALTER TABLE user_2fa_attempts ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users view own 2FA attempts" ON user_2fa_attempts;
CREATE POLICY "Users view own 2FA attempts"
  ON user_2fa_attempts FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE INDEX IF NOT EXISTS idx_2fa_attempts_user ON user_2fa_attempts(user_id);
CREATE INDEX IF NOT EXISTS idx_2fa_attempts_time ON user_2fa_attempts(attempted_at DESC);

-- 23. user_2fa_settings
CREATE TABLE IF NOT EXISTS user_2fa_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  method text DEFAULT 'totp',
  secret_encrypted text,
  backup_codes_encrypted text[],
  is_enabled boolean DEFAULT false,
  enabled_at timestamptz,
  last_used_at timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  CONSTRAINT valid_2fa_method CHECK (
    method IN ('totp', 'sms', 'email')
  ),
  UNIQUE(user_id)
);

ALTER TABLE user_2fa_settings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users manage own 2FA settings" ON user_2fa_settings;
CREATE POLICY "Users manage own 2FA settings"
  ON user_2fa_settings FOR ALL
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

GRANT SELECT, INSERT, UPDATE, DELETE ON payment_methods TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON payment_subscriptions TO authenticated;
GRANT SELECT ON payment_transactions_extended TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON rebooking_responses TO authenticated, anon;
GRANT SELECT ON rebooking_time_slots TO authenticated, anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON rebooking_time_slots TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON user_2fa_attempts TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON user_2fa_settings TO authenticated;

COMMENT ON TABLE payment_methods IS 'Méthodes de paiement enregistrées';
COMMENT ON TABLE payment_subscriptions IS 'Abonnements récurrents';
COMMENT ON VIEW payment_transactions_extended IS 'Vue étendue des transactions avec infos patient et paiement';
COMMENT ON TABLE rebooking_responses IS 'Réponses aux demandes de replanification';
COMMENT ON TABLE rebooking_time_slots IS 'Créneaux proposés pour replanification';
COMMENT ON TABLE user_2fa_attempts IS 'Tentatives d''authentification 2FA';
COMMENT ON TABLE user_2fa_settings IS 'Configuration 2FA par utilisateur';
