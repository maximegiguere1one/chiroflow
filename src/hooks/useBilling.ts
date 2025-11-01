import { useEffect } from 'react';
import { useBillingStore } from '../presentation/stores/billingStore';

export function useBilling(contactId?: string, autoLoad = true) {
  const {
    invoices,
    payments,
    paymentMethods,
    subscriptions,
    loading,
    error,
    stats,
    loadInvoices,
    loadPayments,
    loadPaymentMethods,
    loadSubscriptions,
    createInvoice,
    updateInvoice,
    deleteInvoice,
    createPayment,
    addPaymentMethod,
    deletePaymentMethod,
    setDefaultPaymentMethod,
    createSubscription,
    cancelSubscription,
    setSelectedContact,
    refresh,
  } = useBillingStore();

  useEffect(() => {
    if (autoLoad) {
      if (contactId) {
        setSelectedContact(contactId);
        loadInvoices(contactId);
        loadPayments(contactId);
        loadPaymentMethods(contactId);
        loadSubscriptions(contactId);
      } else {
        loadInvoices();
        loadPayments();
        loadSubscriptions();
      }
    }
  }, [contactId, autoLoad]);

  return {
    invoices,
    payments,
    paymentMethods,
    subscriptions,
    loading,
    error,
    stats,
    createInvoice,
    updateInvoice,
    deleteInvoice,
    createPayment,
    addPaymentMethod,
    deletePaymentMethod,
    setDefaultPaymentMethod,
    createSubscription,
    cancelSubscription,
    refresh,
  };
}

export function useInvoices(contactId?: string) {
  const invoices = useBillingStore((state) => state.invoices);
  const loading = useBillingStore((state) => state.loading);
  const createInvoice = useBillingStore((state) => state.createInvoice);
  const updateInvoice = useBillingStore((state) => state.updateInvoice);
  const deleteInvoice = useBillingStore((state) => state.deleteInvoice);

  useEffect(() => {
    useBillingStore.getState().loadInvoices(contactId);
  }, [contactId]);

  return {
    invoices,
    loading,
    createInvoice,
    updateInvoice,
    deleteInvoice,
  };
}

export function usePaymentMethods(contactId: string) {
  const paymentMethods = useBillingStore((state) => state.paymentMethods);
  const loading = useBillingStore((state) => state.loading);
  const addPaymentMethod = useBillingStore((state) => state.addPaymentMethod);
  const deletePaymentMethod = useBillingStore((state) => state.deletePaymentMethod);
  const setDefaultPaymentMethod = useBillingStore((state) => state.setDefaultPaymentMethod);

  useEffect(() => {
    if (contactId) {
      useBillingStore.getState().loadPaymentMethods(contactId);
    }
  }, [contactId]);

  return {
    paymentMethods,
    loading,
    addPaymentMethod,
    deletePaymentMethod,
    setDefaultPaymentMethod,
  };
}

export function useBillingStats() {
  const stats = useBillingStore((state) => state.stats);
  const loading = useBillingStore((state) => state.loading);
  const calculateStats = useBillingStore((state) => state.calculateStats);

  useEffect(() => {
    calculateStats();
  }, []);

  return {
    stats,
    loading,
    refresh: calculateStats,
  };
}
