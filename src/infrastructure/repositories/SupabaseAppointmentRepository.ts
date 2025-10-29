import type { IAppointmentRepository } from '../../domain/repositories/IAppointmentRepository';
import type { Appointment, CreateAppointmentInput, UpdateAppointmentInput } from '../../domain/entities/Appointment';
import { AppointmentSchema } from '../../domain/entities/Appointment';
import { supabase } from '../../lib/supabase';
import { logger } from '../monitoring/Logger';

export class SupabaseAppointmentRepository implements IAppointmentRepository {
  private readonly tableName = 'appointments';

  async findById(id: string): Promise<Appointment | null> {
    try {
      const { data, error } = await supabase
        .from(this.tableName)
        .select('*')
        .eq('id', id)
        .maybeSingle();

      if (error) throw error;
      if (!data) return null;

      return AppointmentSchema.parse(this.mapToAppointment(data));
    } catch (error) {
      logger.error('Failed to find appointment by ID', error as Error, { id });
      throw error;
    }
  }

  async findAll(): Promise<Appointment[]> {
    try {
      const { data, error } = await supabase
        .from(this.tableName)
        .select('*')
        .order('start_time', { ascending: false });

      if (error) throw error;

      return data.map(item => AppointmentSchema.parse(this.mapToAppointment(item)));
    } catch (error) {
      logger.error('Failed to find all appointments', error as Error);
      throw error;
    }
  }

  async findByPatientId(patientId: string): Promise<Appointment[]> {
    try {
      const { data, error } = await supabase
        .from(this.tableName)
        .select('*')
        .eq('patient_id', patientId)
        .order('start_time', { ascending: false });

      if (error) throw error;

      return data.map(item => AppointmentSchema.parse(this.mapToAppointment(item)));
    } catch (error) {
      logger.error('Failed to find appointments by patient ID', error as Error, { patientId });
      throw error;
    }
  }

  async findByDateRange(startDate: string, endDate: string): Promise<Appointment[]> {
    try {
      const { data, error } = await supabase
        .from(this.tableName)
        .select('*')
        .gte('start_time', startDate)
        .lte('start_time', endDate)
        .order('start_time', { ascending: true });

      if (error) throw error;

      return data.map(item => AppointmentSchema.parse(this.mapToAppointment(item)));
    } catch (error) {
      logger.error('Failed to find appointments by date range', error as Error, { startDate, endDate });
      throw error;
    }
  }

  async findUpcoming(limit: number = 10): Promise<Appointment[]> {
    try {
      const now = new Date().toISOString();

      const { data, error } = await supabase
        .from(this.tableName)
        .select('*')
        .gte('start_time', now)
        .in('status', ['scheduled', 'confirmed'])
        .order('start_time', { ascending: true })
        .limit(limit);

      if (error) throw error;

      return data.map(item => AppointmentSchema.parse(this.mapToAppointment(item)));
    } catch (error) {
      logger.error('Failed to find upcoming appointments', error as Error, { limit });
      throw error;
    }
  }

  async create(input: CreateAppointmentInput): Promise<Appointment> {
    try {
      const dbData = this.mapToDatabase(input);

      const { data, error } = await supabase
        .from(this.tableName)
        .insert(dbData)
        .select()
        .single();

      if (error) throw error;

      logger.info('Appointment created', { id: data.id });
      return AppointmentSchema.parse(this.mapToAppointment(data));
    } catch (error) {
      logger.error('Failed to create appointment', error as Error, { input });
      throw error;
    }
  }

  async update(input: UpdateAppointmentInput): Promise<Appointment> {
    try {
      const { id, ...updates } = input;
      const dbData = this.mapToDatabase(updates);

      const { data, error } = await supabase
        .from(this.tableName)
        .update(dbData)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;

      logger.info('Appointment updated', { id });
      return AppointmentSchema.parse(this.mapToAppointment(data));
    } catch (error) {
      logger.error('Failed to update appointment', error as Error, { input });
      throw error;
    }
  }

  async delete(id: string): Promise<void> {
    try {
      const { error } = await supabase
        .from(this.tableName)
        .delete()
        .eq('id', id);

      if (error) throw error;

      logger.info('Appointment deleted', { id });
    } catch (error) {
      logger.error('Failed to delete appointment', error as Error, { id });
      throw error;
    }
  }

  async count(): Promise<number> {
    try {
      const { count, error } = await supabase
        .from(this.tableName)
        .select('*', { count: 'exact', head: true });

      if (error) throw error;

      return count || 0;
    } catch (error) {
      logger.error('Failed to count appointments', error as Error);
      throw error;
    }
  }

  private mapToAppointment(dbData: any): Appointment {
    return {
      id: dbData.id,
      patientId: dbData.patient_id,
      serviceTypeId: dbData.service_type_id,
      startTime: dbData.start_time,
      endTime: dbData.end_time,
      status: dbData.status,
      notes: dbData.notes,
      reminderSent: dbData.reminder_sent || false,
      createdAt: dbData.created_at,
      updatedAt: dbData.updated_at,
    };
  }

  private mapToDatabase(data: Partial<CreateAppointmentInput | UpdateAppointmentInput>): any {
    const result: any = {};

    if (data.patientId !== undefined) result.patient_id = data.patientId;
    if (data.serviceTypeId !== undefined) result.service_type_id = data.serviceTypeId;
    if (data.startTime !== undefined) result.start_time = data.startTime;
    if (data.endTime !== undefined) result.end_time = data.endTime;
    if (data.status !== undefined) result.status = data.status;
    if (data.notes !== undefined) result.notes = data.notes;
    if (data.reminderSent !== undefined) result.reminder_sent = data.reminderSent;

    return result;
  }
}
