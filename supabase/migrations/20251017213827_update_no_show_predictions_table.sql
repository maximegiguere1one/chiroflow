/*
  # Update No-Show Predictions Table

  ## Description
  Updates the existing no_show_predictions table to add missing columns and features.
  
  ## Changes
  1. Add missing columns: confidence_score, model_version, metadata, updated_at
  2. Add proper constraints and defaults
  3. Create indexes for performance
  4. Add trigger for automatic outcome updates
  
  ## Security
  - Maintains existing RLS policies
*/

-- Add missing columns if they don't exist
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'no_show_predictions' AND column_name = 'confidence_score'
  ) THEN
    ALTER TABLE no_show_predictions ADD COLUMN confidence_score decimal(5,4) DEFAULT 0.7 CHECK (confidence_score >= 0 AND confidence_score <= 1);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'no_show_predictions' AND column_name = 'model_version'
  ) THEN
    ALTER TABLE no_show_predictions ADD COLUMN model_version text DEFAULT 'v1.0';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'no_show_predictions' AND column_name = 'metadata'
  ) THEN
    ALTER TABLE no_show_predictions ADD COLUMN metadata jsonb DEFAULT '{}';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'no_show_predictions' AND column_name = 'updated_at'
  ) THEN
    ALTER TABLE no_show_predictions ADD COLUMN updated_at timestamptz DEFAULT now();
  END IF;
END $$;

-- Ensure proper constraints exist
DO $$
BEGIN
  -- Add constraint for risk_score if not exists
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'no_show_predictions_risk_score_check'
  ) THEN
    ALTER TABLE no_show_predictions ADD CONSTRAINT no_show_predictions_risk_score_check 
    CHECK (risk_score >= 0 AND risk_score <= 1);
  END IF;
  
  -- Add constraint for risk_level if not exists
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'no_show_predictions_risk_level_check'
  ) THEN
    ALTER TABLE no_show_predictions ADD CONSTRAINT no_show_predictions_risk_level_check 
    CHECK (risk_level IN ('low', 'medium', 'high'));
  END IF;
EXCEPTION
  WHEN duplicate_object THEN
    NULL;
END $$;

-- Create indexes for performance (if they don't exist)
CREATE INDEX IF NOT EXISTS idx_no_show_predictions_appointment ON no_show_predictions(appointment_id);
CREATE INDEX IF NOT EXISTS idx_no_show_predictions_patient ON no_show_predictions(patient_id);
CREATE INDEX IF NOT EXISTS idx_no_show_predictions_risk_level ON no_show_predictions(risk_level);
CREATE INDEX IF NOT EXISTS idx_no_show_predictions_actual_outcome ON no_show_predictions(actual_outcome);
CREATE INDEX IF NOT EXISTS idx_no_show_predictions_risk_score ON no_show_predictions(risk_score DESC);
CREATE INDEX IF NOT EXISTS idx_no_show_predictions_prediction_date ON no_show_predictions(prediction_date);

-- Trigger for updated_at
DROP TRIGGER IF EXISTS update_no_show_predictions_updated_at ON no_show_predictions;
CREATE TRIGGER update_no_show_predictions_updated_at
  BEFORE UPDATE ON no_show_predictions
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();

-- Function to automatically update actual_outcome based on appointment status
CREATE OR REPLACE FUNCTION update_prediction_outcome()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status IN ('completed', 'no_show', 'cancelled') AND OLD.status != NEW.status THEN
    UPDATE no_show_predictions
    SET 
      actual_outcome = CASE 
        WHEN NEW.status = 'completed' THEN 'attended'
        WHEN NEW.status = 'no_show' THEN 'no_show'
        WHEN NEW.status = 'cancelled' THEN 'cancelled'
        ELSE actual_outcome
      END,
      updated_at = now()
    WHERE appointment_id = NEW.id;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger on appointments table to auto-update predictions
DROP TRIGGER IF EXISTS auto_update_prediction_outcome ON appointments;
CREATE TRIGGER auto_update_prediction_outcome
  AFTER UPDATE OF status ON appointments
  FOR EACH ROW
  EXECUTE FUNCTION update_prediction_outcome();
