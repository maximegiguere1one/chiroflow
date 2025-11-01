import { IPatientRepository } from '../../../domain/repositories/IPatientRepository';

export class DeletePatientUseCase {
  constructor(private patientRepository: IPatientRepository) {}

  async execute(id: string): Promise<void> {
    const existingPatient = await this.patientRepository.findById(id);
    
    if (!existingPatient) {
      throw new Error(`Patient with id ${id} not found`);
    }

    await this.patientRepository.delete(id);
  }
}
