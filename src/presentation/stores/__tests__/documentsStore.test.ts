import { describe, it, expect, beforeEach, vi } from 'vitest';
import { createMockDocument } from '../../../test/testUtils';

const mockSupabase = {
  from: vi.fn(),
  channel: vi.fn().mockReturnValue({
    on: vi.fn().mockReturnThis(),
    subscribe: vi.fn((cb) => { if (cb) cb('SUBSCRIBED'); return { unsubscribe: vi.fn() }; }),
    unsubscribe: vi.fn(),
  }),
  storage: {
    from: vi.fn().mockReturnValue({
      upload: vi.fn().mockResolvedValue({ error: null }),
      getPublicUrl: vi.fn().mockReturnValue({ data: { publicUrl: 'https://example.com/test.pdf' } }),
    }),
  },
  auth: { getUser: vi.fn(), getSession: vi.fn() },
  rpc: vi.fn(),
};

vi.mock('../../../lib/supabase', () => ({ supabase: mockSupabase }));

const { useDocumentsStore } = await import('../documentsStore');

describe('DocumentsStore', () => {
  beforeEach(() => {
    useDocumentsStore.getState().reset();
    vi.clearAllMocks();
  });

  it('should have correct initial state', () => {
    const state = useDocumentsStore.getState();
    expect(state.documents).toEqual([]);
    expect(state.loading).toBe(false);
    expect(state.uploading).toBe(false);
    expect(state.isRealtimeActive).toBe(false);
  });

  it('should load documents successfully', async () => {
    const mockDocs = [
      createMockDocument({ id: '1', name: 'doc1.pdf' }),
      createMockDocument({ id: '2', name: 'doc2.pdf' }),
    ];

    vi.mocked(mockSupabase.from).mockReturnValue({
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      order: vi.fn().mockResolvedValue({ data: mockDocs, error: null }),
    } as any);

    await useDocumentsStore.getState().loadDocuments('patient-1');

    const state = useDocumentsStore.getState();
    expect(state.documents).toHaveLength(2);
    expect(state.selectedContactId).toBe('patient-1');
  });

  it('should upload document successfully', async () => {
    const mockFile = new File(['content'], 'test.pdf', { type: 'application/pdf' });
    const mockDoc = createMockDocument({ name: 'test.pdf' });

    vi.mocked(mockSupabase.from).mockReturnValue({
      insert: vi.fn().mockReturnThis(),
      select: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({ data: mockDoc, error: null }),
    } as any);

    const result = await useDocumentsStore.getState().uploadDocument(mockFile, {
      contact_id: 'patient-1',
      type: 'consent_form',
    });

    expect(result.name).toBe('test.pdf');
    expect(useDocumentsStore.getState().documents).toHaveLength(1);
  });

  it('should enable and disable realtime', () => {
    const store = useDocumentsStore.getState();

    store.enableRealtime();
    expect(store.isRealtimeActive).toBe(true);

    store.disableRealtime();
    expect(useDocumentsStore.getState().isRealtimeActive).toBe(false);
  });

  it('should filter documents by type', () => {
    const docs = [
      createMockDocument({ id: '1', type: 'consent_form' }),
      createMockDocument({ id: '2', type: 'xray' }),
      createMockDocument({ id: '3', type: 'consent_form' }),
    ];

    useDocumentsStore.setState({ documents: docs });

    const consentForms = useDocumentsStore.getState().getDocumentsByType('consent_form');
    expect(consentForms).toHaveLength(2);
  });

  it('should search documents', () => {
    const docs = [
      createMockDocument({ id: '1', name: 'consent.pdf', tags: ['legal'] }),
      createMockDocument({ id: '2', name: 'xray.jpg', tags: ['medical'] }),
    ];

    useDocumentsStore.setState({ documents: docs });

    const results = useDocumentsStore.getState().searchDocuments('consent');
    expect(results).toHaveLength(1);
    expect(results[0].name).toBe('consent.pdf');
  });
});
