export type AppointmentStatus = 'pending' | 'confirmed' | 'completed' | 'cancelled' | 'no_show';

export interface AppointmentProps {
  id?: string;
  contact_id: string | null;
  patient_id?: string | null;
  provider_id: string | null;
  owner_id?: string | null;
  name: string;
  email: string;
  phone: string;
  reason: string;
  patient_age: string | null;
  preferred_time: string | null;
  status: AppointmentStatus;
  scheduled_at: string | null;
  scheduled_date?: string | null;
  scheduled_time?: string | null;
  duration_minutes: number;
  notes: string | null;
  created_at?: string;
  updated_at?: string;
}

export class Appointment {
  readonly id: string;
  readonly contact_id: string | null;
  readonly patient_id: string | null;
  readonly provider_id: string | null;
  readonly owner_id: string | null;
  readonly name: string;
  readonly email: string;
  readonly phone: string;
  readonly reason: string;
  readonly patient_age: string | null;
  readonly preferred_time: string | null;
  readonly status: AppointmentStatus;
  readonly scheduled_at: string | null;
  readonly scheduled_date: string | null;
  readonly scheduled_time: string | null;
  readonly duration_minutes: number;
  readonly notes: string | null;
  readonly created_at: string;
  readonly updated_at: string;

  constructor(props: AppointmentProps) {
    this.id = props.id || crypto.randomUUID();
    this.contact_id = props.contact_id;
    this.patient_id = props.patient_id || null;
    this.provider_id = props.provider_id;
    this.owner_id = props.owner_id || null;
    this.name = props.name;
    this.email = props.email;
    this.phone = props.phone;
    this.reason = props.reason;
    this.patient_age = props.patient_age;
    this.preferred_time = props.preferred_time;
    this.status = props.status;
    this.scheduled_at = props.scheduled_at;
    this.scheduled_date = props.scheduled_date || null;
    this.scheduled_time = props.scheduled_time || null;
    this.duration_minutes = props.duration_minutes || 30;
    this.notes = props.notes;
    this.created_at = props.created_at || new Date().toISOString();
    this.updated_at = props.updated_at || new Date().toISOString();

    this.validate();
  }

  get isPending(): boolean {
    return this.status === 'pending';
  }

  get isConfirmed(): boolean {
    return this.status === 'confirmed';
  }

  get isCompleted(): boolean {
    return this.status === 'completed';
  }

  get isCancelled(): boolean {
    return this.status === 'cancelled';
  }

  get isNoShow(): boolean {
    return this.status === 'no_show';
  }

  get isUpcoming(): boolean {
    if (!this.scheduled_at) return false;
    return new Date(this.scheduled_at) > new Date();
  }

  get isPast(): boolean {
    if (!this.scheduled_at) return false;
    return new Date(this.scheduled_at) <= new Date();
  }

  private validate(): void {
    if (!this.name?.trim()) {
      throw new Error('Name is required');
    }
    if (!this.email?.trim()) {
      throw new Error('Email is required');
    }
    if (!this.phone?.trim()) {
      throw new Error('Phone is required');
    }
    if (!this.reason?.trim()) {
      throw new Error('Reason is required');
    }
    if (this.duration_minutes <= 0) {
      throw new Error('Duration must be positive');
    }
  }

  update(updates: Partial<AppointmentProps>): Appointment {
    return new Appointment({
      ...this.toJSON(),
      ...updates,
      updated_at: new Date().toISOString(),
    });
  }

  confirm(): Appointment {
    return this.update({ status: 'confirmed' });
  }

  complete(): Appointment {
    return this.update({ status: 'completed' });
  }

  cancel(): Appointment {
    return this.update({ status: 'cancelled' });
  }

  markNoShow(): Appointment {
    return this.update({ status: 'no_show' });
  }

  reschedule(scheduled_at: string, scheduled_date?: string, scheduled_time?: string): Appointment {
    return this.update({
      scheduled_at,
      scheduled_date,
      scheduled_time,
      status: 'pending',
    });
  }

  toJSON(): AppointmentProps {
    return {
      id: this.id,
      contact_id: this.contact_id,
      patient_id: this.patient_id,
      provider_id: this.provider_id,
      owner_id: this.owner_id,
      name: this.name,
      email: this.email,
      phone: this.phone,
      reason: this.reason,
      patient_age: this.patient_age,
      preferred_time: this.preferred_time,
      status: this.status,
      scheduled_at: this.scheduled_at,
      scheduled_date: this.scheduled_date,
      scheduled_time: this.scheduled_time,
      duration_minutes: this.duration_minutes,
      notes: this.notes,
      created_at: this.created_at,
      updated_at: this.updated_at,
    };
  }
}
