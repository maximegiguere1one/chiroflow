import { PatientStatus, Gender } from '../../domain/entities/Patient';

export interface CreatePatientDTO {
  first_name: string;
  last_name: string;
  email?: string | null;
  phone?: string | null;
  date_of_birth?: string | null;
  gender: Gender;
  address?: string | null;
  medical_history?: string | null;
  medications?: string | null;
  allergies?: string | null;
}

export interface UpdatePatientDTO {
  first_name?: string;
  last_name?: string;
  email?: string | null;
  phone?: string | null;
  date_of_birth?: string | null;
  gender?: Gender;
  address?: string | null;
  medical_history?: string | null;
  medications?: string | null;
  allergies?: string | null;
  status?: PatientStatus;
}

export interface PatientResponseDTO {
  id: string;
  first_name: string;
  last_name: string;
  full_name: string;
  email: string | null;
  phone: string | null;
  date_of_birth: string | null;
  age: number | null;
  gender: Gender;
  address: string | null;
  medical_history: string | null;
  medications: string | null;
  allergies: string | null;
  status: PatientStatus;
  last_visit: string | null;
  total_visits: number;
  created_at: string;
  updated_at: string;
}
