/*
  # Add Automatic No-Show Prediction Trigger

  ## Description
  Creates a trigger that automatically generates no-show predictions when appointments are created or updated.

  ## Changes
  1. Create function to call Edge Function via HTTP
  2. Create trigger on appointments table for INSERT and UPDATE
  3. Only triggers for confirmed and pending appointments
  
  ## Important
  - Uses pg_net extension for HTTP calls
  - Calls the predict-no-show Edge Function
  - Asynchronous processing to avoid blocking appointment operations
*/

-- Function to trigger no-show prediction via Edge Function
CREATE OR REPLACE FUNCTION trigger_no_show_prediction()
RETURNS TRIGGER AS $$
DECLARE
  function_url text;
  payload jsonb;
BEGIN
  IF NEW.status IN ('confirmed', 'pending') THEN
    function_url := current_setting('app.settings.supabase_url', true) || '/functions/v1/predict-no-show';
    
    payload := jsonb_build_object(
      'appointment_id', NEW.id
    );

    PERFORM net.http_post(
      url := function_url,
      headers := jsonb_build_object(
        'Content-Type', 'application/json',
        'Authorization', 'Bearer ' || current_setting('app.settings.service_role_key', true)
      ),
      body := payload
    );
  END IF;

  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for new appointments
DROP TRIGGER IF EXISTS auto_predict_no_show_on_insert ON appointments;
CREATE TRIGGER auto_predict_no_show_on_insert
  AFTER INSERT ON appointments
  FOR EACH ROW
  EXECUTE FUNCTION trigger_no_show_prediction();

-- Create trigger for updated appointments
DROP TRIGGER IF EXISTS auto_predict_no_show_on_update ON appointments;
CREATE TRIGGER auto_predict_no_show_on_update
  AFTER UPDATE OF status, scheduled_date, scheduled_time, patient_id ON appointments
  FOR EACH ROW
  WHEN (NEW.status IN ('confirmed', 'pending'))
  EXECUTE FUNCTION trigger_no_show_prediction();
