import { IPatientRepository } from '../../../domain/repositories/IPatientRepository';
import { UpdatePatientDTO, PatientResponseDTO } from '../../dto/PatientDTO';
import { Patient } from '../../../domain/entities/Patient';

export class UpdatePatientUseCase {
  constructor(private patientRepository: IPatientRepository) {}

  async execute(id: string, dto: UpdatePatientDTO): Promise<PatientResponseDTO> {
    const existingPatient = await this.patientRepository.findById(id);
    
    if (!existingPatient) {
      throw new Error(`Patient with id ${id} not found`);
    }

    const updatedPatient = await this.patientRepository.update(id, dto);

    return this.toResponseDTO(updatedPatient);
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
