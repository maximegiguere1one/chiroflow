import { Patient, PatientProps } from '../entities/Patient';

export interface PatientFilters {
  status?: string;
  search?: string;
  limit?: number;
  offset?: number;
}

export interface IPatientRepository {
  create(patient: Patient): Promise<Patient>;
  findById(id: string): Promise<Patient | null>;
  findAll(filters?: PatientFilters): Promise<Patient[]>;
  update(id: string, patient: Partial<PatientProps>): Promise<Patient>;
  delete(id: string): Promise<void>;
  count(filters?: PatientFilters): Promise<number>;
}
