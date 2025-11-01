import { supabase } from '../../lib/supabase';
import { Patient, PatientProps } from '../../domain/entities/Patient';
import { IPatientRepository, PatientFilters } from '../../domain/repositories/IPatientRepository';

export class SupabasePatientRepository implements IPatientRepository {
  private tableName = 'patients_full';

  async create(patient: Patient): Promise<Patient> {
    const patientData = patient.toJSON();

    const { data, error } = await supabase
      .from(this.tableName)
      .insert({
        id: patientData.id,
        first_name: patientData.first_name,
        last_name: patientData.last_name,
        email: patientData.email,
        phone: patientData.phone,
        date_of_birth: patientData.date_of_birth,
        gender: patientData.gender,
        address: patientData.address,
        medical_history: patientData.medical_history,
        medications: patientData.medications,
        allergies: patientData.allergies,
        status: patientData.status,
        last_visit: patientData.last_visit,
        total_visits: patientData.total_visits,
      })
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to create patient: ${error.message}`);
    }

    return this.toDomainModel(data);
  }

  async findById(id: string): Promise<Patient | null> {
    const { data, error } = await supabase
      .from(this.tableName)
      .select('*')
      .eq('id', id)
      .maybeSingle();

    if (error) {
      throw new Error(`Failed to fetch patient: ${error.message}`);
    }

    return data ? this.toDomainModel(data) : null;
  }

  async findAll(filters?: PatientFilters): Promise<Patient[]> {
    let query = supabase.from(this.tableName).select('*');

    if (filters?.status) {
      query = query.eq('status', filters.status);
    }

    if (filters?.search) {
      const searchTerm = `%${filters.search}%`;
      query = query.or(
        `first_name.ilike.${searchTerm},last_name.ilike.${searchTerm},email.ilike.${searchTerm},phone.ilike.${searchTerm}`
      );
    }

    if (filters?.limit) {
      query = query.limit(filters.limit);
    }

    if (filters?.offset) {
      query = query.range(filters.offset, filters.offset + (filters.limit || 50) - 1);
    }

    query = query.order('created_at', { ascending: false });

    const { data, error } = await query;

    if (error) {
      throw new Error(`Failed to fetch patients: ${error.message}`);
    }

    return (data || []).map(item => this.toDomainModel(item));
  }

  async update(id: string, updates: Partial<PatientProps>): Promise<Patient> {
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
      throw new Error(`Failed to update patient: ${error.message}`);
    }

    return this.toDomainModel(data);
  }

  async delete(id: string): Promise<void> {
    const { error } = await supabase
      .from(this.tableName)
      .delete()
      .eq('id', id);

    if (error) {
      throw new Error(`Failed to delete patient: ${error.message}`);
    }
  }

  async count(filters?: PatientFilters): Promise<number> {
    let query = supabase
      .from(this.tableName)
      .select('*', { count: 'exact', head: true });

    if (filters?.status) {
      query = query.eq('status', filters.status);
    }

    if (filters?.search) {
      const searchTerm = `%${filters.search}%`;
      query = query.or(
        `first_name.ilike.${searchTerm},last_name.ilike.${searchTerm},email.ilike.${searchTerm},phone.ilike.${searchTerm}`
      );
    }

    const { count, error } = await query;

    if (error) {
      throw new Error(`Failed to count patients: ${error.message}`);
    }

    return count || 0;
  }

  private toDomainModel(data: any): Patient {
    return new Patient({
      id: data.id,
      first_name: data.first_name,
      last_name: data.last_name,
      email: data.email,
      phone: data.phone,
      date_of_birth: data.date_of_birth,
      gender: data.gender,
      address: data.address,
      medical_history: data.medical_history,
      medications: data.medications,
      allergies: data.allergies,
      status: data.status,
      last_visit: data.last_visit,
      total_visits: data.total_visits,
      created_at: data.created_at,
      updated_at: data.updated_at,
    });
  }
}
