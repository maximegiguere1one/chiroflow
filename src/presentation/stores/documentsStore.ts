import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';
import { supabase } from '../../lib/supabase';
import type { RealtimeChannel } from '@supabase/supabase-js';

interface Document {
  id: string;
  contact_id: string;
  owner_id: string;
  name: string;
  type: 'consent_form' | 'treatment_plan' | 'medical_history' | 'invoice' | 'xray' | 'report' | 'other';
  category: string | null;
  file_url: string;
  file_size: number;
  mime_type: string;
  uploaded_by: string;
  tags: string[];
  metadata: Record<string, any>;
  is_archived: boolean;
  created_at: string;
  updated_at: string;
}

interface DocumentState {
  documents: Document[];
  selectedContactId: string | null;
  loading: boolean;
  uploading: boolean;
  error: Error | null;
  filters: {
    type?: string;
    category?: string;
    tags?: string[];
    archived?: boolean;
  };
  realtimeChannel: RealtimeChannel | null;
  isRealtimeActive: boolean;
}

interface DocumentActions {
  loadDocuments: (contactId?: string) => Promise<void>;
  uploadDocument: (file: File, metadata: Partial<Document>) => Promise<Document>;
  updateDocument: (id: string, updates: Partial<Document>) => Promise<Document>;
  deleteDocument: (id: string) => Promise<void>;
  archiveDocument: (id: string) => Promise<void>;
  unarchiveDocument: (id: string) => Promise<void>;
  downloadDocument: (document: Document) => Promise<void>;
  setFilters: (filters: DocumentState['filters']) => void;
  setSelectedContact: (contactId: string | null) => void;
  searchDocuments: (query: string) => Document[];
  getDocumentsByType: (type: string) => Document[];
  refresh: () => Promise<void>;
  enableRealtime: () => void;
  disableRealtime: () => void;
  reset: () => void;
}

type DocumentStore = DocumentState & DocumentActions;

const initialState: DocumentState = {
  documents: [],
  selectedContactId: null,
  loading: false,
  uploading: false,
  error: null,
  filters: {},
  realtimeChannel: null,
  isRealtimeActive: false,
};

export const useDocumentsStore = create<DocumentStore>()(
  devtools(
    immer((set, get) => ({
      ...initialState,

      loadDocuments: async (contactId?: string) => {
        set((state) => {
          state.loading = true;
          state.error = null;
        });

        try {
          let query = supabase
            .from('patient_documents')
            .select('*')
            .order('created_at', { ascending: false });

          const { filters } = get();

          if (contactId) {
            query = query.eq('contact_id', contactId);
          }

          if (filters.type) {
            query = query.eq('type', filters.type);
          }

          if (filters.category) {
            query = query.eq('category', filters.category);
          }

          if (filters.archived !== undefined) {
            query = query.eq('is_archived', filters.archived);
          } else {
            query = query.eq('is_archived', false);
          }

          const { data, error } = await query;

          if (error) throw error;

          set((state) => {
            state.documents = data || [];
            state.loading = false;
            if (contactId) {
              state.selectedContactId = contactId;
            }
          });
        } catch (error) {
          set((state) => {
            state.error = error as Error;
            state.loading = false;
          });
          throw error;
        }
      },

      uploadDocument: async (file: File, metadata: Partial<Document>) => {
        set((state) => {
          state.uploading = true;
          state.error = null;
        });

        try {
          const fileExt = file.name.split('.').pop();
          const fileName = `${Date.now()}_${Math.random().toString(36).substring(7)}.${fileExt}`;
          const filePath = `documents/${metadata.contact_id}/${fileName}`;

          const { error: uploadError } = await supabase.storage
            .from('patient-documents')
            .upload(filePath, file);

          if (uploadError) throw uploadError;

          const { data: urlData } = supabase.storage
            .from('patient-documents')
            .getPublicUrl(filePath);

          const documentData = {
            ...metadata,
            name: file.name,
            file_url: urlData.publicUrl,
            file_size: file.size,
            mime_type: file.type,
            tags: metadata.tags || [],
            metadata: metadata.metadata || {},
            is_archived: false,
          };

          const { data, error } = await supabase
            .from('patient_documents')
            .insert(documentData)
            .select()
            .single();

          if (error) throw error;

          set((state) => {
            state.documents = [data, ...state.documents];
            state.uploading = false;
          });

          return data;
        } catch (error) {
          set((state) => {
            state.error = error as Error;
            state.uploading = false;
          });
          throw error;
        }
      },

      updateDocument: async (id: string, updates: Partial<Document>) => {
        set((state) => {
          state.loading = true;
          state.error = null;
        });

        try {
          const { data, error } = await supabase
            .from('patient_documents')
            .update(updates)
            .eq('id', id)
            .select()
            .single();

          if (error) throw error;

          set((state) => {
            const index = state.documents.findIndex((d) => d.id === id);
            if (index !== -1) {
              state.documents[index] = data;
            }
            state.loading = false;
          });

          return data;
        } catch (error) {
          set((state) => {
            state.error = error as Error;
            state.loading = false;
          });
          throw error;
        }
      },

      deleteDocument: async (id: string) => {
        set((state) => {
          state.loading = true;
          state.error = null;
        });

        try {
          const document = get().documents.find((d) => d.id === id);
          if (!document) throw new Error('Document not found');

          if (document.file_url) {
            const filePath = document.file_url.split('/').slice(-3).join('/');
            await supabase.storage.from('patient-documents').remove([filePath]);
          }

          const { error } = await supabase
            .from('patient_documents')
            .delete()
            .eq('id', id);

          if (error) throw error;

          set((state) => {
            state.documents = state.documents.filter((d) => d.id !== id);
            state.loading = false;
          });
        } catch (error) {
          set((state) => {
            state.error = error as Error;
            state.loading = false;
          });
          throw error;
        }
      },

      archiveDocument: async (id: string) => {
        await get().updateDocument(id, { is_archived: true });
      },

      unarchiveDocument: async (id: string) => {
        await get().updateDocument(id, { is_archived: false });
      },

      downloadDocument: async (document: Document) => {
        try {
          const response = await fetch(document.file_url);
          const blob = await response.blob();
          const url = window.URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = document.name;
          document.body.appendChild(a);
          a.click();
          window.URL.revokeObjectURL(url);
          document.body.removeChild(a);
        } catch (error) {
          set((state) => {
            state.error = error as Error;
          });
          throw error;
        }
      },

      setFilters: (filters: DocumentState['filters']) => {
        set((state) => {
          state.filters = { ...state.filters, ...filters };
        });
        get().loadDocuments(get().selectedContactId || undefined);
      },

      setSelectedContact: (contactId: string | null) => {
        set((state) => {
          state.selectedContactId = contactId;
        });
        if (contactId) {
          get().loadDocuments(contactId);
        }
      },

      searchDocuments: (query: string) => {
        const { documents } = get();
        const lowerQuery = query.toLowerCase();
        return documents.filter(
          (doc) =>
            doc.name.toLowerCase().includes(lowerQuery) ||
            doc.type.toLowerCase().includes(lowerQuery) ||
            doc.category?.toLowerCase().includes(lowerQuery) ||
            doc.tags.some((tag) => tag.toLowerCase().includes(lowerQuery))
        );
      },

      getDocumentsByType: (type: string) => {
        return get().documents.filter((doc) => doc.type === type);
      },

      refresh: async () => {
        await get().loadDocuments(get().selectedContactId || undefined);
      },

      enableRealtime: () => {
        const { realtimeChannel, isRealtimeActive } = get();

        if (isRealtimeActive && realtimeChannel) {
          console.log('Documents realtime already active');
          return;
        }

        if (realtimeChannel) {
          realtimeChannel.unsubscribe();
        }

        const channel = supabase
          .channel('documents-changes')
          .on(
            'postgres_changes',
            {
              event: 'INSERT',
              schema: 'public',
              table: 'patient_documents',
            },
            (payload) => {
              console.log('Realtime Document INSERT:', payload);
              set((state) => {
                const newDoc = payload.new as Document;
                const exists = state.documents.some((d) => d.id === newDoc.id);
                if (!exists) {
                  state.documents = [newDoc, ...state.documents];
                }
              });
            }
          )
          .on(
            'postgres_changes',
            {
              event: 'UPDATE',
              schema: 'public',
              table: 'patient_documents',
            },
            (payload) => {
              console.log('Realtime Document UPDATE:', payload);
              set((state) => {
                const updatedDoc = payload.new as Document;
                const index = state.documents.findIndex((d) => d.id === updatedDoc.id);
                if (index !== -1) {
                  state.documents[index] = updatedDoc;
                }
              });
            }
          )
          .on(
            'postgres_changes',
            {
              event: 'DELETE',
              schema: 'public',
              table: 'patient_documents',
            },
            (payload) => {
              console.log('Realtime Document DELETE:', payload);
              set((state) => {
                const deletedId = (payload.old as any).id;
                state.documents = state.documents.filter((d) => d.id !== deletedId);
              });
            }
          )
          .subscribe((status) => {
            console.log('Documents realtime subscription status:', status);
            if (status === 'SUBSCRIBED') {
              set((state) => {
                state.isRealtimeActive = true;
              });
            }
          });

        set((state) => {
          state.realtimeChannel = channel;
        });
      },

      disableRealtime: () => {
        const { realtimeChannel } = get();
        if (realtimeChannel) {
          realtimeChannel.unsubscribe();
          set((state) => {
            state.realtimeChannel = null;
            state.isRealtimeActive = false;
          });
        }
      },

      reset: () => {
        const { realtimeChannel } = get();
        if (realtimeChannel) {
          realtimeChannel.unsubscribe();
        }
        set(initialState);
      },
    })),
    { name: 'DocumentsStore' }
  )
);
