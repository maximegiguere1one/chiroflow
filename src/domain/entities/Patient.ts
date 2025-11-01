export type PatientStatus = 'active' | 'inactive' | 'archived';
export type Gender = 'male' | 'female' | 'other' | 'prefer_not_to_say';

export interface PatientProps {
  id?: string;
  first_name: string;
  last_name: string;
  email: string | null;
  phone: string | null;
  date_of_birth: string | null;
  gender: Gender;
  address: string | null;
  medical_history: string | null;
  medications: string | null;
  allergies: string | null;
  status: PatientStatus;
  last_visit: string | null;
  total_visits: number;
  created_at?: string;
  updated_at?: string;
}

export class Patient {
  readonly id: string;
  readonly first_name: string;
  readonly last_name: string;
  readonly email: string | null;
  readonly phone: string | null;
  readonly date_of_birth: string | null;
  readonly gender: Gender;
  readonly address: string | null;
  readonly medical_history: string | null;
  readonly medications: string | null;
  readonly allergies: string | null;
  readonly status: PatientStatus;
  readonly last_visit: string | null;
  readonly total_visits: number;
  readonly created_at: string;
  readonly updated_at: string;

  constructor(props: PatientProps) {
    this.id = props.id || crypto.randomUUID();
    this.first_name = props.first_name;
    this.last_name = props.last_name;
    this.email = props.email;
    this.phone = props.phone;
    this.date_of_birth = props.date_of_birth;
    this.gender = props.gender;
    this.address = props.address;
    this.medical_history = props.medical_history;
    this.medications = props.medications;
    this.allergies = props.allergies;
    this.status = props.status;
    this.last_visit = props.last_visit;
    this.total_visits = props.total_visits;
    this.created_at = props.created_at || new Date().toISOString();
    this.updated_at = props.updated_at || new Date().toISOString();

    this.validate();
  }

  get fullName(): string {
    return `${this.first_name} ${this.last_name}`.trim();
  }

  get age(): number | null {
    if (!this.date_of_birth) return null;
    const birthDate = new Date(this.date_of_birth);
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    return age;
  }

  get isActive(): boolean {
    return this.status === 'active';
  }

  get hasContactInfo(): boolean {
    return !!(this.email || this.phone);
  }

  get hasCriticalInfo(): boolean {
    return !!(this.allergies || this.medications);
  }

  private validate(): void {
    if (!this.first_name?.trim()) {
      throw new Error('First name is required');
    }
    if (!this.last_name?.trim()) {
      throw new Error('Last name is required');
    }
    if (this.email && !this.isValidEmail(this.email)) {
      throw new Error('Invalid email format');
    }
    if (this.phone && !this.isValidPhone(this.phone)) {
      throw new Error('Invalid phone format');
    }
    if (this.total_visits < 0) {
      throw new Error('Total visits cannot be negative');
    }
  }

  private isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  private isValidPhone(phone: string): boolean {
    const phoneRegex = /^[\d\s\-\+\(\)]+$/;
    return phoneRegex.test(phone) && phone.replace(/\D/g, '').length >= 10;
  }

  update(updates: Partial<PatientProps>): Patient {
    return new Patient({
      ...this.toJSON(),
      ...updates,
      updated_at: new Date().toISOString(),
    });
  }

  archive(): Patient {
    return this.update({ status: 'archived' });
  }

  activate(): Patient {
    return this.update({ status: 'active' });
  }

  deactivate(): Patient {
    return this.update({ status: 'inactive' });
  }

  incrementVisits(): Patient {
    return this.update({
      total_visits: this.total_visits + 1,
      last_visit: new Date().toISOString(),
    });
  }

  toJSON(): PatientProps {
    return {
      id: this.id,
      first_name: this.first_name,
      last_name: this.last_name,
      email: this.email,
      phone: this.phone,
      date_of_birth: this.date_of_birth,
      gender: this.gender,
      address: this.address,
      medical_history: this.medical_history,
      medications: this.medications,
      allergies: this.allergies,
      status: this.status,
      last_visit: this.last_visit,
      total_visits: this.total_visits,
      created_at: this.created_at,
      updated_at: this.updated_at,
    };
  }
}
