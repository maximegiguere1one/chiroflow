import type { IPatientRepository } from '../../../domain/repositories/IPatientRepository';
import type { Patient } from '../../../domain/entities/Patient';
import { logger } from '../../../infrastructure/monitoring/Logger';

export class GetPatientUseCase {
  constructor(private readonly patientRepository: IPatientRepository) {}

  async execute(id: string): Promise<Patient> {
    try {
      const patient = await this.patientRepository.findById(id);

      if (!patient) {
        throw new Error('Patient non trouvé');
      }

      return patient;
    } catch (error) {
      logger.error('Failed to get patient', error as Error, { id });
      throw error;
    }
  }
}
