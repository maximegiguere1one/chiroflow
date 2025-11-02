import { motion, AnimatePresence } from 'framer-motion';
import { useState, useEffect } from 'react';
import { X, DollarSign, Zap, Send, Check, Loader2 } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useToastContext } from '../../contexts/ToastContext';

interface ServiceType {
  id: string;
  name: string;
  description: string;
  duration_minutes: number;
  price: number;
  color: string;
  category: string;
}

interface QuickBillingModalProps {
  patient: {
    id: string;
    first_name: string;
    last_name: string;
    email?: string;
  };
  onClose: () => void;
  onSuccess?: () => void;
}

export function QuickBillingModal({ patient, onClose, onSuccess }: QuickBillingModalProps) {
  const toast = useToastContext();
  const [services, setServices] = useState<ServiceType[]>([]);
  const [selectedServices, setSelectedServices] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [sendEmail, setSendEmail] = useState(true);

  useEffect(() => {
    loadServices();
  }, []);

  async function loadServices() {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from('service_types')
        .select('*')
        .eq('owner_id', user.id)
        .eq('is_active', true)
        .order('category', { ascending: true })
        .order('name', { ascending: true });

      if (error) throw error;
      setServices(data || []);
    } catch (error) {
      console.error('Error loading services:', error);
      toast.error('Erreur lors du chargement des services');
    } finally {
      setLoading(false);
    }
  }

  function toggleService(serviceId: string) {
    setSelectedServices(prev =>
      prev.includes(serviceId)
        ? prev.filter(id => id !== serviceId)
        : [...prev, serviceId]
    );
  }

  const selectedServicesList = services.filter(s => selectedServices.includes(s.id));
  const subtotal = selectedServicesList.reduce((sum, s) => sum + s.price, 0);
  const taxRate = 0.14975;
  const taxes = subtotal * taxRate;
  const total = subtotal + taxes;

  async function handleSubmit() {
    if (selectedServices.length === 0) {
      toast.error('Veuillez sélectionner au moins un service');
      return;
    }

    setSubmitting(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Non authentifié');

      const invoiceNumber = `INV-${Date.now()}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`;

      const description = selectedServicesList
        .map(s => `${s.name} - ${s.duration_minutes} min`)
        .join('\n');

      const { data: invoice, error: invoiceError } = await supabase
        .from('billing')
        .insert({
          patient_id: patient.id,
          owner_id: user.id,
          invoice_number: invoiceNumber,
          service_date: new Date().toISOString().split('T')[0],
          description: description,
          amount: subtotal,
          tax_amount: taxes,
          total_amount: total,
          payment_status: 'pending',
          notes: `Facture générée automatiquement - ${selectedServicesList.length} service(s)`
        })
        .select()
        .single();

      if (invoiceError) throw invoiceError;

      if (sendEmail && patient.email) {
        try {
          const { error: emailError } = await supabase.functions.invoke('send-booking-confirmation', {
            body: {
              to: patient.email,
              subject: `Facture ${invoiceNumber} - ${subtotal.toFixed(2)}$`,
              patientName: `${patient.first_name} ${patient.last_name}`,
              invoiceNumber: invoiceNumber,
              services: selectedServicesList.map(s => ({
                name: s.name,
                duration: s.duration_minutes,
                price: s.price
              })),
              subtotal: subtotal,
              taxes: taxes,
              total: total,
              type: 'invoice'
            }
          });

          if (emailError) {
            console.error('Email error:', emailError);
            toast.warning('Facture créée mais email non envoyé');
          }
        } catch (emailErr) {
          console.error('Email send error:', emailErr);
        }
      }

      toast.success(`Facture ${invoiceNumber} créée avec succès!`);
      onSuccess?.();
      onClose();
    } catch (error) {
      console.error('Error creating invoice:', error);
      toast.error('Erreur lors de la création de la facture');
    } finally {
      setSubmitting(false);
    }
  }

  const groupedServices = services.reduce((acc, service) => {
    if (!acc[service.category]) {
      acc[service.category] = [];
    }
    acc[service.category].push(service);
    return acc;
  }, {} as Record<string, ServiceType[]>);

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.95, opacity: 0 }}
          onClick={(e) => e.stopPropagation()}
          className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl max-h-[90vh] overflow-hidden flex flex-col"
        >
          {/* Header */}
          <div className="p-6 border-b border-neutral-200 bg-gradient-to-r from-gold-50 to-white">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-gold-400 rounded-xl flex items-center justify-center">
                  <Zap className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h2 className="text-2xl font-heading text-foreground">Facturation Express</h2>
                  <p className="text-sm text-foreground/60">
                    {patient.first_name} {patient.last_name}
                  </p>
                </div>
              </div>
              <button
                onClick={onClose}
                className="p-2 hover:bg-neutral-100 rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="flex items-center gap-2 text-xs text-foreground/60">
              <Zap className="w-3 h-3" />
              <span>Sélectionnez les services → Générez la facture → Email automatique!</span>
            </div>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto p-6">
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <div className="w-8 h-8 border-4 border-gold-400 border-t-transparent rounded-full animate-spin" />
              </div>
            ) : services.length === 0 ? (
              <div className="text-center py-12">
                <DollarSign className="w-12 h-12 text-neutral-300 mx-auto mb-3" />
                <p className="text-foreground/60 mb-4">Aucun service configuré</p>
                <p className="text-sm text-foreground/50">
                  Allez dans Paramètres → Types de service pour en créer
                </p>
              </div>
            ) : (
              <div className="space-y-6">
                {Object.entries(groupedServices).map(([category, categoryServices]) => (
                  <div key={category}>
                    <h3 className="text-sm font-semibold text-foreground/70 uppercase tracking-wide mb-3">
                      {category}
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {categoryServices.map((service) => {
                        const isSelected = selectedServices.includes(service.id);
                        return (
                          <motion.button
                            key={service.id}
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            onClick={() => toggleService(service.id)}
                            className={`p-4 rounded-xl border-2 text-left transition-all ${
                              isSelected
                                ? 'border-gold-400 bg-gold-50 shadow-md'
                                : 'border-neutral-200 hover:border-gold-200 bg-white'
                            }`}
                          >
                            <div className="flex items-start justify-between mb-2">
                              <div
                                className="w-3 h-3 rounded-full mt-1"
                                style={{ backgroundColor: service.color }}
                              />
                              {isSelected && (
                                <div className="w-6 h-6 bg-gold-400 rounded-full flex items-center justify-center">
                                  <Check className="w-4 h-4 text-white" />
                                </div>
                              )}
                            </div>
                            <div className="font-semibold text-foreground mb-1">
                              {service.name}
                            </div>
                            <div className="text-sm text-foreground/60 mb-2 line-clamp-1">
                              {service.description}
                            </div>
                            <div className="flex items-center justify-between">
                              <span className="text-xs text-foreground/50">
                                {service.duration_minutes} min
                              </span>
                              <span className="text-lg font-bold text-gold-600">
                                {service.price.toFixed(2)} $
                              </span>
                            </div>
                          </motion.button>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Footer with Summary */}
          {selectedServices.length > 0 && (
            <div className="border-t border-neutral-200 bg-neutral-50 p-6">
              <div className="space-y-3 mb-4">
                <div className="flex justify-between text-sm">
                  <span className="text-foreground/60">Sous-total:</span>
                  <span className="font-semibold">{subtotal.toFixed(2)} $</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-foreground/60">Taxes (14.975%):</span>
                  <span className="font-semibold">{taxes.toFixed(2)} $</span>
                </div>
                <div className="flex justify-between text-lg font-bold border-t pt-3">
                  <span>Total:</span>
                  <span className="text-gold-600">{total.toFixed(2)} $</span>
                </div>
              </div>

              {patient.email && (
                <label className="flex items-center gap-2 mb-4 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={sendEmail}
                    onChange={(e) => setSendEmail(e.target.checked)}
                    className="w-4 h-4 text-gold-600 border-neutral-300 rounded focus:ring-gold-500"
                  />
                  <span className="text-sm text-foreground/70">
                    Envoyer par email à {patient.email}
                  </span>
                </label>
              )}

              <div className="flex gap-3">
                <button
                  onClick={onClose}
                  disabled={submitting}
                  className="flex-1 px-6 py-3 border-2 border-neutral-300 rounded-xl font-semibold hover:bg-neutral-100 transition-colors disabled:opacity-50"
                >
                  Annuler
                </button>
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={handleSubmit}
                  disabled={submitting}
                  className="flex-1 px-6 py-3 bg-gradient-to-r from-gold-500 to-gold-600 text-white rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {submitting ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      <span>Génération...</span>
                    </>
                  ) : (
                    <>
                      <Send className="w-5 h-5" />
                      <span>Créer Facture</span>
                    </>
                  )}
                </motion.button>
              </div>
            </div>
          )}
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
