import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { CheckCircle, XCircle, Clock, Phone } from 'lucide-react';

interface TimeSlot {
  id: string;
  slot_date: string;
  slot_time: string;
  slot_datetime: string;
  duration_minutes: number;
  display_order: number;
}

interface RebookingRequest {
  id: string;
  patient_name: string;
  reason: string;
  status: string;
  expires_at: string;
}

export default function RebookResponse() {
  const path = window.location.pathname;
  const token = path.split('/rebook/')[1]?.split('?')[0];
  const urlParams = new URLSearchParams(window.location.search);
  const action = urlParams.get('action');
  const slotId = urlParams.get('slot');

  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [result, setResult] = useState<'success' | 'error' | 'expired' | null>(null);
  const [message, setMessage] = useState('');
  const [request, setRequest] = useState<RebookingRequest | null>(null);
  const [slots, setSlots] = useState<TimeSlot[]>([]);
  const [selectedSlot, setSelectedSlot] = useState<string | null>(slotId);

  useEffect(() => {
    loadRebookingData();
  }, [token]);

  useEffect(() => {
    if (action && request && !processing) {
      handleAction(action, slotId);
    }
  }, [action, request]);

  async function loadRebookingData() {
    if (!token) {
      setResult('error');
      setMessage('Token invalide');
      setLoading(false);
      return;
    }

    try {
      const { data: response, error: responseError } = await supabase
        .from('rebooking_responses')
        .select('rebooking_request_id')
        .eq('response_token', token)
        .maybeSingle();

      if (responseError || !response) {
        setResult('error');
        setMessage('Lien invalide ou expiré');
        setLoading(false);
        return;
      }

      const { data: requestData, error: requestError } = await supabase
        .from('rebooking_requests')
        .select('*')
        .eq('id', response.rebooking_request_id)
        .maybeSingle();

      if (requestError || !requestData) {
        setResult('error');
        setMessage('Demande de reprise introuvable');
        setLoading(false);
        return;
      }

      if (new Date(requestData.expires_at) < new Date()) {
        setResult('expired');
        setMessage('Cette invitation a expiré');
        setRequest(requestData);
        setLoading(false);
        return;
      }

      if (requestData.status === 'accepted') {
        setResult('success');
        setMessage('Vous avez déjà accepté cette demande de reprise');
        setRequest(requestData);
        setLoading(false);
        return;
      }

      if (requestData.status === 'declined') {
        setResult('error');
        setMessage('Vous avez déjà décliné cette demande');
        setRequest(requestData);
        setLoading(false);
        return;
      }

      const { data: slotsData, error: slotsError } = await supabase
        .from('rebooking_time_slots')
        .select('*')
        .eq('rebooking_request_id', response.rebooking_request_id)
        .eq('is_available', true)
        .order('display_order');

      if (slotsError) {
        console.error('Error loading slots:', slotsError);
      }

      setRequest(requestData);
      setSlots(slotsData || []);
      setLoading(false);
    } catch (error) {
      console.error('Error:', error);
      setResult('error');
      setMessage('Une erreur est survenue');
      setLoading(false);
    }
  }

  async function handleAction(actionType: string, slotIdParam: string | null) {
    if (processing) return;

    setProcessing(true);

    try {
      let responseType: string;
      let selectedSlotId: string | null = null;

      switch (actionType) {
        case 'accept':
          responseType = 'accept';
          selectedSlotId = slotIdParam || selectedSlot;
          if (!selectedSlotId) {
            setResult('error');
            setMessage('Veuillez sélectionner un créneau');
            setProcessing(false);
            return;
          }
          break;
        case 'decline':
          responseType = 'decline';
          break;
        case 'callback':
          responseType = 'request_callback';
          break;
        default:
          setResult('error');
          setMessage('Action invalide');
          setProcessing(false);
          return;
      }

      const { error } = await supabase.rpc('process_rebooking_response', {
        p_response_token: token,
        p_response_type: responseType,
        p_selected_slot_id: selectedSlotId,
        p_patient_notes: null,
      });

      if (error) {
        throw error;
      }

      if (responseType === 'accept') {
        setResult('success');
        setMessage('Votre rendez-vous a été confirmé avec succès!');
      } else if (responseType === 'decline') {
        setResult('error');
        setMessage('Votre demande d\'annulation a été enregistrée');
      } else if (responseType === 'request_callback') {
        setResult('success');
        setMessage('Nous vous contacterons sous peu pour fixer un rendez-vous');
      }
    } catch (error: any) {
      console.error('Error processing response:', error);
      setResult('error');
      setMessage(error?.message || 'Une erreur est survenue');
    } finally {
      setProcessing(false);
    }
  }

  async function submitAcceptance() {
    if (!selectedSlot) {
      setMessage('Veuillez sélectionner un créneau');
      return;
    }
    await handleAction('accept', selectedSlot);
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-neutral-50 flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-gold-400 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (result) {
    return (
      <div className="min-h-screen bg-neutral-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-xl shadow-lg max-w-md w-full p-8 text-center">
          {result === 'success' && (
            <>
              <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
              <h1 className="text-2xl font-heading text-foreground mb-2">Confirmé!</h1>
            </>
          )}
          {result === 'error' && (
            <>
              <XCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
              <h1 className="text-2xl font-heading text-foreground mb-2">Annulé</h1>
            </>
          )}
          {result === 'expired' && (
            <>
              <Clock className="w-16 h-16 text-gray-500 mx-auto mb-4" />
              <h1 className="text-2xl font-heading text-foreground mb-2">Expiré</h1>
            </>
          )}
          <p className="text-foreground/70 mb-6">{message}</p>
          <a
            href="/"
            className="inline-block px-6 py-2 bg-gold-500 text-white rounded-lg hover:bg-gold-600 transition-colors"
          >
            Retour à l'accueil
          </a>
        </div>
      </div>
    );
  }

  if (!action && request && slots.length > 0) {
    return (
      <div className="min-h-screen bg-neutral-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-xl shadow-lg max-w-2xl w-full p-8">
          <h1 className="text-3xl font-heading text-foreground mb-2">Reprenons rendez-vous</h1>
          <p className="text-foreground/70 mb-6">Bonjour {request.patient_name},</p>

          <div className="bg-blue-50 border-2 border-blue-200 rounded-lg p-4 mb-6">
            <p className="text-blue-900">{request.reason}</p>
          </div>

          <h2 className="text-xl font-heading text-foreground mb-4">
            Choisissez un créneau disponible:
          </h2>

          <div className="space-y-3 mb-8">
            {slots.map((slot) => {
              const date = new Date(slot.slot_datetime);
              const formattedDate = date.toLocaleDateString('fr-CA', {
                weekday: 'long',
                year: 'numeric',
                month: 'long',
                day: 'numeric',
              });

              return (
                <button
                  key={slot.id}
                  onClick={() => setSelectedSlot(slot.id)}
                  className={`w-full p-4 border-2 rounded-lg text-left transition-all ${
                    selectedSlot === slot.id
                      ? 'border-gold-400 bg-gold-50'
                      : 'border-neutral-200 hover:border-gold-200'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-medium text-foreground">{formattedDate}</div>
                      <div className="text-sm text-foreground/60">
                        {slot.slot_time} · {slot.duration_minutes} minutes
                      </div>
                    </div>
                    {selectedSlot === slot.id && (
                      <CheckCircle className="w-6 h-6 text-gold-500" />
                    )}
                  </div>
                </button>
              );
            })}
          </div>

          <div className="flex gap-3">
            <button
              onClick={submitAcceptance}
              disabled={!selectedSlot || processing}
              className="flex-1 px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {processing ? 'Confirmation...' : 'Confirmer ce rendez-vous'}
            </button>
          </div>

          <div className="mt-6 pt-6 border-t border-neutral-200 space-y-3">
            <p className="text-sm text-foreground/60 text-center mb-3">
              Aucun de ces créneaux ne vous convient?
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => handleAction('callback', null)}
                disabled={processing}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-2 border-2 border-blue-500 text-blue-600 rounded-lg hover:bg-blue-50 disabled:opacity-50 transition-colors"
              >
                <Phone className="w-4 h-4" />
                Demander un rappel
              </button>
              <button
                onClick={() => handleAction('decline', null)}
                disabled={processing}
                className="flex-1 px-4 py-2 border-2 border-neutral-200 text-foreground/60 rounded-lg hover:bg-neutral-50 disabled:opacity-50 transition-colors"
              >
                Annuler
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-neutral-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-lg max-w-md w-full p-8 text-center">
        <p className="text-foreground/70">Chargement...</p>
      </div>
    </div>
  );
}
