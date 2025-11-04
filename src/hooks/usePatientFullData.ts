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
  channel: 'email' | 'sms';
  subject: string;
  body: string;
  status: string;
  direction: 'inbound' | 'outbound';
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

      setData({
        soapNotes: soapRes,
        billing: billingRes,
        communications: commsRes,
        goals: [],
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
      .select('id, subjective, objective, assessment, plan, created_at, created_by')
      .eq('contact_id', contactId)
      .order('created_at', { ascending: false })
      .limit(10);

    if (error) {
      console.error('Error loading SOAP notes:', error);
      return [];
    }

    const notes = data || [];

    const notesWithNames = await Promise.all(
      notes.map(async (note) => {
        if (note.created_by) {
          const { data: profile } = await supabase
            .from('profiles')
            .select('first_name, last_name')
            .eq('id', note.created_by)
            .maybeSingle();

          return {
            ...note,
            created_by_name: profile
              ? `${profile.first_name} ${profile.last_name}`
              : 'Inconnu'
          };
        }
        return { ...note, created_by_name: 'Inconnu' };
      })
    );

    return notesWithNames;
  }

  async function loadBilling() {
    const { data, error } = await supabase
      .from('billing')
      .select('*')
      .eq('patient_id', contactId)
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
      .limit(50);

    if (error) {
      console.error('Error loading communications:', error);
      return [];
    }

    return (data || []).map(comm => ({
      id: comm.id,
      type: comm.channel === 'sms' ? 'sms' : 'email',
      channel: comm.channel === 'sms' ? 'sms' : 'email',
      subject: comm.subject || comm.template_name || 'Message',
      body: comm.body || '',
      status: comm.status || (comm.opened_at ? 'lu' : comm.delivered_at ? 'livré' : 'envoyé'),
      direction: comm.direction || 'outbound',
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
