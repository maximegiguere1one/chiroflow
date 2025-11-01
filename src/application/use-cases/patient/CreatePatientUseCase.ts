import { Patient } from '../../../domain/entities/Patient';
import { IPatientRepository } from '../../../domain/repositories/IPatientRepository';
import { CreatePatientDTO, PatientResponseDTO } from '../../dto/PatientDTO';

export class CreatePatientUseCase {
  constructor(private patientRepository: IPatientRepository) {}

  async execute(dto: CreatePatientDTO): Promise<PatientResponseDTO> {
    const patient = new Patient({
      first_name: dto.first_name,
      last_name: dto.last_name,
      email: dto.email || null,
      phone: dto.phone || null,
      date_of_birth: dto.date_of_birth || null,
      gender: dto.gender,
      address: dto.address || null,
      medical_history: dto.medical_history || null,
      medications: dto.medications || null,
      allergies: dto.allergies || null,
      status: 'active',
      last_visit: null,
      total_visits: 0,
    });

    const createdPatient = await this.patientRepository.create(patient);

    return this.toResponseDTO(createdPatient);
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
