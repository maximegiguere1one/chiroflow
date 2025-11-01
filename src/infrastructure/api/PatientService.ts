import { apiClient } from './ApiClient';
import { SupabasePatientRepository } from '../repositories/SupabasePatientRepository';
import {
  CreatePatientUseCase,
  UpdatePatientUseCase,
  DeletePatientUseCase,
  GetPatientUseCase,
  ListPatientsUseCase,
} from '../../application/use-cases/patient';
import { CreatePatientDTO, UpdatePatientDTO, PatientResponseDTO } from '../../application/dto/PatientDTO';
import { PatientFilters } from '../../domain/repositories/IPatientRepository';

export class PatientService {
  private repository: SupabasePatientRepository;
  private createUseCase: CreatePatientUseCase;
  private updateUseCase: UpdatePatientUseCase;
  private deleteUseCase: DeletePatientUseCase;
  private getUseCase: GetPatientUseCase;
  private listUseCase: ListPatientsUseCase;

  constructor() {
    this.repository = new SupabasePatientRepository();
    this.createUseCase = new CreatePatientUseCase(this.repository);
    this.updateUseCase = new UpdatePatientUseCase(this.repository);
    this.deleteUseCase = new DeletePatientUseCase(this.repository);
    this.getUseCase = new GetPatientUseCase(this.repository);
    this.listUseCase = new ListPatientsUseCase(this.repository);
  }

  async createPatient(dto: CreatePatientDTO): Promise<PatientResponseDTO> {
    return apiClient.executeWithRetry(() => this.createUseCase.execute(dto));
  }

  async updatePatient(id: string, dto: UpdatePatientDTO): Promise<PatientResponseDTO> {
    return apiClient.executeWithRetry(() => this.updateUseCase.execute(id, dto));
  }

  async deletePatient(id: string): Promise<void> {
    return apiClient.executeWithRetry(() => this.deleteUseCase.execute(id));
  }

  async getPatient(id: string): Promise<PatientResponseDTO | null> {
    return apiClient.executeWithRetry(() => this.getUseCase.execute(id));
  }

  async listPatients(filters?: PatientFilters) {
    return apiClient.executeWithRetry(() => this.listUseCase.execute(filters));
  }
}

export const patientService = new PatientService();
