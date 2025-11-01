import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';
import { supabase } from '../../lib/supabase';
import type { RealtimeChannel } from '@supabase/supabase-js';

interface Message {
  id: string;
  contact_id: string;
  owner_id: string;
  subject: string | null;
  body: string;
  type: 'email' | 'sms' | 'internal_note' | 'system';
  direction: 'inbound' | 'outbound';
  status: 'draft' | 'sent' | 'delivered' | 'failed' | 'read';
  scheduled_for: string | null;
  sent_at: string | null;
  read_at: string | null;
  metadata: Record<string, any>;
  template_id: string | null;
  parent_message_id: string | null;
  thread_id: string | null;
  created_at: string;
  updated_at: string;
}

interface MessageTemplate {
  id: string;
  name: string;
  type: 'email' | 'sms';
  subject: string | null;
  body: string;
  variables: string[];
  category: string;
  is_active: boolean;
  created_at: string;
}

interface MessageThread {
  id: string;
  contact_id: string;
  subject: string;
  message_count: number;
  last_message_at: string;
  status: 'active' | 'archived';
}

interface MessagesState {
  messages: Message[];
  templates: MessageTemplate[];
  threads: MessageThread[];
  selectedContactId: string | null;
  selectedThreadId: string | null;
  loading: boolean;
  sending: boolean;
  error: Error | null;
  filters: {
    type?: string;
    status?: string;
    direction?: string;
    dateFrom?: string;
    dateTo?: string;
  };
  unreadCount: number;
  realtimeChannel: RealtimeChannel | null;
  isRealtimeActive: boolean;
}

interface MessagesActions {
  loadMessages: (contactId?: string) => Promise<void>;
  loadTemplates: () => Promise<void>;
  loadThreads: (contactId?: string) => Promise<void>;
  sendMessage: (message: Partial<Message>) => Promise<Message>;
  scheduleMessage: (message: Partial<Message>, scheduledFor: string) => Promise<Message>;
  updateMessage: (id: string, updates: Partial<Message>) => Promise<Message>;
  deleteMessage: (id: string) => Promise<void>;
  markAsRead: (id: string) => Promise<void>;
  markAsUnread: (id: string) => Promise<void>;
  createTemplate: (template: Partial<MessageTemplate>) => Promise<MessageTemplate>;
  updateTemplate: (id: string, updates: Partial<MessageTemplate>) => Promise<MessageTemplate>;
  deleteTemplate: (id: string) => Promise<void>;
  applyTemplate: (templateId: string, variables: Record<string, string>) => string;
  setFilters: (filters: MessagesState['filters']) => void;
  setSelectedContact: (contactId: string | null) => void;
  setSelectedThread: (threadId: string | null) => void;
  getUnreadCount: () => Promise<void>;
  searchMessages: (query: string) => Message[];
  refresh: () => Promise<void>;
  enableRealtime: () => void;
  disableRealtime: () => void;
  reset: () => void;
}

type MessagesStore = MessagesState & MessagesActions;

const initialState: MessagesState = {
  messages: [],
  templates: [],
  threads: [],
  selectedContactId: null,
  selectedThreadId: null,
  loading: false,
  sending: false,
  error: null,
  filters: {},
  unreadCount: 0,
  realtimeChannel: null,
  isRealtimeActive: false,
};

export const useMessagesStore = create<MessagesStore>()(
  devtools(
    immer((set, get) => ({
      ...initialState,

      loadMessages: async (contactId?: string) => {
        set((state) => {
          state.loading = true;
          state.error = null;
        });

        try {
          let query = supabase
            .from('messages')
            .select('*')
            .order('created_at', { ascending: false });

          const { filters, selectedThreadId } = get();

          if (contactId) {
            query = query.eq('contact_id', contactId);
          }

          if (selectedThreadId) {
            query = query.eq('thread_id', selectedThreadId);
          }

          if (filters.type) {
            query = query.eq('type', filters.type);
          }

          if (filters.status) {
            query = query.eq('status', filters.status);
          }

          if (filters.direction) {
            query = query.eq('direction', filters.direction);
          }

          if (filters.dateFrom) {
            query = query.gte('created_at', filters.dateFrom);
          }

          if (filters.dateTo) {
            query = query.lte('created_at', filters.dateTo);
          }

          const { data, error } = await query;

          if (error) throw error;

          set((state) => {
            state.messages = data || [];
            state.loading = false;
            if (contactId) {
              state.selectedContactId = contactId;
            }
          });

          await get().getUnreadCount();
        } catch (error) {
          set((state) => {
            state.error = error as Error;
            state.loading = false;
          });
          throw error;
        }
      },

      loadTemplates: async () => {
        try {
          const { data, error } = await supabase
            .from('message_templates')
            .select('*')
            .eq('is_active', true)
            .order('name', { ascending: true });

          if (error) throw error;

          set((state) => {
            state.templates = data || [];
          });
        } catch (error) {
          set((state) => {
            state.error = error as Error;
          });
        }
      },

      loadThreads: async (contactId?: string) => {
        try {
          let query = supabase
            .from('message_threads')
            .select('*')
            .eq('status', 'active')
            .order('last_message_at', { ascending: false });

          if (contactId) {
            query = query.eq('contact_id', contactId);
          }

          const { data, error } = await query;

          if (error) throw error;

          set((state) => {
            state.threads = data || [];
          });
        } catch (error) {
          set((state) => {
            state.error = error as Error;
          });
        }
      },

      sendMessage: async (message: Partial<Message>) => {
        set((state) => {
          state.sending = true;
          state.error = null;
        });

        try {
          const messageData = {
            ...message,
            status: 'sent',
            sent_at: new Date().toISOString(),
            direction: 'outbound',
          };

          const { data, error } = await supabase
            .from('messages')
            .insert(messageData)
            .select()
            .single();

          if (error) throw error;

          set((state) => {
            state.messages = [data, ...state.messages];
            state.sending = false;
          });

          return data;
        } catch (error) {
          set((state) => {
            state.error = error as Error;
            state.sending = false;
          });
          throw error;
        }
      },

      scheduleMessage: async (message: Partial<Message>, scheduledFor: string) => {
        set((state) => {
          state.sending = true;
          state.error = null;
        });

        try {
          const messageData = {
            ...message,
            status: 'draft',
            scheduled_for: scheduledFor,
            direction: 'outbound',
          };

          const { data, error } = await supabase
            .from('messages')
            .insert(messageData)
            .select()
            .single();

          if (error) throw error;

          set((state) => {
            state.messages = [data, ...state.messages];
            state.sending = false;
          });

          return data;
        } catch (error) {
          set((state) => {
            state.error = error as Error;
            state.sending = false;
          });
          throw error;
        }
      },

      updateMessage: async (id: string, updates: Partial<Message>) => {
        try {
          const { data, error } = await supabase
            .from('messages')
            .update(updates)
            .eq('id', id)
            .select()
            .single();

          if (error) throw error;

          set((state) => {
            const index = state.messages.findIndex((m) => m.id === id);
            if (index !== -1) {
              state.messages[index] = data;
            }
          });

          return data;
        } catch (error) {
          set((state) => {
            state.error = error as Error;
          });
          throw error;
        }
      },

      deleteMessage: async (id: string) => {
        try {
          const { error } = await supabase.from('messages').delete().eq('id', id);

          if (error) throw error;

          set((state) => {
            state.messages = state.messages.filter((m) => m.id !== id);
          });
        } catch (error) {
          set((state) => {
            state.error = error as Error;
          });
          throw error;
        }
      },

      markAsRead: async (id: string) => {
        await get().updateMessage(id, {
          status: 'read',
          read_at: new Date().toISOString(),
        });
        await get().getUnreadCount();
      },

      markAsUnread: async (id: string) => {
        await get().updateMessage(id, {
          status: 'delivered',
          read_at: null,
        });
        await get().getUnreadCount();
      },

      createTemplate: async (template: Partial<MessageTemplate>) => {
        try {
          const { data, error } = await supabase
            .from('message_templates')
            .insert(template)
            .select()
            .single();

          if (error) throw error;

          set((state) => {
            state.templates = [...state.templates, data];
          });

          return data;
        } catch (error) {
          set((state) => {
            state.error = error as Error;
          });
          throw error;
        }
      },

      updateTemplate: async (id: string, updates: Partial<MessageTemplate>) => {
        try {
          const { data, error } = await supabase
            .from('message_templates')
            .update(updates)
            .eq('id', id)
            .select()
            .single();

          if (error) throw error;

          set((state) => {
            const index = state.templates.findIndex((t) => t.id === id);
            if (index !== -1) {
              state.templates[index] = data;
            }
          });

          return data;
        } catch (error) {
          set((state) => {
            state.error = error as Error;
          });
          throw error;
        }
      },

      deleteTemplate: async (id: string) => {
        try {
          const { error } = await supabase
            .from('message_templates')
            .delete()
            .eq('id', id);

          if (error) throw error;

          set((state) => {
            state.templates = state.templates.filter((t) => t.id !== id);
          });
        } catch (error) {
          set((state) => {
            state.error = error as Error;
          });
          throw error;
        }
      },

      applyTemplate: (templateId: string, variables: Record<string, string>) => {
        const template = get().templates.find((t) => t.id === templateId);
        if (!template) throw new Error('Template not found');

        let body = template.body;
        Object.entries(variables).forEach(([key, value]) => {
          body = body.replace(new RegExp(`{{${key}}}`, 'g'), value);
        });

        return body;
      },

      setFilters: (filters: MessagesState['filters']) => {
        set((state) => {
          state.filters = { ...state.filters, ...filters };
        });
        get().loadMessages(get().selectedContactId || undefined);
      },

      setSelectedContact: (contactId: string | null) => {
        set((state) => {
          state.selectedContactId = contactId;
        });
        if (contactId) {
          get().loadMessages(contactId);
          get().loadThreads(contactId);
        }
      },

      setSelectedThread: (threadId: string | null) => {
        set((state) => {
          state.selectedThreadId = threadId;
        });
        get().loadMessages(get().selectedContactId || undefined);
      },

      getUnreadCount: async () => {
        try {
          const { count, error } = await supabase
            .from('messages')
            .select('*', { count: 'exact', head: true })
            .eq('direction', 'inbound')
            .neq('status', 'read');

          if (error) throw error;

          set((state) => {
            state.unreadCount = count || 0;
          });
        } catch (error) {
          console.error('Error getting unread count:', error);
        }
      },

      searchMessages: (query: string) => {
        const { messages } = get();
        const lowerQuery = query.toLowerCase();
        return messages.filter(
          (msg) =>
            msg.subject?.toLowerCase().includes(lowerQuery) ||
            msg.body.toLowerCase().includes(lowerQuery)
        );
      },

      refresh: async () => {
        await Promise.all([
          get().loadMessages(get().selectedContactId || undefined),
          get().loadTemplates(),
          get().loadThreads(get().selectedContactId || undefined),
        ]);
      },

      enableRealtime: () => {
        const { realtimeChannel, isRealtimeActive } = get();

        if (isRealtimeActive && realtimeChannel) {
          console.log('Messages realtime already active');
          return;
        }

        if (realtimeChannel) {
          realtimeChannel.unsubscribe();
        }

        const channel = supabase
          .channel('messages-changes')
          .on(
            'postgres_changes',
            {
              event: 'INSERT',
              schema: 'public',
              table: 'messages',
            },
            (payload) => {
              console.log('Realtime Message INSERT:', payload);
              set((state) => {
                const newMessage = payload.new as Message;
                const exists = state.messages.some((m) => m.id === newMessage.id);
                if (!exists) {
                  state.messages = [newMessage, ...state.messages];
                }
              });
              get().getUnreadCount();
            }
          )
          .on(
            'postgres_changes',
            {
              event: 'UPDATE',
              schema: 'public',
              table: 'messages',
            },
            (payload) => {
              console.log('Realtime Message UPDATE:', payload);
              set((state) => {
                const updatedMessage = payload.new as Message;
                const index = state.messages.findIndex((m) => m.id === updatedMessage.id);
                if (index !== -1) {
                  state.messages[index] = updatedMessage;
                }
              });
              get().getUnreadCount();
            }
          )
          .on(
            'postgres_changes',
            {
              event: 'DELETE',
              schema: 'public',
              table: 'messages',
            },
            (payload) => {
              console.log('Realtime Message DELETE:', payload);
              set((state) => {
                const deletedId = (payload.old as any).id;
                state.messages = state.messages.filter((m) => m.id !== deletedId);
              });
            }
          )
          .subscribe((status) => {
            console.log('Messages realtime subscription status:', status);
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
    { name: 'MessagesStore' }
  )
);
