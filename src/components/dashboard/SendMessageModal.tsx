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
  const { showToast } = useToastContext();
  const [messageType, setMessageType] = useState<'email' | 'sms'>('email');
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [isSending, setIsSending] = useState(false);

  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, []);

  const handleSend = async () => {
    if (!message.trim()) {
      showToast('Veuillez entrer un message', 'error');
      return;
    }

    if (messageType === 'email' && !subject.trim()) {
      showToast('Veuillez entrer un sujet', 'error');
      return;
    }

    setIsSending(true);
    try {
      // Insert into email tracking or SMS log
      await supabase.from('email_logs').insert({
        contact_id: patient.id,
        recipient_email: patient.email,
        subject: subject,
        body: message,
        status: 'sent',
        sent_at: new Date().toISOString()
      });

      showToast(`${messageType === 'email' ? 'Email' : 'SMS'} envoyé avec succès!`, 'success');
      onClose();
    } catch (error) {
      showToast('Erreur lors de l\'envoi', 'error');
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
      className="fixed inset-0 bg-black/70 backdrop-blur-sm z-[60] flex items-center justify-center p-4 overflow-y-auto"
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
