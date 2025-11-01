import { IPatientRepository, PatientFilters } from '../../../domain/repositories/IPatientRepository';
import { PatientResponseDTO } from '../../dto/PatientDTO';
import { Patient } from '../../../domain/entities/Patient';

export interface ListPatientsResult {
  patients: PatientResponseDTO[];
  total: number;
  limit: number;
  offset: number;
}

export class ListPatientsUseCase {
  constructor(private patientRepository: IPatientRepository) {}

  async execute(filters?: PatientFilters): Promise<ListPatientsResult> {
    const [patients, total] = await Promise.all([
      this.patientRepository.findAll(filters),
      this.patientRepository.count(filters),
    ]);

    return {
      patients: patients.map(patient => this.toResponseDTO(patient)),
      total,
      limit: filters?.limit || 50,
      offset: filters?.offset || 0,
    };
  }

  private toResponseDTO(patient: Patient): PatientResponseDTO {
    return {
      id: patient.id,
      first_name: patient.first_name,
      last_name: patient.last_name,
      full_name: patient.fullName,
      email: patient.email,
      phone: patient.phone,
      date_of_birth: patient.date_of_birth,
      age: patient.age,
      gender: patient.gender,
      address: patient.address,
      medical_history: patient.medical_history,
      medications: patient.medications,
      allergies: patient.allergies,
      status: patient.status,
      last_visit: patient.last_visit,
      total_visits: patient.total_visits,
      created_at: patient.created_at,
      updated_at: patient.updated_at,
    };
  }
}
