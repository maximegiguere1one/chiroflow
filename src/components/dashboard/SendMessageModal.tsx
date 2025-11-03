import { useState, useEffect } from 'react';
import { X, Send, Mail, MessageSquare } from 'lucide-react';
import { motion } from 'framer-motion';
import { useToastContext } from '../../contexts/ToastContext';
import { supabase } from '../../lib/supabase';

interface SendMessageModalProps {
  patient: {
    id: string;
    first_name: string;
    last_name: string;
    email: string;
    phone: string;
  };
  onClose: () => void;
}

export function SendMessageModal({ patient, onClose }: SendMessageModalProps) {
  const toast = useToastContext();
  const [messageType, setMessageType] = useState<'email' | 'sms'>('email');
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [isSending, setIsSending] = useState(false);

  useEffect(() => {
    console.log('📨 SendMessageModal monté', { patient });
    document.body.style.overflow = 'hidden';
    return () => {
      console.log('📨 SendMessageModal démonté');
      document.body.style.overflow = 'unset';
    };
  }, []);

  const handleSend = async () => {
    if (!message.trim()) {
      toast.error('Veuillez entrer un message');
      return;
    }

    if (messageType === 'email' && !subject.trim()) {
      toast.error('Veuillez entrer un sujet');
      return;
    }

    if (messageType === 'email' && !patient.email) {
      toast.error('Aucune adresse email pour ce patient');
      return;
    }

    if (messageType === 'sms' && !patient.phone) {
      toast.error('Aucun numéro de téléphone pour ce patient');
      return;
    }

    setIsSending(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast.error('Utilisateur non authentifié');
        setIsSending(false);
        return;
      }

      if (messageType === 'email') {
        const trackingRecord = {
          contact_id: patient.id,
          recipient_email: patient.email,
          email_type: 'custom',
          subject: subject,
          body: message,
          template_name: 'custom_message',
          channel: 'email',
          status: 'pending',
          sent_at: new Date().toISOString(),
          owner_id: user.id
        };

        const { data: tracking, error: trackingError } = await supabase
          .from('email_tracking')
          .insert(trackingRecord)
          .select()
          .single();

        if (trackingError) throw trackingError;

        const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
        const { data: { session } } = await supabase.auth.getSession();

        try {
          const response = await fetch(`${supabaseUrl}/functions/v1/send-custom-email`, {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${session?.access_token}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              to: patient.email,
              subject: subject,
              message: message,
              patient_name: `${patient.first_name} ${patient.last_name}`,
              tracking_id: tracking.id
            })
          });

          if (response.ok) {
            await supabase
              .from('email_tracking')
              .update({
                status: 'sent',
                delivered_at: new Date().toISOString()
              })
              .eq('id', tracking.id);

            toast.success('Email envoyé avec succès!');
          } else {
            const errorText = await response.text();
            console.error('Email send error:', errorText);

            await supabase
              .from('email_tracking')
              .update({ status: 'failed' })
              .eq('id', tracking.id);

            toast.warning('Email enregistré mais envoi différé');
          }
        } catch (emailError) {
          console.error('Email function error:', emailError);
          toast.warning('Email enregistré mais envoi différé');
        }
      } else {
        const trackingRecord = {
          contact_id: patient.id,
          recipient_phone: patient.phone,
          recipient_email: patient.email || `sms-${patient.id}@placeholder.com`,
          email_type: 'sms',
          body: message,
          template_name: 'custom_sms',
          channel: 'sms',
          status: 'pending',
          sent_at: new Date().toISOString(),
          owner_id: user.id
        };

        const { data: tracking, error: trackingError } = await supabase
          .from('email_tracking')
          .insert(trackingRecord)
          .select()
          .single();

        if (trackingError) throw trackingError;

        try {
          console.log('📱 Envoi SMS à:', patient.phone);
          const response = await fetch(`${supabaseUrl}/functions/v1/send-custom-sms`, {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${session?.access_token}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              to: patient.phone,
              message: message,
              patient_name: `${patient.first_name} ${patient.last_name}`,
              tracking_id: tracking.id
            })
          });

          console.log('📱 SMS Response status:', response.status);

          if (response.ok) {
            await supabase
              .from('email_tracking')
              .update({
                status: 'sent',
                delivered_at: new Date().toISOString()
              })
              .eq('id', tracking.id);

            toast.success('SMS envoyé avec succès!');
          } else {
            const errorText = await response.text();
            console.error('SMS send error:', errorText);

            await supabase
              .from('email_tracking')
              .update({ status: 'failed' })
              .eq('id', tracking.id);

            toast.warning('SMS enregistré mais envoi différé');
          }
        } catch (smsError) {
          console.error('SMS function error:', smsError);
          toast.warning('SMS enregistré mais envoi différé');
        }
      }

      onClose();
    } catch (error) {
      console.error('Error sending message:', error);
      toast.error('Erreur lors de l\'envoi');
    } finally {
      setIsSending(false);
    }
  };

  const quickMessages = [
    'Rappel de rendez-vous demain à {time}',
    'Confirmation de votre rendez-vous',
    'Nous avons hâte de vous voir!',
    'N\'oubliez pas d\'apporter vos documents',
  ];

  return (
    <div
      className="fixed inset-0 bg-black/70 backdrop-blur-sm z-[200] flex items-center justify-center p-4 overflow-y-auto"
      onClick={onClose}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        onClick={(e) => e.stopPropagation()}
        className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl my-8 flex flex-col max-h-[90vh]"
      >
        {/* Header - Fixed */}
        <div className="flex-shrink-0 flex items-center justify-between p-6 border-b border-gray-200">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Envoyer un Message</h2>
            <p className="text-sm text-gray-600 mt-1">
              À: {patient.first_name} {patient.last_name}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-all"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body - Scrollable */}
        <div className="p-6 space-y-6 overflow-y-auto flex-1">
          {/* Type selector */}
          <div className="flex gap-4">
            <button
              onClick={() => setMessageType('email')}
              className={`flex-1 py-3 px-4 rounded-xl font-semibold transition-all flex items-center justify-center gap-2 ${
                messageType === 'email'
                  ? 'bg-blue-500 text-white shadow-lg'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              <Mail className="w-5 h-5" />
              Email
            </button>
            <button
              onClick={() => setMessageType('sms')}
              className={`flex-1 py-3 px-4 rounded-xl font-semibold transition-all flex items-center justify-center gap-2 ${
                messageType === 'sms'
                  ? 'bg-blue-500 text-white shadow-lg'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              <MessageSquare className="w-5 h-5" />
              SMS
            </button>
          </div>

          {/* Recipient info */}
          <div className="bg-gray-50 rounded-lg p-4">
            <div className="text-sm text-gray-600">
              {messageType === 'email' ? (
                <div className="flex items-center gap-2">
                  <Mail className="w-4 h-4" />
                  {patient.email}
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <MessageSquare className="w-4 h-4" />
                  {patient.phone}
                </div>
              )}
            </div>
          </div>

          {/* Subject (email only) */}
          {messageType === 'email' && (
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Sujet
              </label>
              <input
                type="text"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Objet du message..."
              />
            </div>
          )}

          {/* Quick messages */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Messages rapides
            </label>
            <div className="flex flex-wrap gap-2">
              {quickMessages.map((msg, i) => (
                <button
                  key={i}
                  onClick={() => setMessage(msg)}
                  className="px-3 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-lg text-sm transition-all"
                >
                  {msg}
                </button>
              ))}
            </div>
          </div>

          {/* Message */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Message
            </label>
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              rows={6}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none"
              placeholder="Votre message..."
            />
            <div className="text-sm text-gray-500 mt-2">
              {message.length} caractères {messageType === 'sms' && `(${Math.ceil(message.length / 160)} SMS)`}
            </div>
          </div>
        </div>

        {/* Footer - Fixed */}
        <div className="flex-shrink-0 flex items-center justify-end gap-3 p-6 border-t border-gray-200 bg-gray-50 rounded-b-2xl">
          <button
            onClick={onClose}
            className="px-6 py-2.5 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-100 font-semibold transition-all"
          >
            Annuler
          </button>
          <button
            onClick={handleSend}
            disabled={isSending}
            className="px-6 py-2.5 bg-blue-500 hover:bg-blue-600 text-white rounded-lg font-semibold transition-all flex items-center gap-2 disabled:opacity-50"
          >
            <Send className="w-4 h-4" />
            {isSending ? 'Envoi...' : 'Envoyer'}
          </button>
        </div>
      </motion.div>
    </div>
  );
}
