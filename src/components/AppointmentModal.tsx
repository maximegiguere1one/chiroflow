import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Calendar, ExternalLink, AlertCircle } from 'lucide-react';
import { submitAppointment, submitWaitlist, type AppointmentData, type WaitlistData } from '../lib/supabase';
import { useAsyncCallback } from '../hooks/useAsync';
import { createAppointmentValidator, sanitizeObject } from '../lib/validation';
import { performanceMonitor } from '../lib/performance';

interface AppointmentModalProps {
  isOpen: boolean;
  onClose: () => void;
  isAgendaFull: boolean;
}

export default function AppointmentModal({ isOpen, onClose, isAgendaFull }: AppointmentModalProps) {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    reason: '',
    patient_age: '',
    preferred_time: '',
  });
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});
  const [submitSuccess, setSubmitSuccess] = useState(false);

  const validator = createAppointmentValidator();

  const [submit, { loading: isSubmitting, error: submitError }] = useAsyncCallback(
    async (data: AppointmentData | WaitlistData) => {
      return performanceMonitor.measure(
        'appointment_submission',
        async () => {
          const sanitized = sanitizeObject(data);
          if (isAgendaFull) {
            await submitWaitlist(sanitized as WaitlistData);
          } else {
            await submitAppointment(sanitized as AppointmentData);
          }
        }
      );
    },
    {
      retry: true,
      onSuccess: () => {
        setSubmitSuccess(true);
        setTimeout(() => {
          onClose();
          setSubmitSuccess(false);
          setFormData({
            name: '',
            email: '',
            phone: '',
            reason: '',
            patient_age: '',
            preferred_time: '',
          });
          setValidationErrors({});
        }, 3000);
      },
    }
  );

  const validateField = (field: keyof typeof formData, value: string) => {
    if (!validator[field as keyof typeof validator]) return;

    const result = validator[field as keyof typeof validator].validate(value, field);
    setValidationErrors(prev => ({
      ...prev,
      [field]: result.valid ? '' : result.errors[0],
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setValidationErrors({});

    const errors: Record<string, string> = {};
    Object.keys(validator).forEach(field => {
      const key = field as keyof typeof validator;
      const value = formData[key as keyof typeof formData];
      const result = validator[key].validate(value as string, field);
      if (!result.valid) {
        errors[field] = result.errors[0];
      }
    });

    if (Object.keys(errors).length > 0) {
      setValidationErrors(errors);
      return;
    }

    try {
      await submit(formData);
    } catch (error) {
      console.error('Submission error:', error);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value,
    });

    if (validationErrors[name]) {
      validateField(name as keyof typeof formData, value);
    }
  };

  const handleBlur = (e: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    validateField(name as keyof typeof formData, value);
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={onClose}
          />

          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="relative bg-white rounded-3xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto"
          >
            <button
              onClick={onClose}
              className="absolute top-6 right-6 p-2 hover:bg-gray-100 rounded-full transition-colors"
            >
              <X className="w-6 h-6" />
            </button>

            <div className="p-8">
              <div className="flex items-center space-x-3 mb-6">
                <Calendar className="w-8 h-8 text-teal-600" />
                <h2 className="text-3xl font-bold text-gray-900">
                  {isAgendaFull ? 'Liste d\'attente' : 'Prendre rendez-vous'}
                </h2>
              </div>

              {isAgendaFull && (
                <div className="mb-6 bg-teal-50 border border-teal-200 rounded-2xl p-6">
                  <p className="text-gray-800 mb-4">
                    <strong>Notre agenda est actuellement complet.</strong> Inscrivez-vous à la liste d'attente et nous vous contacterons dès qu'une place se libère.
                  </p>
                  <p className="text-gray-700 mb-4">
                    En attendant, commencez le <strong>Programme Reconnexion</strong> pour progresser dès maintenant :
                  </p>
                  <ul className="space-y-2 text-sm text-gray-700 mb-4">
                    <li className="flex items-start">
                      <span className="text-teal-600 mr-2">•</span>
                      <span>Vidéos et protocoles guidés</span>
                    </li>
                    <li className="flex items-start">
                      <span className="text-teal-600 mr-2">•</span>
                      <span>10 clés basées sur les neurosciences</span>
                    </li>
                    <li className="flex items-start">
                      <span className="text-teal-600 mr-2">•</span>
                      <span>Exercices pratiques à domicile</span>
                    </li>
                  </ul>
                  <a
                    href="https://reconnexion.ca"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center space-x-2 text-teal-700 font-semibold hover:text-teal-800"
                  >
                    <span>Découvrir Reconnexion</span>
                    <ExternalLink className="w-4 h-4" />
                  </a>
                </div>
              )}

              {submitSuccess ? (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-green-50 border border-green-200 rounded-2xl p-8 text-center"
                >
                  <div className="w-16 h-16 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-4">
                    <svg className="w-8 h-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  <h3 className="text-2xl font-bold text-gray-900 mb-2">Demande envoyée !</h3>
                  <p className="text-gray-700">
                    {isAgendaFull
                      ? 'Vous êtes inscrit à la liste d\'attente. Nous vous contacterons bientôt.'
                      : 'Nous vous contacterons sous peu pour confirmer votre rendez-vous.'}
                  </p>
                </motion.div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Nom complet <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      name="name"
                      value={formData.name}
                      onChange={handleChange}
                      onBlur={handleBlur}
                      required
                      aria-invalid={!!validationErrors.name}
                      aria-describedby={validationErrors.name ? 'name-error' : undefined}
                      className={`w-full px-4 py-3 border rounded-xl focus:ring-2 focus:border-transparent transition-all ${
                        validationErrors.name
                          ? 'border-red-300 focus:ring-red-500'
                          : 'border-gray-300 focus:ring-teal-500'
                      }`}
                    />
                    {validationErrors.name && (
                      <div id="name-error" className="flex items-center gap-1 mt-1 text-sm text-red-600">
                        <AlertCircle className="w-4 h-4" />
                        <span>{validationErrors.name}</span>
                      </div>
                    )}
                  </div>

                  <div className="grid md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">
                        Courriel <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="email"
                        name="email"
                        value={formData.email}
                        onChange={handleChange}
                        onBlur={handleBlur}
                        required
                        aria-invalid={!!validationErrors.email}
                        aria-describedby={validationErrors.email ? 'email-error' : undefined}
                        className={`w-full px-4 py-3 border rounded-xl focus:ring-2 focus:border-transparent transition-all ${
                          validationErrors.email
                            ? 'border-red-300 focus:ring-red-500'
                            : 'border-gray-300 focus:ring-teal-500'
                        }`}
                      />
                      {validationErrors.email && (
                        <div id="email-error" className="flex items-center gap-1 mt-1 text-sm text-red-600">
                          <AlertCircle className="w-4 h-4" />
                          <span>{validationErrors.email}</span>
                        </div>
                      )}
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">
                        Téléphone <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="tel"
                        name="phone"
                        value={formData.phone}
                        onChange={handleChange}
                        onBlur={handleBlur}
                        required
                        aria-invalid={!!validationErrors.phone}
                        aria-describedby={validationErrors.phone ? 'phone-error' : undefined}
                        className={`w-full px-4 py-3 border rounded-xl focus:ring-2 focus:border-transparent transition-all ${
                          validationErrors.phone
                            ? 'border-red-300 focus:ring-red-500'
                            : 'border-gray-300 focus:ring-teal-500'
                        }`}
                      />
                      {validationErrors.phone && (
                        <div id="phone-error" className="flex items-center gap-1 mt-1 text-sm text-red-600">
                          <AlertCircle className="w-4 h-4" />
                          <span>{validationErrors.phone}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Motif de consultation <span className="text-red-500">*</span>
                    </label>
                    <textarea
                      name="reason"
                      value={formData.reason}
                      onChange={handleChange}
                      onBlur={handleBlur}
                      required
                      rows={3}
                      aria-invalid={!!validationErrors.reason}
                      aria-describedby={validationErrors.reason ? 'reason-error' : undefined}
                      className={`w-full px-4 py-3 border rounded-xl focus:ring-2 focus:border-transparent transition-all resize-none ${
                        validationErrors.reason
                          ? 'border-red-300 focus:ring-red-500'
                          : 'border-gray-300 focus:ring-teal-500'
                      }`}
                      placeholder="Ex: Coliques, TDA/H, douleurs grossesse..."
                    />
                    {validationErrors.reason && (
                      <div id="reason-error" className="flex items-center gap-1 mt-1 text-sm text-red-600">
                        <AlertCircle className="w-4 h-4" />
                        <span>{validationErrors.reason}</span>
                      </div>
                    )}
                  </div>

                  <div className="grid md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">
                        Âge du patient
                      </label>
                      <input
                        type="text"
                        name="patient_age"
                        value={formData.patient_age}
                        onChange={handleChange}
                        className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-teal-500 focus:border-transparent transition-all"
                        placeholder="Ex: 3 mois, 7 ans, adulte"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">
                        Moment préféré
                      </label>
                      <select
                        name="preferred_time"
                        value={formData.preferred_time}
                        onChange={handleChange}
                        className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-teal-500 focus:border-transparent transition-all"
                      >
                        <option value="">Sélectionner</option>
                        <option value="Matin">Matin</option>
                        <option value="Après-midi">Après-midi</option>
                        <option value="Fin de journée">Fin de journée</option>
                        <option value="Flexible">Flexible</option>
                      </select>
                    </div>
                  </div>

                  {submitError && (
                    <div className="bg-red-50 border border-red-200 rounded-xl p-4">
                      <div className="flex items-start gap-3">
                        <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                        <div className="flex-1">
                          <h4 className="text-sm font-semibold text-red-900 mb-1">Erreur lors de l'envoi</h4>
                          <p className="text-sm text-red-700">{submitError}</p>
                          <p className="text-xs text-red-600 mt-2">
                            Si le problème persiste, contactez-nous au (418) 653-5551
                          </p>
                        </div>
                      </div>
                    </div>
                  )}

                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full px-8 py-4 bg-teal-600 text-white rounded-full hover:bg-teal-700 transition-all duration-300 text-lg font-medium shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  >
                    {isSubmitting && (
                      <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                    )}
                    <span>{isSubmitting ? 'Envoi en cours...' : isAgendaFull ? 'Joindre la liste' : 'Envoyer la demande'}</span>
                  </button>

                  <p className="text-xs text-gray-600 text-center">
                    En soumettant ce formulaire, vous consentez à être contacté par notre équipe.
                  </p>
                </form>
              )}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
