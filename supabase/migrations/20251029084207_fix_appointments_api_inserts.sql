/*
  # Fix appointments_api inserts

  ## Overview
  Adds INSTEAD OF triggers to appointments_api view to allow INSERT/UPDATE/DELETE operations.

  ## Changes
  1. Create INSTEAD OF INSERT trigger
  2. Create INSTEAD OF UPDATE trigger
  3. Create INSTEAD OF DELETE trigger
  4. Map scheduled_date + scheduled_time back to scheduled_at timestamp
*/

-- Function to handle INSERT on appointments_api
CREATE OR REPLACE FUNCTION appointments_api_insert()
RETURNS TRIGGER AS $$
BEGIN
  -- Combine scheduled_date and scheduled_time into scheduled_at
  INSERT INTO appointments (
    id,
    owner_id,
    contact_id,
    scheduled_at,
    duration_minutes,
    status,
    service_type,
    notes,
    reminder_sent,
    confirmation_status,
    no_show_risk_score
  ) VALUES (
    COALESCE(NEW.id, gen_random_uuid()),
    NEW.owner_id,
    NEW.contact_id,
    (NEW.scheduled_date::text || ' ' || NEW.scheduled_time::text)::timestamptz,
    NEW.duration_minutes,
    NEW.status,
    NEW.service_type,
    NEW.notes,
    COALESCE(NEW.reminder_sent, false),
    NEW.confirmation_status,
    NEW.no_show_risk_score
  )
  RETURNING * INTO NEW;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to handle UPDATE on appointments_api
CREATE OR REPLACE FUNCTION appointments_api_update()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE appointments SET
    owner_id = NEW.owner_id,
    contact_id = NEW.contact_id,
    scheduled_at = (NEW.scheduled_date::text || ' ' || NEW.scheduled_time::text)::timestamptz,
    duration_minutes = NEW.duration_minutes,
    status = NEW.status,
    service_type = NEW.service_type,
    notes = NEW.notes,
    reminder_sent = NEW.reminder_sent,
    confirmation_status = NEW.confirmation_status,
    no_show_risk_score = NEW.no_show_risk_score,
    updated_at = now()
  WHERE id = OLD.id;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to handle DELETE on appointments_api
CREATE OR REPLACE FUNCTION appointments_api_delete()
RETURNS TRIGGER AS $$
BEGIN
  DELETE FROM appointments WHERE id = OLD.id;
  RETURN OLD;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Drop existing triggers if they exist
DROP TRIGGER IF EXISTS appointments_api_insert_trigger ON appointments_api;
DROP TRIGGER IF EXISTS appointments_api_update_trigger ON appointments_api;
DROP TRIGGER IF EXISTS appointments_api_delete_trigger ON appointments_api;

-- Create INSTEAD OF triggers
CREATE TRIGGER appointments_api_insert_trigger
  INSTEAD OF INSERT ON appointments_api
  FOR EACH ROW
  EXECUTE FUNCTION appointments_api_insert();

CREATE TRIGGER appointments_api_update_trigger
  INSTEAD OF UPDATE ON appointments_api
  FOR EACH ROW
  EXECUTE FUNCTION appointments_api_update();

CREATE TRIGGER appointments_api_delete_trigger
  INSTEAD OF DELETE ON appointments_api
  FOR EACH ROW
  EXECUTE FUNCTION appointments_api_delete();

COMMENT ON FUNCTION appointments_api_insert() IS
  'Handles INSERT operations on appointments_api view by converting scheduled_date/time to scheduled_at';

COMMENT ON FUNCTION appointments_api_update() IS
  'Handles UPDATE operations on appointments_api view by converting scheduled_date/time to scheduled_at';

COMMENT ON FUNCTION appointments_api_delete() IS
  'Handles DELETE operations on appointments_api view';
