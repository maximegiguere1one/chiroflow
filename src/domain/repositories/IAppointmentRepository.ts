import type { Appointment, CreateAppointmentInput, UpdateAppointmentInput } from '../entities/Appointment';

export interface IAppointmentRepository {
  findById(id: string): Promise<Appointment | null>;
  findAll(): Promise<Appointment[]>;
  findByPatientId(patientId: string): Promise<Appointment[]>;
  findByDateRange(startDate: string, endDate: string): Promise<Appointment[]>;
  findUpcoming(limit?: number): Promise<Appointment[]>;
  create(input: CreateAppointmentInput): Promise<Appointment>;
  update(input: UpdateAppointmentInput): Promise<Appointment>;
  delete(id: string): Promise<void>;
  count(): Promise<number>;
}
