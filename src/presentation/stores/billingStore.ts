import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';
import { supabase } from '../../lib/supabase';

interface Invoice {
  id: string;
  contact_id: string;
  amount: number;
  currency: string;
  status: 'draft' | 'sent' | 'paid' | 'overdue' | 'cancelled';
  due_date: string;
  invoice_number: string;
  line_items: any[];
  notes: string | null;
  created_at: string;
  updated_at: string;
}

interface Payment {
  id: string;
  contact_id: string;
  amount: number;
  currency: string;
  payment_method: string;
  status: 'pending' | 'completed' | 'failed' | 'refunded';
  transaction_id: string | null;
  stripe_payment_intent_id: string | null;
  metadata: any;
  created_at: string;
}

interface PaymentMethod {
  id: string;
  contact_id: string;
  type: 'card' | 'bank_account';
  last4: string;
  brand: string | null;
  is_default: boolean;
  stripe_payment_method_id: string | null;
  billing_name: string | null;
  billing_address: string | null;
  created_at: string;
}

interface Subscription {
  id: string;
  contact_id: string;
  payment_method_id: string;
  subscription_type: string;
  amount: number;
  currency: string;
  interval: 'daily' | 'weekly' | 'monthly' | 'yearly';
  interval_count: number;
  status: 'active' | 'paused' | 'cancelled' | 'expired';
  start_date: string;
  end_date: string | null;
  next_billing_date: string | null;
  stripe_subscription_id: string | null;
  created_at: string;
}

interface BillingState {
  invoices: Invoice[];
  payments: Payment[];
  paymentMethods: PaymentMethod[];
  subscriptions: Subscription[];
  selectedContactId: string | null;
  loading: boolean;
  error: Error | null;
  stats: {
    totalRevenue: number;
    pendingAmount: number;
    overdueAmount: number;
    activeSubscriptions: number;
  };
}

interface BillingActions {
  loadInvoices: (contactId?: string) => Promise<void>;
  loadPayments: (contactId?: string) => Promise<void>;
  loadPaymentMethods: (contactId: string) => Promise<void>;
  loadSubscriptions: (contactId?: string) => Promise<void>;
  createInvoice: (invoice: Partial<Invoice>) => Promise<Invoice>;
  updateInvoice: (id: string, updates: Partial<Invoice>) => Promise<Invoice>;
  deleteInvoice: (id: string) => Promise<void>;
  createPayment: (payment: Partial<Payment>) => Promise<Payment>;
  addPaymentMethod: (method: Partial<PaymentMethod>) => Promise<PaymentMethod>;
  deletePaymentMethod: (id: string) => Promise<void>;
  setDefaultPaymentMethod: (id: string) => Promise<void>;
  createSubscription: (subscription: Partial<Subscription>) => Promise<Subscription>;
  cancelSubscription: (id: string) => Promise<void>;
  setSelectedContact: (contactId: string | null) => void;
  calculateStats: () => void;
  refresh: () => Promise<void>;
  reset: () => void;
}

type BillingStore = BillingState & BillingActions;

const initialState: BillingState = {
  invoices: [],
  payments: [],
  paymentMethods: [],
  subscriptions: [],
  selectedContactId: null,
  loading: false,
  error: null,
  stats: {
    totalRevenue: 0,
    pendingAmount: 0,
    overdueAmount: 0,
    activeSubscriptions: 0,
  },
};

export const useBillingStore = create<BillingStore>()(
  devtools(
    immer((set, get) => ({
      ...initialState,

      loadInvoices: async (contactId?: string) => {
        set((state) => {
          state.loading = true;
          state.error = null;
        });

        try {
          let query = supabase
            .from('invoices')
            .select('*')
            .order('created_at', { ascending: false });

          if (contactId) {
            query = query.eq('contact_id', contactId);
          }

          const { data, error } = await query;

          if (error) throw error;

          set((state) => {
            state.invoices = data || [];
            state.loading = false;
          });

          get().calculateStats();
        } catch (error) {
          set((state) => {
            state.error = error as Error;
            state.loading = false;
          });
          throw error;
        }
      },

      loadPayments: async (contactId?: string) => {
        set((state) => {
          state.loading = true;
          state.error = null;
        });

        try {
          let query = supabase
            .from('payments')
            .select('*')
            .order('created_at', { ascending: false });

          if (contactId) {
            query = query.eq('contact_id', contactId);
          }

          const { data, error } = await query;

          if (error) throw error;

          set((state) => {
            state.payments = data || [];
            state.loading = false;
          });

          get().calculateStats();
        } catch (error) {
          set((state) => {
            state.error = error as Error;
            state.loading = false;
          });
          throw error;
        }
      },

      loadPaymentMethods: async (contactId: string) => {
        set((state) => {
          state.loading = true;
          state.error = null;
        });

        try {
          const { data, error } = await supabase
            .from('payment_methods')
            .select('*')
            .eq('contact_id', contactId)
            .order('is_default', { ascending: false });

          if (error) throw error;

          set((state) => {
            state.paymentMethods = data || [];
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

      loadSubscriptions: async (contactId?: string) => {
        set((state) => {
          state.loading = true;
          state.error = null;
        });

        try {
          let query = supabase
            .from('payment_subscriptions')
            .select('*')
            .order('created_at', { ascending: false });

          if (contactId) {
            query = query.eq('contact_id', contactId);
          }

          const { data, error } = await query;

          if (error) throw error;

          set((state) => {
            state.subscriptions = data || [];
            state.loading = false;
          });

          get().calculateStats();
        } catch (error) {
          set((state) => {
            state.error = error as Error;
            state.loading = false;
          });
          throw error;
        }
      },

      createInvoice: async (invoice: Partial<Invoice>) => {
        set((state) => {
          state.loading = true;
          state.error = null;
        });

        try {
          const { data, error } = await supabase
            .from('invoices')
            .insert(invoice)
            .select()
            .single();

          if (error) throw error;

          set((state) => {
            state.invoices = [data, ...state.invoices];
            state.loading = false;
          });

          get().calculateStats();
          return data;
        } catch (error) {
          set((state) => {
            state.error = error as Error;
            state.loading = false;
          });
          throw error;
        }
      },

      updateInvoice: async (id: string, updates: Partial<Invoice>) => {
        set((state) => {
          state.loading = true;
          state.error = null;
        });

        try {
          const { data, error } = await supabase
            .from('invoices')
            .update(updates)
            .eq('id', id)
            .select()
            .single();

          if (error) throw error;

          set((state) => {
            const index = state.invoices.findIndex((i) => i.id === id);
            if (index !== -1) {
              state.invoices[index] = data;
            }
            state.loading = false;
          });

          get().calculateStats();
          return data;
        } catch (error) {
          set((state) => {
            state.error = error as Error;
            state.loading = false;
          });
          throw error;
        }
      },

      deleteInvoice: async (id: string) => {
        set((state) => {
          state.loading = true;
          state.error = null;
        });

        try {
          const { error } = await supabase
            .from('invoices')
            .delete()
            .eq('id', id);

          if (error) throw error;

          set((state) => {
            state.invoices = state.invoices.filter((i) => i.id !== id);
            state.loading = false;
          });

          get().calculateStats();
        } catch (error) {
          set((state) => {
            state.error = error as Error;
            state.loading = false;
          });
          throw error;
        }
      },

      createPayment: async (payment: Partial<Payment>) => {
        set((state) => {
          state.loading = true;
          state.error = null;
        });

        try {
          const { data, error } = await supabase
            .from('payments')
            .insert(payment)
            .select()
            .single();

          if (error) throw error;

          set((state) => {
            state.payments = [data, ...state.payments];
            state.loading = false;
          });

          get().calculateStats();
          return data;
        } catch (error) {
          set((state) => {
            state.error = error as Error;
            state.loading = false;
          });
          throw error;
        }
      },

      addPaymentMethod: async (method: Partial<PaymentMethod>) => {
        set((state) => {
          state.loading = true;
          state.error = null;
        });

        try {
          const { data, error } = await supabase
            .from('payment_methods')
            .insert(method)
            .select()
            .single();

          if (error) throw error;

          set((state) => {
            state.paymentMethods = [data, ...state.paymentMethods];
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

      deletePaymentMethod: async (id: string) => {
        set((state) => {
          state.loading = true;
          state.error = null;
        });

        try {
          const { error } = await supabase
            .from('payment_methods')
            .delete()
            .eq('id', id);

          if (error) throw error;

          set((state) => {
            state.paymentMethods = state.paymentMethods.filter((m) => m.id !== id);
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

      setDefaultPaymentMethod: async (id: string) => {
        set((state) => {
          state.loading = true;
          state.error = null;
        });

        try {
          const method = get().paymentMethods.find(m => m.id === id);
          if (!method) throw new Error('Payment method not found');

          await supabase
            .from('payment_methods')
            .update({ is_default: false })
            .eq('contact_id', method.contact_id);

          const { error } = await supabase
            .from('payment_methods')
            .update({ is_default: true })
            .eq('id', id);

          if (error) throw error;

          set((state) => {
            state.paymentMethods = state.paymentMethods.map((m) => ({
              ...m,
              is_default: m.id === id,
            }));
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

      createSubscription: async (subscription: Partial<Subscription>) => {
        set((state) => {
          state.loading = true;
          state.error = null;
        });

        try {
          const { data, error } = await supabase
            .from('payment_subscriptions')
            .insert(subscription)
            .select()
            .single();

          if (error) throw error;

          set((state) => {
            state.subscriptions = [data, ...state.subscriptions];
            state.loading = false;
          });

          get().calculateStats();
          return data;
        } catch (error) {
          set((state) => {
            state.error = error as Error;
            state.loading = false;
          });
          throw error;
        }
      },

      cancelSubscription: async (id: string) => {
        set((state) => {
          state.loading = true;
          state.error = null;
        });

        try {
          const { data, error } = await supabase
            .from('payment_subscriptions')
            .update({ status: 'cancelled' })
            .eq('id', id)
            .select()
            .single();

          if (error) throw error;

          set((state) => {
            const index = state.subscriptions.findIndex((s) => s.id === id);
            if (index !== -1) {
              state.subscriptions[index] = data;
            }
            state.loading = false;
          });

          get().calculateStats();
        } catch (error) {
          set((state) => {
            state.error = error as Error;
            state.loading = false;
          });
          throw error;
        }
      },

      setSelectedContact: (contactId: string | null) => {
        set((state) => {
          state.selectedContactId = contactId;
        });
      },

      calculateStats: () => {
        const { invoices, payments, subscriptions } = get();

        const totalRevenue = payments
          .filter((p) => p.status === 'completed')
          .reduce((sum, p) => sum + p.amount, 0);

        const pendingAmount = invoices
          .filter((i) => i.status === 'sent')
          .reduce((sum, i) => sum + i.amount, 0);

        const overdueAmount = invoices
          .filter((i) => i.status === 'overdue')
          .reduce((sum, i) => sum + i.amount, 0);

        const activeSubscriptions = subscriptions.filter(
          (s) => s.status === 'active'
        ).length;

        set((state) => {
          state.stats = {
            totalRevenue,
            pendingAmount,
            overdueAmount,
            activeSubscriptions,
          };
        });
      },

      refresh: async () => {
        const { selectedContactId } = get();
        await Promise.all([
          get().loadInvoices(selectedContactId || undefined),
          get().loadPayments(selectedContactId || undefined),
          get().loadSubscriptions(selectedContactId || undefined),
        ]);
      },

      reset: () => {
        set(initialState);
      },
    })),
    { name: 'BillingStore' }
  )
);
