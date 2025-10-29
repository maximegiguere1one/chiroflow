export interface Patient {
  id: string;
  first_name: string;
  last_name: string;
  email: string | null;
  phone: string | null;
  date_of_birth: string | null;
  gender: 'male' | 'female' | 'other' | 'prefer_not_to_say';
  address: string | null;
  medical_history: string | null;
  medications: string | null;
  allergies: string | null;
  status: 'active' | 'inactive' | 'archived';
  last_visit: string | null;
  total_visits: number;
  created_at: string;
  updated_at: string;
}

export interface Appointment {
  id: string;
  contact_id: string | null;
  provider_id: string | null;
  name: string;
  email: string;
  phone: string;
  reason: string;
  patient_age: string | null;
  preferred_time: string | null;
  status: 'pending' | 'confirmed' | 'completed' | 'cancelled' | 'no_show';
  scheduled_at: string | null;
  duration_minutes: number;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface AppointmentWithDateTime extends Appointment {
  scheduled_date: string | null;
  scheduled_time: string | null;
}

export interface SoapNote {
  id: string;
  patient_id: string;
  appointment_id: string | null;
  visit_date: string;
  subjective: string | null;
  objective: string | null;
  assessment: string | null;
  plan: string | null;
  follow_up_date: string | null;
  created_by: string;
  created_at: string;
  updated_at: string;
}

export interface ContactSubmission {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  message: string;
  status: 'new' | 'read' | 'responded';
  created_at: string;
}

export interface WaitlistEntry {
  id: string;
  name: string;
  email: string;
  phone: string;
  reason: string;
  patient_age: string | null;
  preferred_time: string | null;
  status: 'active' | 'contacted' | 'scheduled' | 'cancelled';
  priority: number;
  created_at: string;
  updated_at: string;
}

export interface Profile {
  id: string;
  email: string;
  full_name: string | null;
  role: 'admin' | 'staff' | 'practitioner';
  avatar_url: string | null;
  created_at: string;
  updated_at: string;
}

export interface AnalyticsDashboard {
  id: string;
  metric_name: string;
  metric_value: string;
  metric_type: 'count' | 'currency' | 'percentage' | 'duration';
  period: 'day' | 'week' | 'month' | 'year' | 'all_time';
  created_at: string;
}

export interface TreatmentPlan {
  id: string;
  patient_id: string;
  title: string;
  description: string | null;
  start_date: string;
  end_date: string | null;
  status: 'active' | 'completed' | 'on_hold' | 'cancelled';
  goals: string | null;
  frequency: string | null;
  created_by: string;
  created_at: string;
  updated_at: string;
}

export interface PatientDocument {
  id: string;
  patient_id: string;
  document_type: 'consent_form' | 'xray' | 'lab_result' | 'referral' | 'insurance' | 'other';
  file_name: string;
  file_url: string;
  file_size: number;
  mime_type: string;
  uploaded_by: string;
  notes: string | null;
  created_at: string;
}

export interface Invoice {
  id: string;
  patient_id: string;
  appointment_id: string | null;
  invoice_number: string;
  amount: number;
  tax: number;
  total: number;
  status: 'draft' | 'sent' | 'paid' | 'overdue' | 'cancelled';
  due_date: string;
  paid_date: string | null;
  payment_method: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface PatientPortalUser {
  id: string;
  patient_id: string;
  email: string;
  is_active: boolean;
  email_verified: boolean;
  last_login: string | null;
  login_count: number;
  preferences: Record<string, any>;
  created_at: string;
  updated_at: string;
}

export interface InsuranceClaim {
  id: string;
  patient_id: string;
  invoice_id: string | null;
  claim_number: string;
  insurance_provider: string;
  policy_number: string | null;
  claim_type: string;
  service_date: string;
  submission_date: string;
  claim_amount: number;
  approved_amount: number | null;
  status: 'pending' | 'submitted' | 'approved' | 'rejected' | 'paid';
  status_notes: string | null;
  diagnostic_codes: string[] | null;
  procedure_codes: string[] | null;
  submitted_by: string | null;
  processed_date: string | null;
  payment_received_date: string | null;
  attachments: any[];
  metadata: Record<string, any>;
  created_at: string;
  updated_at: string;
}

export interface PaymentTransaction {
  id: string;
  invoice_id: string;
  patient_id: string;
  transaction_type: 'payment' | 'refund' | 'adjustment';
  amount: number;
  payment_method: string;
  transaction_reference: string | null;
  transaction_status: 'completed' | 'pending' | 'failed';
  gateway_response: Record<string, any> | null;
  processed_by: string | null;
  notes: string | null;
  created_at: string;
}

export interface WorkflowAutomation {
  id: string;
  name: string;
  description: string | null;
  workflow_type: 'reminder' | 'followup' | 'billing' | 'marketing';
  trigger_type: 'time_based' | 'event_based' | 'manual';
  trigger_config: Record<string, any>;
  action_type: 'email' | 'sms' | 'notification' | 'task';
  action_config: Record<string, any>;
  is_active: boolean;
  execution_count: number;
  last_executed_at: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface AppointmentSlotOffer {
  id: string;
  cancelled_appointment_id: string | null;
  slot_date: string;
  slot_time: string;
  slot_datetime: string;
  duration_minutes: number;
  reason: string | null;
  original_patient_name: string | null;
  status: 'available' | 'pending' | 'claimed' | 'expired' | 'cancelled';
  invitation_count: number;
  max_invitations: number;
  expires_at: string;
  claimed_by: string | null;
  claimed_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface SlotOfferInvitation {
  id: string;
  slot_offer_id: string;
  waitlist_entry_id: string;
  response_token: string;
  sent_at: string;
  expires_at: string;
  opened_at: string | null;
  clicked_at: string | null;
  responded_at: string | null;
  status: 'pending' | 'accepted' | 'declined' | 'expired' | 'cancelled';
  response_type: 'accepted' | 'declined' | null;
  notification_channel: string;
  created_at: string;
}

export interface WaitlistNotification {
  id: string;
  waitlist_entry_id: string;
  invitation_id: string | null;
  notification_type: 'invitation' | 'confirmation' | 'expiration' | 'reminder';
  channel: 'email' | 'sms' | 'push';
  recipient_email: string | null;
  recipient_phone: string | null;
  subject: string | null;
  content: string | null;
  sent_at: string;
  delivered_at: string | null;
  opened_at: string | null;
  clicked_at: string | null;
  bounced: boolean;
  bounce_reason: string | null;
  metadata: Record<string, any>;
  created_at: string;
}

export interface WaitlistSettings {
  id: string;
  setting_key: string;
  setting_value: Record<string, any>;
  description: string | null;
  updated_by: string | null;
  updated_at: string;
  created_at: string;
}

export interface AnalyticsSnapshot {
  id: string;
  snapshot_date: string;
  snapshot_period: 'daily' | 'weekly' | 'monthly' | 'quarterly' | 'yearly';
  metrics: Record<string, any>;
  created_at: string;
}

export interface DocumentTemplate {
  id: string;
  name: string;
  template_type: 'invoice' | 'receipt' | 'progress_report' | 'insurance_claim' | 'letter';
  description: string | null;
  content: string;
  merge_fields: string[];
  styles: Record<string, any>;
  is_active: boolean;
  is_default: boolean;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface PaymentMethod {
  id: string;
  patient_id: string;
  card_token: string;
  card_brand: string;
  last_four_digits: string;
  expiry_month: number;
  expiry_year: number;
  cardholder_name: string;
  billing_address_line1: string;
  billing_address_line2: string | null;
  billing_city: string;
  billing_province: string;
  billing_postal_code: string;
  billing_country: string;
  card_nickname: string | null;
  is_primary: boolean;
  is_verified: boolean;
  is_active: boolean;
  gateway_customer_id: string | null;
  created_at: string;
  updated_at: string;
}

export interface PaymentSubscription {
  id: string;
  patient_id: string;
  payment_method_id: string | null;
  subscription_type: string;
  description: string;
  amount: number;
  currency: string;
  frequency: 'weekly' | 'biweekly' | 'monthly' | 'quarterly' | 'yearly' | 'custom';
  interval_count: number;
  start_date: string;
  next_billing_date: string;
  end_date: string | null;
  status: 'active' | 'paused' | 'cancelled' | 'expired';
  grace_period_days: number;
  retry_attempts: number;
  max_retry_attempts: number;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface PaymentTransactionExtended {
  id: string;
  patient_id: string;
  invoice_id: string | null;
  payment_method_id: string | null;
  subscription_id: string | null;
  transaction_type: 'charge' | 'refund' | 'adjustment' | 'verification';
  amount: number;
  currency: string;
  status: 'pending' | 'completed' | 'failed' | 'refunded';
  gateway_transaction_id: string | null;
  gateway_response: Record<string, any> | null;
  failure_reason: string | null;
  failure_code: string | null;
  processed_by: string | null;
  processed_at: string | null;
  refunded_at: string | null;
  refund_reason: string | null;
  notes: string | null;
  metadata: Record<string, any>;
  created_at: string;
}

export interface PaymentScheduleLog {
  id: string;
  subscription_id: string;
  transaction_id: string | null;
  scheduled_date: string;
  attempted_at: string;
  status: 'success' | 'failed' | 'skipped' | 'pending';
  retry_number: number;
  error_message: string | null;
  created_at: string;
}

export interface PaymentMethodAuditLog {
  id: string;
  payment_method_id: string | null;
  action: 'added' | 'updated' | 'deleted' | 'verified' | 'set_primary';
  changed_by: string | null;
  user_role: 'patient' | 'admin' | 'practitioner';
  old_values: Record<string, any> | null;
  new_values: Record<string, any> | null;
  ip_address: string | null;
  user_agent: string | null;
  created_at: string;
}
