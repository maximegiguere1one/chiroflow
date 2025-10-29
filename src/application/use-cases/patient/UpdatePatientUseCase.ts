import type { IPatientRepository } from '../../../domain/repositories/IPatientRepository';
import type { UpdatePatientInput, Patient } from '../../../domain/entities/Patient';
import { UpdatePatientSchema } from '../../../domain/entities/Patient';
import { logger } from '../../../infrastructure/monitoring/Logger';

export class UpdatePatientUseCase {
  constructor(private readonly patientRepository: IPatientRepository) {}

  async execute(input: UpdatePatientInput): Promise<Patient> {
    try {
      const validatedInput = UpdatePatientSchema.parse(input);

      const existingPatient = await this.patientRepository.findById(validatedInput.id);
      if (!existingPatient) {
        throw new Error('Patient non trouvé');
      }

      if (validatedInput.email && validatedInput.email !== existingPatient.email) {
        const patientWithEmail = await this.patientRepository.findByEmail(validatedInput.email);
        if (patientWithEmail) {
          throw new Error('Un patient avec cet email existe déjà');
        }
      }

      const patient = await this.patientRepository.update(validatedInput);

      logger.info('Patient updated successfully', { patientId: patient.id });

      return patient;
    } catch (error) {
      logger.error('Failed to update patient', error as Error, { input });
      throw error;
    }
  }
}
