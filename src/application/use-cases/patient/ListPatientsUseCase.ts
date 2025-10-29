import type { IPatientRepository } from '../../../domain/repositories/IPatientRepository';
import type { Patient } from '../../../domain/entities/Patient';
import { logger } from '../../../infrastructure/monitoring/Logger';

export class ListPatientsUseCase {
  constructor(private readonly patientRepository: IPatientRepository) {}

  async execute(): Promise<Patient[]> {
    try {
      const patients = await this.patientRepository.findAll();
      return patients;
    } catch (error) {
      logger.error('Failed to list patients', error as Error);
      throw error;
    }
  }
}
