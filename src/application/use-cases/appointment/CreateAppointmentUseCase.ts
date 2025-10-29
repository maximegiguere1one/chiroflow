import type { IAppointmentRepository } from '../../../domain/repositories/IAppointmentRepository';
import type { IPatientRepository } from '../../../domain/repositories/IPatientRepository';
import type { CreateAppointmentInput, Appointment } from '../../../domain/entities/Appointment';
import { CreateAppointmentSchema } from '../../../domain/entities/Appointment';
import { logger } from '../../../infrastructure/monitoring/Logger';

export class CreateAppointmentUseCase {
  constructor(
    private readonly appointmentRepository: IAppointmentRepository,
    private readonly patientRepository: IPatientRepository
  ) {}

  async execute(input: CreateAppointmentInput): Promise<Appointment> {
    try {
      const validatedInput = CreateAppointmentSchema.parse(input);

      const patient = await this.patientRepository.findById(validatedInput.patientId);
      if (!patient) {
        throw new Error('Patient non trouvé');
      }

      const startTime = new Date(validatedInput.startTime);
      const endTime = new Date(validatedInput.endTime);

      if (endTime <= startTime) {
        throw new Error('L\'heure de fin doit être après l\'heure de début');
      }

      const conflictingAppointments = await this.appointmentRepository.findByDateRange(
        validatedInput.startTime,
        validatedInput.endTime
      );

      if (conflictingAppointments.length > 0) {
        throw new Error('Ce créneau horaire est déjà réservé');
      }

      const appointment = await this.appointmentRepository.create(validatedInput);

      logger.info('Appointment created successfully', { appointmentId: appointment.id });

      return appointment;
    } catch (error) {
      logger.error('Failed to create appointment', error as Error, { input });
      throw error;
    }
  }
}
