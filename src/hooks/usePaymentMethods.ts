import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import type { PaymentMethod } from '../types/database';

export function usePaymentMethods(patientId: string | null) {
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (patientId) {
      loadPaymentMethods();
    } else {
      setPaymentMethods([]);
      setLoading(false);
    }
  }, [patientId]);

  async function loadPaymentMethods() {
    try {
      setLoading(true);
      setError(null);

      const { data, error: fetchError } = await supabase
        .from('payment_methods')
        .select('*')
        .eq('contact_id', patientId)
        .order('is_default', { ascending: false })
        .order('created_at', { ascending: false });

      if (fetchError) {
        console.warn('Payment methods table query failed:', fetchError);
        setPaymentMethods([]);
        setError(null);
      } else {
        setPaymentMethods(data || []);
      }
    } catch (err: any) {
      console.error('Error loading payment methods:', err);
      setPaymentMethods([]);
      setError(null);
    } finally {
      setLoading(false);
    }
  }

  async function addPaymentMethod(methodData: Partial<PaymentMethod>): Promise<PaymentMethod | null> {
    try {
      const { data, error: insertError } = await supabase
        .from('payment_methods')
        .insert({
          ...methodData,
          contact_id: patientId,
        })
        .select()
        .single();

      if (insertError) throw insertError;

      await loadPaymentMethods();
      return data;
    } catch (err: any) {
      console.error('Error adding payment method:', err);
      setError(err.message);
      return null;
    }
  }

  async function updatePaymentMethod(methodId: string, updates: Partial<PaymentMethod>): Promise<boolean> {
    try {
      const { error: updateError } = await supabase
        .from('payment_methods')
        .update(updates)
        .eq('id', methodId)
        .eq('contact_id', patientId);

      if (updateError) throw updateError;

      await loadPaymentMethods();
      return true;
    } catch (err: any) {
      console.error('Error updating payment method:', err);
      setError(err.message);
      return false;
    }
  }

  async function deletePaymentMethod(methodId: string): Promise<boolean> {
    try {
      const { error: deleteError } = await supabase
        .from('payment_methods')
        .update({ is_active: false })
        .eq('id', methodId)
        .eq('contact_id', patientId);

      if (deleteError) throw deleteError;

      await loadPaymentMethods();
      return true;
    } catch (err: any) {
      console.error('Error deleting payment method:', err);
      setError(err.message);
      return false;
    }
  }

  async function setPrimaryPaymentMethod(methodId: string): Promise<boolean> {
    try {
      const { error: updateError } = await supabase
        .from('payment_methods')
        .update({ is_default: true })
        .eq('id', methodId)
        .eq('contact_id', patientId);

      if (updateError) throw updateError;

      await loadPaymentMethods();
      return true;
    } catch (err: any) {
      console.error('Error setting primary payment method:', err);
      setError(err.message);
      return false;
    }
  }

  const primaryPaymentMethod = paymentMethods.find((pm) => pm.is_default) || paymentMethods[0] || null;

  return {
    paymentMethods,
    primaryPaymentMethod,
    loading,
    error,
    loadPaymentMethods,
    addPaymentMethod,
    updatePaymentMethod,
    deletePaymentMethod,
    setPrimaryPaymentMethod,
  };
}
