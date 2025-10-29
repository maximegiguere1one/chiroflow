/*
  # Table branding_settings
*/

CREATE TABLE IF NOT EXISTS branding_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  primary_color text DEFAULT '#C9A55C',
  secondary_color text DEFAULT '#1a1a1a',
  accent_color text DEFAULT '#d4b36a',
  text_color text DEFAULT '#333333',
  background_color text DEFAULT '#ffffff',
  logo_url text,
  favicon_url text,
  hero_image_url text,
  heading_font text DEFAULT 'Inter',
  body_font text DEFAULT 'Inter',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_branding_owner ON branding_settings(owner_id);

ALTER TABLE branding_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "branding_select_public" ON branding_settings FOR SELECT USING (true);
CREATE POLICY "branding_insert_own" ON branding_settings FOR INSERT TO authenticated WITH CHECK (auth.uid() = owner_id);
CREATE POLICY "branding_update_own" ON branding_settings FOR UPDATE TO authenticated USING (auth.uid() = owner_id) WITH CHECK (auth.uid() = owner_id);
CREATE POLICY "branding_delete_own" ON branding_settings FOR DELETE TO authenticated USING (auth.uid() = owner_id);

CREATE TRIGGER update_branding_settings_updated_at BEFORE UPDATE ON branding_settings
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();