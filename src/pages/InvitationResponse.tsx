import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Calendar, Clock, CheckCircle, XCircle, AlertCircle, Loader } from 'lucide-react';

interface InvitationData {
  slot_datetime: string;
  slot_date: string;
  slot_time: string;
  duration_minutes: number;
  patient_name: string;
  expires_at: string;
  status: string;
}

export default function InvitationResponse() {
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [invitation, setInvitation] = useState<InvitationData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [token, setToken] = useState<string | null>(null);

  useEffect(() => {
    const path = window.location.pathname;
    const matches = path.match(/\/invitation\/([^/]+)/);

    if (matches && matches[1]) {
      setToken(matches[1]);
      loadInvitationDetails(matches[1]);
    } else {
      setError('Lien d\'invitation invalide');
      setLoading(false);
    }
  }, []);

  async function loadInvitationDetails(invitationToken: string) {
    try {
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
      const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

      const response = await fetch(`${supabaseUrl}/rest/v1/slot_offer_invitations?response_token=eq.${invitationToken}&select=*,slot_offer:appointment_slot_offers(*),waitlist_entry:waitlist(*)`, {
        headers: {
          'apikey': supabaseAnonKey,
          'Authorization': `Bearer ${supabaseAnonKey}`,
        },
      });

      if (!response.ok) {
        throw new Error('Invitation introuvable');
      }

      const data = await response.json();

      if (!data || data.length === 0) {
        throw new Error('Invitation introuvable');
      }

      const inv = data[0];

      if (inv.status !== 'pending') {
        if (inv.status === 'accepted') {
          setSuccess('Ce rendez-vous a déjà été accepté!');
        } else if (inv.status === 'expired') {
          setError('Cette invitation a expiré');
        } else if (inv.status === 'cancelled') {
          setError('Ce créneau a déjà été attribué à quelqu\'un d\'autre');
        } else {
          setError('Cette invitation n\'est plus valide');
        }
        setLoading(false);
        return;
      }

      if (new Date(inv.expires_at) < new Date()) {
        setError('Cette invitation a expiré');
        setLoading(false);
        return;
      }

      const slotOffer = inv.slot_offer;
      const waitlistEntry = inv.waitlist_entry;

      setInvitation({
        slot_datetime: slotOffer.slot_datetime,
        slot_date: slotOffer.slot_date,
        slot_time: slotOffer.slot_time,
        duration_minutes: slotOffer.duration_minutes,
        patient_name: waitlistEntry.name,
        expires_at: inv.expires_at,
        status: inv.status,
      });

      setLoading(false);
    } catch (err: any) {
      console.error('Error loading invitation:', err);
      setError(err.message || 'Erreur lors du chargement de l\'invitation');
      setLoading(false);
    }
  }

  async function handleResponse(action: 'accept' | 'decline') {
    if (!token) return;

    setProcessing(true);
    setError(null);

    try {
      const functionUrl = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/handle-invitation-response`;

      const response = await fetch(functionUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
        },
        body: JSON.stringify({ token, action }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Erreur lors du traitement de votre réponse');
      }

      setSuccess(data.message);
      setInvitation(null);
    } catch (err: any) {
      console.error('Error processing response:', err);
      setError(err.message || 'Erreur lors du traitement de votre réponse');
    } finally {
      setProcessing(false);
    }
  }

  function formatDate(dateString: string): string {
    const date = new Date(dateString);
    return date.toLocaleDateString('fr-CA', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  }

  function getTimeRemaining(expiresAt: string): string {
    const now = new Date();
    const expires = new Date(expiresAt);
    const diff = expires.getTime() - now.getTime();

    if (diff <= 0) return 'Expiré';

    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

    if (hours > 0) {
      return `${hours}h ${minutes}min`;
    }
    return `${minutes} minutes`;
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-neutral-50 to-neutral-100 flex items-center justify-center p-6">
        <div className="text-center">
          <Loader className="w-12 h-12 text-gold-500 animate-spin mx-auto mb-4" />
          <p className="text-foreground/60">Chargement de votre invitation...</p>
        </div>
      </div>
    );
  }

  if (error && !invitation) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-50 to-red-100 flex items-center justify-center p-6">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-white rounded-xl shadow-lifted p-8 max-w-md w-full text-center"
        >
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <XCircle className="w-8 h-8 text-red-600" />
          </div>
          <h1 className="text-2xl font-heading text-foreground mb-2">Invitation invalide</h1>
          <p className="text-foreground/70 mb-6">{error}</p>
          <a
            href="/"
            className="inline-block px-6 py-3 bg-gradient-to-r from-gold-500 to-gold-600 text-white rounded-lg hover:from-gold-600 hover:to-gold-700 transition-all"
          >
            Retour à l'accueil
          </a>
        </motion.div>
      </div>
    );
  }

  if (success) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-green-100 flex items-center justify-center p-6">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-white rounded-xl shadow-lifted p-8 max-w-md w-full text-center"
        >
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckCircle className="w-8 h-8 text-green-600" />
          </div>
          <h1 className="text-2xl font-heading text-foreground mb-2">Merci!</h1>
          <p className="text-foreground/70 mb-6">{success}</p>
          <a
            href="/"
            className="inline-block px-6 py-3 bg-gradient-to-r from-gold-500 to-gold-600 text-white rounded-lg hover:from-gold-600 hover:to-gold-700 transition-all"
          >
            Retour à l'accueil
          </a>
        </motion.div>
      </div>
    );
  }

  if (!invitation) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gold-50 to-neutral-100 flex items-center justify-center p-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white rounded-xl shadow-lifted p-8 max-w-2xl w-full"
      >
        {/* Header */}
        <div className="text-center mb-8">
          <div className="text-6xl mb-4">🎯</div>
          <h1 className="text-3xl font-heading text-foreground mb-2">
            Un rendez-vous pour vous!
          </h1>
          <p className="text-foreground/60">
            Bonjour {invitation.patient_name}, nous avons un créneau disponible
          </p>
        </div>

        {/* Slot Details */}
        <div className="bg-gradient-to-br from-gold-50 to-gold-100 border-2 border-gold-400 rounded-xl p-8 mb-8">
          <div className="grid gap-6">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 bg-white rounded-lg flex items-center justify-center flex-shrink-0 shadow-soft">
                <Calendar className="w-6 h-6 text-gold-600" />
              </div>
              <div>
                <div className="text-sm text-foreground/60 mb-1">Date du rendez-vous</div>
                <div className="text-2xl font-semibold text-foreground capitalize">
                  {formatDate(invitation.slot_date)}
                </div>
              </div>
            </div>

            <div className="flex items-start gap-4">
              <div className="w-12 h-12 bg-white rounded-lg flex items-center justify-center flex-shrink-0 shadow-soft">
                <Clock className="w-6 h-6 text-gold-600" />
              </div>
              <div>
                <div className="text-sm text-foreground/60 mb-1">Heure</div>
                <div className="text-2xl font-semibold text-foreground">
                  {invitation.slot_time}
                </div>
                <div className="text-sm text-foreground/60 mt-1">
                  Durée: {invitation.duration_minutes} minutes
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Urgency Banner */}
        <div className="bg-yellow-50 border-l-4 border-yellow-400 rounded-lg p-4 mb-8">
          <div className="flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-yellow-800 mb-1">
                Cette invitation expire dans {getTimeRemaining(invitation.expires_at)}
              </p>
              <p className="text-xs text-yellow-700">
                Premier arrivé, premier servi! Réservez vite votre place.
              </p>
            </div>
          </div>
        </div>

        {/* Error Display */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
            <p className="text-sm text-red-800">{error}</p>
          </div>
        )}

        {/* Action Buttons */}
        <div className="space-y-4">
          <button
            onClick={() => handleResponse('accept')}
            disabled={processing}
            className="w-full flex items-center justify-center gap-3 px-8 py-4 bg-gradient-to-r from-green-500 to-green-600 text-white rounded-xl hover:from-green-600 hover:to-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 shadow-soft hover:shadow-lg text-lg font-semibold"
          >
            {processing ? (
              <>
                <Loader className="w-6 h-6 animate-spin" />
                Traitement en cours...
              </>
            ) : (
              <>
                <CheckCircle className="w-6 h-6" />
                Oui, je prends ce rendez-vous!
              </>
            )}
          </button>

          <button
            onClick={() => handleResponse('decline')}
            disabled={processing}
            className="w-full flex items-center justify-center gap-3 px-8 py-4 bg-white border-2 border-neutral-300 text-foreground rounded-xl hover:bg-neutral-50 hover:border-neutral-400 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
          >
            <XCircle className="w-5 h-5" />
            Non merci, je ne peux pas
          </button>
        </div>

        {/* Info */}
        <div className="mt-8 pt-6 border-t border-neutral-200">
          <p className="text-sm text-foreground/60 text-center">
            Si vous acceptez, vous recevrez immédiatement un email de confirmation
            avec tous les détails de votre rendez-vous.
          </p>
        </div>
      </motion.div>
    </div>
  );
}
