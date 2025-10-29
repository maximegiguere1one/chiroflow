import type { IPatientRepository } from '../../../domain/repositories/IPatientRepository';
import { logger } from '../../../infrastructure/monitoring/Logger';

export class DeletePatientUseCase {
  constructor(private readonly patientRepository: IPatientRepository) {}

  async execute(id: string): Promise<void> {
    try {
      const patient = await this.patientRepository.findById(id);

      if (!patient) {
        throw new Error('Patient non trouvé');
      }

      await this.patientRepository.delete(id);

      logger.info('Patient deleted successfully', { patientId: id });
    } catch (error) {
      logger.error('Failed to delete patient', error as Error, { id });
      throw error;
    }
  }
}
