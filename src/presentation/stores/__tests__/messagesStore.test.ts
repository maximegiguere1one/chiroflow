import { describe, it, expect, beforeEach, vi } from 'vitest';
import { useMessagesStore } from '../messagesStore';
import { createMockSupabaseClient, createMockMessage } from '../../../test/testUtils';

vi.mock('../../../lib/supabase', () => ({
  supabase: createMockSupabaseClient(),
}));

describe('MessagesStore', () => {
  beforeEach(() => {
    useMessagesStore.getState().reset();
    vi.clearAllMocks();
  });

  it('should have correct initial state', () => {
    const state = useMessagesStore.getState();
    expect(state.messages).toEqual([]);
    expect(state.templates).toEqual([]);
    expect(state.sending).toBe(false);
    expect(state.unreadCount).toBe(0);
  });

  it('should send message successfully', async () => {
    const mockMessage = createMockMessage({ subject: 'Test' });

    const { supabase } = await import('../../../lib/supabase');
    vi.mocked(supabase.from).mockReturnValue({
      insert: vi.fn().mockReturnThis(),
      select: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({ data: mockMessage, error: null }),
    } as any);

    const result = await useMessagesStore.getState().sendMessage({
      contact_id: 'patient-1',
      subject: 'Test',
      body: 'Hello',
      type: 'email',
    });

    expect(result.subject).toBe('Test');
    expect(useMessagesStore.getState().messages).toHaveLength(1);
  });

  it('should schedule message', async () => {
    const scheduledMessage = createMockMessage({
      status: 'draft',
      scheduled_for: '2025-11-15T10:00:00Z',
    });

    const { supabase } = await import('../../../lib/supabase');
    vi.mocked(supabase.from).mockReturnValue({
      insert: vi.fn().mockReturnThis(),
      select: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({ data: scheduledMessage, error: null }),
    } as any);

    const result = await useMessagesStore.getState().scheduleMessage(
      {
        contact_id: 'patient-1',
        subject: 'Reminder',
        body: 'Your appointment',
        type: 'email',
      },
      '2025-11-15T10:00:00Z'
    );

    expect(result.status).toBe('draft');
    expect(result.scheduled_for).toBeTruthy();
  });

  it('should apply template with variables', () => {
    const template = {
      id: 'template-1',
      name: 'Appointment Reminder',
      type: 'email' as const,
      subject: 'Your appointment',
      body: 'Hi {{patient_name}}, your appointment is on {{date}}',
      variables: ['patient_name', 'date'],
      category: 'reminders',
      is_active: true,
      created_at: new Date().toISOString(),
    };

    useMessagesStore.setState({ templates: [template] });

    const result = useMessagesStore.getState().applyTemplate('template-1', {
      patient_name: 'John Doe',
      date: 'November 15th',
    });

    expect(result).toBe('Hi John Doe, your appointment is on November 15th');
  });

  it('should mark message as read', async () => {
    const message = createMockMessage({ id: 'msg-1', status: 'delivered' });
    useMessagesStore.setState({ messages: [message] });

    const { supabase } = await import('../../../lib/supabase');
    vi.mocked(supabase.from).mockReturnValue({
      update: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      select: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({
        data: { ...message, status: 'read' },
        error: null,
      }),
    } as any);

    await useMessagesStore.getState().markAsRead('msg-1');

    const state = useMessagesStore.getState();
    expect(state.messages[0].status).toBe('read');
  });

  it('should search messages', () => {
    const messages = [
      createMockMessage({ id: '1', subject: 'Appointment', body: 'Reminder' }),
      createMockMessage({ id: '2', subject: 'Invoice', body: 'Payment due' }),
    ];

    useMessagesStore.setState({ messages });

    const results = useMessagesStore.getState().searchMessages('appointment');
    expect(results).toHaveLength(1);
    expect(results[0].subject).toBe('Appointment');
  });
});
