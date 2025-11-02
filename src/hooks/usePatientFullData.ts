import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

interface SOAPNote {
  id: string;
  subjective: string;
  objective: string;
  assessment: string;
  plan: string;
  created_at: string;
  created_by_name?: string;
}

interface BillingItem {
  id: string;
  invoice_number: string;
  amount: number;
  amount_paid: number;
  status: string;
  due_date: string;
  created_at: string;
  items: any[];
}

interface Communication {
  id: string;
  type: 'email' | 'sms';
  subject: string;
  status: string;
  sent_at: string;
  opened_at?: string;
}

interface Goal {
  id: string;
  goal: string;
  target_value?: number;
  current_value?: number;
  status: string;
  progress: number;
  created_at: string;
}

interface Document {
  id: string;
  name: string;
  type: string;
  url: string;
  created_at: string;
}

interface PatientFullData {
  soapNotes: SOAPNote[];
  billing: {
    total: number;
    paid: number;
    unpaid: number;
    invoices: BillingItem[];
  };
  communications: Communication[];
  goals: Goal[];
  documents: Document[];
  loading: boolean;
  error: string | null;
}

export function usePatientFullData(contactId: string): PatientFullData {
  const [data, setData] = useState<PatientFullData>({
    soapNotes: [],
    billing: { total: 0, paid: 0, unpaid: 0, invoices: [] },
    communications: [],
    goals: [],
    documents: [],
    loading: true,
    error: null
  });

  useEffect(() => {
    if (!contactId) return;
    loadAllData();
  }, [contactId]);

  async function loadAllData() {
    try {
      setData(prev => ({ ...prev, loading: true, error: null }));

      const [soapRes, billingRes, commsRes, docsRes] = await Promise.all([
        loadSOAPNotes(),
        loadBilling(),
        loadCommunications(),
        loadDocuments()
      ]);

      const mockGoals: Goal[] = [
        {
          id: '1',
          goal: 'Réduire la douleur de 8/10 à 3/10',
          target_value: 3,
          current_value: 5,
          status: 'en cours',
          progress: 60,
          created_at: new Date().toISOString()
        },
        {
          id: '2',
          goal: 'Améliorer la flexion lombaire à 80°',
          target_value: 80,
          current_value: 65,
          status: 'en cours',
          progress: 65,
          created_at: new Date().toISOString()
        },
        {
          id: '3',
          goal: 'Reprendre les activités sportives',
          status: 'planifié',
          progress: 30,
          created_at: new Date().toISOString()
        }
      ];

      setData({
        soapNotes: soapRes,
        billing: billingRes,
        communications: commsRes,
        goals: mockGoals,
        documents: docsRes,
        loading: false,
        error: null
      });
    } catch (error) {
      console.error('Error loading patient full data:', error);
      setData(prev => ({
        ...prev,
        loading: false,
        error: error instanceof Error ? error.message : 'Erreur de chargement'
      }));
    }
  }

  async function loadSOAPNotes(): Promise<SOAPNote[]> {
    const { data, error } = await supabase
      .from('soap_notes')
      .select(`
        id,
        subjective,
        objective,
        assessment,
        plan,
        created_at,
        created_by_name:profiles(first_name, last_name)
      `)
      .eq('contact_id', contactId)
      .order('created_at', { ascending: false })
      .limit(10);

    if (error) {
      console.error('Error loading SOAP notes:', error);
      return [];
    }

    return (data || []).map(note => ({
      ...note,
      created_by_name: note.created_by_name
        ? `${note.created_by_name.first_name} ${note.created_by_name.last_name}`
        : 'Inconnu'
    }));
  }

  async function loadBilling() {
    const { data, error } = await supabase
      .from('billing')
      .select('*')
      .eq('contact_id', contactId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error loading billing:', error);
      return { total: 0, paid: 0, unpaid: 0, invoices: [] };
    }

    const invoices = data || [];
    const total = invoices.reduce((sum, inv) => sum + (inv.amount || 0), 0);
    const paid = invoices.reduce((sum, inv) => sum + (inv.amount_paid || 0), 0);
    const unpaid = total - paid;

    return {
      total,
      paid,
      unpaid,
      invoices: invoices.map(inv => ({
        id: inv.id,
        invoice_number: inv.invoice_number || `INV-${inv.id.slice(0, 8)}`,
        amount: inv.amount || 0,
        amount_paid: inv.amount_paid || 0,
        status: inv.status || 'unpaid',
        due_date: inv.due_date || inv.created_at,
        created_at: inv.created_at,
        items: inv.items || []
      }))
    };
  }

  async function loadCommunications(): Promise<Communication[]> {
    const { data, error } = await supabase
      .from('email_tracking')
      .select('*')
      .eq('contact_id', contactId)
      .order('sent_at', { ascending: false })
      .limit(20);

    if (error) {
      console.error('Error loading communications:', error);
      return [];
    }

    return (data || []).map(comm => ({
      id: comm.id,
      type: comm.channel === 'sms' ? 'sms' : 'email',
      subject: comm.subject || comm.template_name || 'Message',
      status: comm.opened_at ? 'lu' : comm.delivered_at ? 'livré' : 'envoyé',
      sent_at: comm.sent_at,
      opened_at: comm.opened_at
    }));
  }

  async function loadDocuments(): Promise<Document[]> {
    const { data, error } = await supabase
      .storage
      .from('patient-documents')
      .list(`${contactId}/`, {
        limit: 100,
        sortBy: { column: 'created_at', order: 'desc' }
      });

    if (error) {
      console.error('Error loading documents:', error);
      return [];
    }

    return (data || []).map(file => ({
      id: file.id,
      name: file.name,
      type: file.metadata?.mimetype || 'application/octet-stream',
      url: supabase.storage.from('patient-documents').getPublicUrl(`${contactId}/${file.name}`).data.publicUrl,
      created_at: file.created_at || new Date().toISOString()
    }));
  }

  return data;
}
