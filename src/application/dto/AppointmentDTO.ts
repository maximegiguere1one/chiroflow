import { AppointmentStatus } from '../../domain/entities/Appointment';

export interface CreateAppointmentDTO {
  contact_id?: string | null;
  patient_id?: string | null;
  provider_id?: string | null;
  owner_id?: string | null;
  name: string;
  email: string;
  phone: string;
  reason: string;
  patient_age?: string | null;
  preferred_time?: string | null;
  scheduled_at?: string | null;
  scheduled_date?: string | null;
  scheduled_time?: string | null;
  duration_minutes?: number;
  notes?: string | null;
}

export interface UpdateAppointmentDTO {
  name?: string;
  email?: string;
  phone?: string;
  reason?: string;
  patient_age?: string | null;
  preferred_time?: string | null;
  status?: AppointmentStatus;
  scheduled_at?: string | null;
  scheduled_date?: string | null;
  scheduled_time?: string | null;
  duration_minutes?: number;
  notes?: string | null;
}

export interface AppointmentResponseDTO {
  id: string;
  contact_id: string | null;
  patient_id: string | null;
  provider_id: string | null;
  owner_id: string | null;
  name: string;
  email: string;
  phone: string;
  reason: string;
  patient_age: string | null;
  preferred_time: string | null;
  status: AppointmentStatus;
  scheduled_at: string | null;
  scheduled_date: string | null;
  scheduled_time: string | null;
  duration_minutes: number;
  notes: string | null;
  is_upcoming: boolean;
  is_past: boolean;
  created_at: string;
  updated_at: string;
}
