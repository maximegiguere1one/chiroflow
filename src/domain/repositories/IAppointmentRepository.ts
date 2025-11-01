import { Appointment, AppointmentProps } from '../entities/Appointment';

export interface AppointmentFilters {
  status?: string;
  patient_id?: string;
  contact_id?: string;
  provider_id?: string;
  start_date?: string;
  end_date?: string;
  limit?: number;
  offset?: number;
}

export interface IAppointmentRepository {
  create(appointment: Appointment): Promise<Appointment>;
  findById(id: string): Promise<Appointment | null>;
  findAll(filters?: AppointmentFilters): Promise<Appointment[]>;
  update(id: string, appointment: Partial<AppointmentProps>): Promise<Appointment>;
  delete(id: string): Promise<void>;
  count(filters?: AppointmentFilters): Promise<number>;
}
