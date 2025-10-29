import type { IPatientRepository } from '../../domain/repositories/IPatientRepository';
import type { Patient, CreatePatientInput, UpdatePatientInput } from '../../domain/entities/Patient';
import { PatientSchema } from '../../domain/entities/Patient';
import { supabase } from '../../lib/supabase';
import { logger } from '../monitoring/Logger';

export class SupabasePatientRepository implements IPatientRepository {
  private readonly tableName = 'contacts';

  async findById(id: string): Promise<Patient | null> {
    try {
      const { data, error } = await supabase
        .from(this.tableName)
        .select('*')
        .eq('id', id)
        .maybeSingle();

      if (error) throw error;
      if (!data) return null;

      return PatientSchema.parse(this.mapToPatient(data));
    } catch (error) {
      logger.error('Failed to find patient by ID', error as Error, { id });
      throw error;
    }
  }

  async findAll(): Promise<Patient[]> {
    try {
      const { data, error } = await supabase
        .from(this.tableName)
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;

      return data.map(item => PatientSchema.parse(this.mapToPatient(item)));
    } catch (error) {
      logger.error('Failed to find all patients', error as Error);
      throw error;
    }
  }

  async findByEmail(email: string): Promise<Patient | null> {
    try {
      const { data, error } = await supabase
        .from(this.tableName)
        .select('*')
        .eq('email', email)
        .maybeSingle();

      if (error) throw error;
      if (!data) return null;

      return PatientSchema.parse(this.mapToPatient(data));
    } catch (error) {
      logger.error('Failed to find patient by email', error as Error, { email });
      throw error;
    }
  }

  async search(query: string): Promise<Patient[]> {
    try {
      const { data, error } = await supabase
        .from(this.tableName)
        .select('*')
        .or(`first_name.ilike.%${query}%,last_name.ilike.%${query}%,email.ilike.%${query}%`)
        .order('created_at', { ascending: false });

      if (error) throw error;

      return data.map(item => PatientSchema.parse(this.mapToPatient(item)));
    } catch (error) {
      logger.error('Failed to search patients', error as Error, { query });
      throw error;
    }
  }

  async create(input: CreatePatientInput): Promise<Patient> {
    try {
      const dbData = this.mapToDatabase(input);

      const { data, error } = await supabase
        .from(this.tableName)
        .insert(dbData)
        .select()
        .single();

      if (error) throw error;

      logger.info('Patient created', { id: data.id });
      return PatientSchema.parse(this.mapToPatient(data));
    } catch (error) {
      logger.error('Failed to create patient', error as Error, { input });
      throw error;
    }
  }

  async update(input: UpdatePatientInput): Promise<Patient> {
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

      logger.info('Patient updated', { id });
      return PatientSchema.parse(this.mapToPatient(data));
    } catch (error) {
      logger.error('Failed to update patient', error as Error, { input });
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

      logger.info('Patient deleted', { id });
    } catch (error) {
      logger.error('Failed to delete patient', error as Error, { id });
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
      logger.error('Failed to count patients', error as Error);
      throw error;
    }
  }

  private mapToPatient(dbData: any): Patient {
    return {
      id: dbData.id,
      firstName: dbData.first_name,
      lastName: dbData.last_name,
      email: dbData.email,
      phone: dbData.phone,
      dateOfBirth: dbData.date_of_birth,
      address: dbData.address,
      emergencyContact: dbData.emergency_contact,
      emergencyPhone: dbData.emergency_phone,
      notes: dbData.notes,
      createdAt: dbData.created_at,
      updatedAt: dbData.updated_at,
    };
  }

  private mapToDatabase(data: Partial<CreatePatientInput | UpdatePatientInput>): any {
    const result: any = {};

    if (data.firstName !== undefined) result.first_name = data.firstName;
    if (data.lastName !== undefined) result.last_name = data.lastName;
    if (data.email !== undefined) result.email = data.email;
    if (data.phone !== undefined) result.phone = data.phone;
    if (data.dateOfBirth !== undefined) result.date_of_birth = data.dateOfBirth;
    if (data.address !== undefined) result.address = data.address;
    if (data.emergencyContact !== undefined) result.emergency_contact = data.emergencyContact;
    if (data.emergencyPhone !== undefined) result.emergency_phone = data.emergencyPhone;
    if (data.notes !== undefined) result.notes = data.notes;

    return result;
  }
}
