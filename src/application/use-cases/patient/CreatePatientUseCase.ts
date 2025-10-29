import type { IPatientRepository } from '../../../domain/repositories/IPatientRepository';
import type { CreatePatientInput, Patient } from '../../../domain/entities/Patient';
import { CreatePatientSchema } from '../../../domain/entities/Patient';
import { logger } from '../../../infrastructure/monitoring/Logger';

export class CreatePatientUseCase {
  constructor(private readonly patientRepository: IPatientRepository) {}

  async execute(input: CreatePatientInput): Promise<Patient> {
    try {
      const validatedInput = CreatePatientSchema.parse(input);

      const existingPatient = await this.patientRepository.findByEmail(validatedInput.email);
      if (existingPatient) {
        throw new Error('Un patient avec cet email existe déjà');
      }

      const patient = await this.patientRepository.create(validatedInput);

      logger.info('Patient created successfully', { patientId: patient.id });

      return patient;
    } catch (error) {
      logger.error('Failed to create patient', error as Error, { input });
      throw error;
    }
  }
}
