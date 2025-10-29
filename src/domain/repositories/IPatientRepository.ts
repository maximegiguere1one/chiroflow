import type { Patient, CreatePatientInput, UpdatePatientInput } from '../entities/Patient';

export interface IPatientRepository {
  findById(id: string): Promise<Patient | null>;
  findAll(): Promise<Patient[]>;
  findByEmail(email: string): Promise<Patient | null>;
  search(query: string): Promise<Patient[]>;
  create(input: CreatePatientInput): Promise<Patient>;
  update(input: UpdatePatientInput): Promise<Patient>;
  delete(id: string): Promise<void>;
  count(): Promise<number>;
}
