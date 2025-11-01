import { supabase } from '../../lib/supabase';
import { Appointment, AppointmentProps } from '../../domain/entities/Appointment';
import { IAppointmentRepository, AppointmentFilters } from '../../domain/repositories/IAppointmentRepository';

export class SupabaseAppointmentRepository implements IAppointmentRepository {
  private tableName = 'appointments_api';

  async create(appointment: Appointment): Promise<Appointment> {
    const appointmentData = appointment.toJSON();

    const { data, error } = await supabase
      .from(this.tableName)
      .insert({
        id: appointmentData.id,
        contact_id: appointmentData.contact_id,
        patient_id: appointmentData.patient_id,
        provider_id: appointmentData.provider_id,
        owner_id: appointmentData.owner_id,
        name: appointmentData.name,
        email: appointmentData.email,
        phone: appointmentData.phone,
        reason: appointmentData.reason,
        patient_age: appointmentData.patient_age,
        preferred_time: appointmentData.preferred_time,
        status: appointmentData.status,
        scheduled_at: appointmentData.scheduled_at,
        scheduled_date: appointmentData.scheduled_date,
        scheduled_time: appointmentData.scheduled_time,
        duration_minutes: appointmentData.duration_minutes,
        notes: appointmentData.notes,
      })
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to create appointment: ${error.message}`);
    }

    return this.toDomainModel(data);
  }

  async findById(id: string): Promise<Appointment | null> {
    const { data, error } = await supabase
      .from(this.tableName)
      .select('*')
      .eq('id', id)
      .maybeSingle();

    if (error) {
      throw new Error(`Failed to fetch appointment: ${error.message}`);
    }

    return data ? this.toDomainModel(data) : null;
  }

  async findAll(filters?: AppointmentFilters): Promise<Appointment[]> {
    let query = supabase.from(this.tableName).select('*');

    if (filters?.status) {
      query = query.eq('status', filters.status);
    }

    if (filters?.patient_id) {
      query = query.eq('patient_id', filters.patient_id);
    }

    if (filters?.contact_id) {
      query = query.eq('contact_id', filters.contact_id);
    }

    if (filters?.provider_id) {
      query = query.eq('provider_id', filters.provider_id);
    }

    if (filters?.start_date) {
      query = query.gte('scheduled_at', filters.start_date);
    }

    if (filters?.end_date) {
      query = query.lte('scheduled_at', filters.end_date);
    }

    if (filters?.limit) {
      query = query.limit(filters.limit);
    }

    if (filters?.offset) {
      query = query.range(filters.offset, filters.offset + (filters.limit || 50) - 1);
    }

    query = query.order('scheduled_at', { ascending: true });

    const { data, error } = await query;

    if (error) {
      throw new Error(`Failed to fetch appointments: ${error.message}`);
    }

    return (data || []).map(item => this.toDomainModel(item));
  }

  async update(id: string, updates: Partial<AppointmentProps>): Promise<Appointment> {
    const updateData: Record<string, unknown> = {
      ...updates,
      updated_at: new Date().toISOString(),
    };

    const { data, error } = await supabase
      .from(this.tableName)
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to update appointment: ${error.message}`);
    }

    return this.toDomainModel(data);
  }

  async delete(id: string): Promise<void> {
    const { error } = await supabase
      .from(this.tableName)
      .delete()
      .eq('id', id);

    if (error) {
      throw new Error(`Failed to delete appointment: ${error.message}`);
    }
  }

  async count(filters?: AppointmentFilters): Promise<number> {
    let query = supabase
      .from(this.tableName)
      .select('*', { count: 'exact', head: true });

    if (filters?.status) {
      query = query.eq('status', filters.status);
    }

    if (filters?.patient_id) {
      query = query.eq('patient_id', filters.patient_id);
    }

    if (filters?.contact_id) {
      query = query.eq('contact_id', filters.contact_id);
    }

    if (filters?.provider_id) {
      query = query.eq('provider_id', filters.provider_id);
    }

    if (filters?.start_date) {
      query = query.gte('scheduled_at', filters.start_date);
    }

    if (filters?.end_date) {
      query = query.lte('scheduled_at', filters.end_date);
    }

    const { count, error } = await query;

    if (error) {
      throw new Error(`Failed to count appointments: ${error.message}`);
    }

    return count || 0;
  }

  private toDomainModel(data: any): Appointment {
    return new Appointment({
      id: data.id,
      contact_id: data.contact_id,
      patient_id: data.patient_id,
      provider_id: data.provider_id,
      owner_id: data.owner_id,
      name: data.name,
      email: data.email,
      phone: data.phone,
      reason: data.reason,
      patient_age: data.patient_age,
      preferred_time: data.preferred_time,
      status: data.status,
      scheduled_at: data.scheduled_at,
      scheduled_date: data.scheduled_date,
      scheduled_time: data.scheduled_time,
      duration_minutes: data.duration_minutes,
      notes: data.notes,
      created_at: data.created_at,
      updated_at: data.updated_at,
    });
  }
}
