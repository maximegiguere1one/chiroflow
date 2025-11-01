import { vi } from 'vitest';
import type { SupabaseClient } from '@supabase/supabase-js';

export function createMockSupabaseClient(): Partial<SupabaseClient> {
  return {
    from: vi.fn().mockReturnValue({
      select: vi.fn().mockReturnThis(),
      insert: vi.fn().mockReturnThis(),
      update: vi.fn().mockReturnThis(),
      delete: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      neq: vi.fn().mockReturnThis(),
      gte: vi.fn().mockReturnThis(),
      lte: vi.fn().mockReturnThis(),
      in: vi.fn().mockReturnThis(),
      order: vi.fn().mockReturnThis(),
      range: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({ data: null, error: null }),
      maybeSingle: vi.fn().mockResolvedValue({ data: null, error: null }),
    }),
    channel: vi.fn().mockReturnValue({
      on: vi.fn().mockReturnThis(),
      subscribe: vi.fn().mockImplementation((callback) => {
        if (typeof callback === 'function') {
          callback('SUBSCRIBED');
        }
        return {
          unsubscribe: vi.fn(),
        };
      }),
      unsubscribe: vi.fn(),
    }),
    storage: {
      from: vi.fn().mockReturnValue({
        upload: vi.fn().mockResolvedValue({ data: {}, error: null }),
        download: vi.fn().mockResolvedValue({ data: new Blob(), error: null }),
        remove: vi.fn().mockResolvedValue({ data: {}, error: null }),
        getPublicUrl: vi.fn().mockReturnValue({
          data: { publicUrl: 'https://example.com/file.pdf' },
        }),
      }),
    },
    auth: {
      getUser: vi.fn().mockResolvedValue({
        data: { user: { id: 'test-user-id' } },
        error: null,
      }),
      getSession: vi.fn().mockResolvedValue({
        data: { session: { user: { id: 'test-user-id' } } },
        error: null,
      }),
    },
    rpc: vi.fn().mockResolvedValue({ data: null, error: null }),
  } as any;
}

export function createMockPatient(overrides = {}) {
  return {
    id: 'patient-1',
    full_name: 'John Doe',
    email: 'john@example.com',
    phone: '555-1234',
    date_of_birth: '1990-01-01',
    status: 'active',
    address: '123 Main St',
    notes: 'Test patient',
    owner_id: 'owner-1',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    ...overrides,
  };
}

export function createMockAppointment(overrides = {}) {
  return {
    id: 'appointment-1',
    contact_id: 'patient-1',
    patient_id: 'patient-1',
    name: 'John Doe',
    email: 'john@example.com',
    phone: '555-1234',
    reason: 'Checkup',
    status: 'scheduled',
    scheduled_at: new Date().toISOString(),
    scheduled_date: new Date().toISOString().split('T')[0],
    scheduled_time: '14:00',
    duration_minutes: 30,
    notes: 'Regular checkup',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    ...overrides,
  };
}

export function createMockDocument(overrides = {}) {
  return {
    id: 'doc-1',
    contact_id: 'patient-1',
    owner_id: 'owner-1',
    name: 'consent_form.pdf',
    type: 'consent_form' as const,
    category: 'Legal',
    file_url: 'https://example.com/file.pdf',
    file_size: 1024,
    mime_type: 'application/pdf',
    uploaded_by: 'user-1',
    tags: ['consent', 'signed'],
    metadata: {},
    is_archived: false,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    ...overrides,
  };
}

export function createMockMessage(overrides = {}) {
  return {
    id: 'msg-1',
    contact_id: 'patient-1',
    owner_id: 'owner-1',
    subject: 'Appointment Reminder',
    body: 'Your appointment is tomorrow',
    type: 'email' as const,
    direction: 'outbound' as const,
    status: 'sent' as const,
    scheduled_for: null,
    sent_at: new Date().toISOString(),
    read_at: null,
    metadata: {},
    template_id: null,
    parent_message_id: null,
    thread_id: null,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    ...overrides,
  };
}

export function createMockWaitlistEntry(overrides = {}) {
  return {
    id: 'wait-1',
    contact_id: 'patient-1',
    owner_id: 'owner-1',
    full_name: 'Jane Doe',
    email: 'jane@example.com',
    phone: '555-5678',
    preferred_date: '2025-11-15',
    preferred_time: '10:00',
    flexible: true,
    priority: 'medium' as const,
    status: 'pending' as const,
    notes: null,
    waitlist_type: 'regular' as const,
    service_type: 'consultation',
    expires_at: null,
    contacted_at: null,
    scheduled_at: null,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    ...overrides,
  };
}

export function createMockInvoice(overrides = {}) {
  return {
    id: 'inv-1',
    contact_id: 'patient-1',
    amount: 100,
    currency: 'CAD',
    status: 'sent' as const,
    due_date: '2025-12-01',
    invoice_number: 'INV-001',
    line_items: [{ description: 'Consultation', amount: 100 }],
    notes: null,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    ...overrides,
  };
}

export function createMockPayment(overrides = {}) {
  return {
    id: 'pay-1',
    contact_id: 'patient-1',
    amount: 100,
    currency: 'CAD',
    payment_method: 'card',
    status: 'completed' as const,
    transaction_id: 'txn_123',
    stripe_payment_intent_id: 'pi_123',
    metadata: {},
    created_at: new Date().toISOString(),
    ...overrides,
  };
}

export function waitFor(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export function flushPromises() {
  return new Promise((resolve) => setImmediate(resolve));
}
