import { motion } from 'framer-motion';
import { useState, useEffect, useMemo } from 'react';
import { X, Save, Zap, Copy, DollarSign, Calendar, Clock } from 'lucide-react';
import { soapTemplates, quickNotes } from '../../lib/quickTemplates';
import { useToastContext } from '../../contexts/ToastContext';
import { supabase } from '../../lib/supabase';

interface UltraFastSoapNoteProps {
  isOpen: boolean;
  onClose: () => void;
  patientId?: string;
  patientName?: string;
  appointmentId?: string;
}

interface Patient {
  id: string;
  first_name: string;
  last_name: string;
  last_visit: string | null;
}

interface LastNote {
  subjective: string;
  objective: string;
  assessment: string;
  plan: string;
  visit_date: string;
}

interface ServiceType {
  id: string;
  name: string;
  default_price: number;
  duration_minutes: number;
}

interface AutoBilling {
  services: Array<{
    service_id: string;
    name: string;
    price: number;
  }>;
  total: number;
}

export function UltraFastSoapNote({
  isOpen,
  onClose,
  patientId,
  patientName,
  appointmentId
}: UltraFastSoapNoteProps) {
  const [selectedPatientId, setSelectedPatientId] = useState<string>(patientId || '');
  const [lastNote, setLastNote] = useState<LastNote | null>(null);
  const [serviceTypes, setServiceTypes] = useState<ServiceType[]>([]);
  const [saving, setSaving] = useState(false);
  const [showLastNote, setShowLastNote] = useState(false);
  const [autoSuggestions, setAutoSuggestions] = useState<string[]>([]);
  const [currentField, setCurrentField] = useState<'subjective' | 'objective' | 'assessment' | 'plan'>('subjective');

  const [formData, setFormData] = useState({
    subjective: '',
    objective: '',
    assessment: '',
    plan: ''
  });

  const [billing, setBilling] = useState<AutoBilling>({
    services: [],
    total: 0
  });

  const [nextAppointment, setNextAppointment] = useState({
    enabled: false,
    date: '',
    time: '09:00',
    duration: 30
  });

  const toast = useToastContext();

  useEffect(() => {
    if (isOpen && selectedPatientId) {
      loadPatientContext();
      loadServiceTypes();
    }
  }, [isOpen, selectedPatientId]);

  useEffect(() => {
    if (formData.plan) {
      detectServicesFromPlan(formData.plan);
    }
  }, [formData.plan]);

  async function loadPatientContext() {
    try {
      const { data: notes, error } = await supabase
        .from('soap_notes')
        .select('*')
        .eq('patient_id', selectedPatientId)
        .order('visit_date', { ascending: false })
        .limit(1);

      if (error) throw error;

      if (notes && notes.length > 0) {
        setLastNote(notes[0]);
        setShowLastNote(true);
      }
    } catch (error) {
      console.error('Error loading patient context:', error);
    }
  }

  async function loadServiceTypes() {
    try {
      const { data, error } = await supabase
        .from('service_types')
        .select('*')
        .eq('is_active', true)
        .order('name');

      if (error) throw error;
      setServiceTypes(data || []);
    } catch (error) {
      console.error('Error loading service types:', error);
    }
  }

  function copyLastNote() {
    if (lastNote) {
      setFormData({
        subjective: lastNote.subjective || '',
        objective: lastNote.objective || '',
        assessment: lastNote.assessment || '',
        plan: lastNote.plan || ''
      });
      setShowLastNote(false);
      toast.success('Dernière note copiée - Modifiez ce qui a changé');
    }
  }

  function detectServicesFromPlan(planText: string) {
    const detected: AutoBilling = {
      services: [],
      total: 0
    };

    const text = planText.toLowerCase();

    if (text.includes('ajustement') || text.includes('manipulation')) {
      const adjustment = serviceTypes.find(s => s.name.toLowerCase().includes('ajustement'));
      if (adjustment && !detected.services.find(s => s.service_id === adjustment.id)) {
        detected.services.push({
          service_id: adjustment.id,
          name: adjustment.name,
          price: adjustment.default_price
        });
      }
    }

    if (text.includes('consultation') || text.includes('évaluation')) {
      const consultation = serviceTypes.find(s => s.name.toLowerCase().includes('consultation'));
      if (consultation && !detected.services.find(s => s.service_id === consultation.id)) {
        detected.services.push({
          service_id: consultation.id,
          name: consultation.name,
          price: consultation.default_price
        });
      }
    }

    if (text.includes('thérapie') || text.includes('massage')) {
      const therapy = serviceTypes.find(s => s.name.toLowerCase().includes('thérapie'));
      if (therapy && !detected.services.find(s => s.service_id === therapy.id)) {
        detected.services.push({
          service_id: therapy.id,
          name: therapy.name,
          price: therapy.default_price
        });
      }
    }

    detected.total = detected.services.reduce((sum, s) => sum + s.price, 0);
    setBilling(detected);
  }

  function applyQuickTemplate(type: 'routine' | 'new' | 'urgent' | 'followup') {
    const templates = {
      routine: {
        subjective: 'Suivi régulier. ',
        objective: 'Palpation: ',
        assessment: 'Évolution positive. ',
        plan: 'Ajustement chiropratique. RDV dans 1 semaine.'
      },
      new: {
        subjective: 'Première consultation. ',
        objective: 'Examen complet: ',
        assessment: 'Diagnostic initial: ',
        plan: 'Plan de traitement recommandé: 2x/semaine pour 4 semaines.'
      },
      urgent: {
        subjective: 'Douleur aiguë depuis ',
        objective: 'Restriction importante: ',
        assessment: 'Nécessite traitement immédiat. ',
        plan: 'Ajustement + repos. Revoir dans 48h.'
      },
      followup: {
        subjective: 'Retour post-traitement. ',
        objective: 'Amélioration notée: ',
        assessment: 'Progression selon attentes. ',
        plan: 'Continuer traitement actuel. '
      }
    };

    const template = templates[type];
    setFormData(template);
    toast.success(`Template ${type} appliqué`);
  }

  function addService(service: ServiceType) {
    if (!billing.services.find(s => s.service_id === service.id)) {
      const newServices = [...billing.services, {
        service_id: service.id,
        name: service.name,
        price: service.default_price
      }];

      setBilling({
        services: newServices,
        total: newServices.reduce((sum, s) => sum + s.price, 0)
      });
    }
  }

  function removeService(serviceId: string) {
    const newServices = billing.services.filter(s => s.service_id !== serviceId);
    setBilling({
      services: newServices,
      total: newServices.reduce((sum, s) => sum + s.price, 0)
    });
  }

  async function handleSave() {
    if (!selectedPatientId) {
      toast.error('Patient requis');
      return;
    }

    if (!formData.subjective && !formData.objective && !formData.assessment && !formData.plan) {
      toast.error('Remplir au moins une section');
      return;
    }

    setSaving(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Non authentifié');

      const { data: noteData, error: noteError } = await supabase
        .from('soap_notes')
        .insert({
          patient_id: selectedPatientId,
          appointment_id: appointmentId || null,
          visit_date: new Date().toISOString(),
          subjective: formData.subjective || null,
          objective: formData.objective || null,
          assessment: formData.assessment || null,
          plan: formData.plan || null,
          created_by: user.id
        })
        .select()
        .single();

      if (noteError) throw noteError;

      if (billing.services.length > 0) {
        const invoiceItems = billing.services.map(s => ({
          service_id: s.service_id,
          quantity: 1,
          unit_price: s.price,
          total_price: s.price
        }));

        const { error: invoiceError } = await supabase
          .from('invoices')
          .insert({
            patient_id: selectedPatientId,
            appointment_id: appointmentId || null,
            soap_note_id: noteData.id,
            issue_date: new Date().toISOString().split('T')[0],
            due_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
            subtotal: billing.total,
            tax_amount: 0,
            total_amount: billing.total,
            status: 'unpaid',
            items: invoiceItems
          });

        if (invoiceError) throw invoiceError;
      }

      if (nextAppointment.enabled && nextAppointment.date) {
        const { error: aptError } = await supabase
          .from('appointments')
          .insert({
            patient_id: selectedPatientId,
            name: patientName || '',
            email: '',
            phone: '',
            scheduled_date: nextAppointment.date,
            scheduled_time: nextAppointment.time,
            duration_minutes: nextAppointment.duration,
            status: 'confirmed',
            reason: 'Suivi'
          });

        if (aptError) throw aptError;
      }

      if (appointmentId) {
        await supabase
          .from('appointments')
          .update({ status: 'completed' })
          .eq('id', appointmentId);
      }

      toast.success(`✅ Note sauvegardée${billing.services.length > 0 ? ' + Facture créée' : ''}${nextAppointment.enabled ? ' + RDV suivant booké' : ''}`);

      setFormData({ subjective: '', objective: '', assessment: '', plan: '' });
      setBilling({ services: [], total: 0 });
      setNextAppointment({ enabled: false, date: '', time: '09:00', duration: 30 });
      onClose();
    } catch (error: any) {
      console.error('Error saving:', error);
      toast.error('Erreur: ' + (error.message || 'Erreur inconnue'));
    } finally {
      setSaving(false);
    }
  }

  const suggestedNextDate = useMemo(() => {
    const next = new Date();
    next.setDate(next.getDate() + 7);
    return next.toISOString().split('T')[0];
  }, []);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[150] flex items-center justify-center p-6" onClick={onClose}>
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        onClick={(e) => e.stopPropagation()}
        className="bg-white w-full max-w-7xl max-h-[95vh] overflow-y-auto shadow-2xl rounded-xl"
      >
        <div className="sticky top-0 bg-gradient-to-r from-green-500 to-green-600 text-white p-6 flex items-center justify-between z-10">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center backdrop-blur">
              <Zap className="w-7 h-7" />
            </div>
            <div>
              <h3 className="text-2xl font-bold">⚡ SOAP Ultra-Rapide</h3>
              <p className="text-sm text-white/90">{patientName || 'Patient'} - {new Date().toLocaleDateString('fr-CA')}</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-white/20 rounded-lg transition-colors">
            <X className="w-6 h-6" />
          </button>
        </div>

        {lastNote && showLastNote && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            className="bg-blue-50 border-b-2 border-blue-200 p-6"
          >
            <div className="flex items-center justify-between mb-3">
              <div>
                <div className="font-bold text-blue-900">📋 Dernière note ({new Date(lastNote.visit_date).toLocaleDateString('fr-CA')})</div>
                <div className="text-sm text-blue-700">Cliquez pour copier et modifier seulement ce qui a changé</div>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={copyLastNote}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-all flex items-center gap-2"
                >
                  <Copy className="w-4 h-4" />
                  Copier et modifier
                </button>
                <button
                  onClick={() => setShowLastNote(false)}
                  className="px-4 py-2 bg-white border border-blue-300 text-blue-700 rounded-lg hover:bg-blue-50 transition-all"
                >
                  Nouvelle note
                </button>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div className="bg-white p-3 rounded border border-blue-200">
                <div className="font-medium text-blue-900 mb-1">Subjectif</div>
                <div className="text-gray-700">{lastNote.subjective?.substring(0, 100)}...</div>
              </div>
              <div className="bg-white p-3 rounded border border-blue-200">
                <div className="font-medium text-blue-900 mb-1">Plan</div>
                <div className="text-gray-700">{lastNote.plan?.substring(0, 100)}...</div>
              </div>
            </div>
          </motion.div>
        )}

        <div className="p-6">
          <div className="mb-6 flex gap-2">
            <button
              onClick={() => applyQuickTemplate('routine')}
              className="flex-1 px-4 py-3 bg-green-50 border-2 border-green-200 text-green-700 rounded-lg hover:bg-green-100 transition-all font-medium"
            >
              🔄 Routine
            </button>
            <button
              onClick={() => applyQuickTemplate('new')}
              className="flex-1 px-4 py-3 bg-blue-50 border-2 border-blue-200 text-blue-700 rounded-lg hover:bg-blue-100 transition-all font-medium"
            >
              ✨ Nouveau
            </button>
            <button
              onClick={() => applyQuickTemplate('urgent')}
              className="flex-1 px-4 py-3 bg-red-50 border-2 border-red-200 text-red-700 rounded-lg hover:bg-red-100 transition-all font-medium"
            >
              🚨 Urgent
            </button>
            <button
              onClick={() => applyQuickTemplate('followup')}
              className="flex-1 px-4 py-3 bg-purple-50 border-2 border-purple-200 text-purple-700 rounded-lg hover:bg-purple-100 transition-all font-medium"
            >
              📊 Suivi
            </button>
          </div>

          <div className="grid grid-cols-3 gap-6">
            <div className="col-span-2 space-y-4">
              {(['subjective', 'objective', 'assessment', 'plan'] as const).map((field) => (
                <div key={field}>
                  <label className="block text-sm font-bold text-gray-700 mb-2 uppercase">
                    {field === 'subjective' && '📝 S - Subjectif (Patient dit)'}
                    {field === 'objective' && '🔍 O - Objectif (Observations)'}
                    {field === 'assessment' && '⚕️ A - Assessment (Diagnostic)'}
                    {field === 'plan' && '📋 P - Plan (Traitement)'}
                  </label>
                  <textarea
                    value={formData[field]}
                    onChange={(e) => setFormData({ ...formData, [field]: e.target.value })}
                    onFocus={() => setCurrentField(field)}
                    rows={field === 'objective' ? 5 : 3}
                    className="w-full px-4 py-3 border-2 border-gray-300 focus:border-green-500 focus:ring-2 focus:ring-green-200 rounded-lg transition-all resize-none text-base"
                    placeholder={
                      field === 'subjective' ? 'Ex: Douleur bas dos depuis 3 jours...' :
                      field === 'objective' ? 'Ex: Restriction L5-S1, tension paravertébrale...' :
                      field === 'assessment' ? 'Ex: Subluxation lombaire...' :
                      'Ex: Ajustement chiropratique, suivi dans 1 semaine...'
                    }
                  />
                </div>
              ))}
            </div>

            <div className="space-y-6">
              <div className="bg-gradient-to-br from-gold-50 to-yellow-50 border-2 border-gold-300 rounded-xl p-4">
                <div className="flex items-center gap-2 mb-3">
                  <DollarSign className="w-5 h-5 text-gold-600" />
                  <h4 className="font-bold text-gray-900">Facturation Auto</h4>
                </div>

                {billing.services.length > 0 ? (
                  <div className="space-y-2 mb-3">
                    {billing.services.map((service) => (
                      <div key={service.service_id} className="flex items-center justify-between bg-white p-2 rounded border border-gold-200">
                        <span className="text-sm font-medium">{service.name}</span>
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-bold text-green-600">${service.price}</span>
                          <button
                            onClick={() => removeService(service.service_id)}
                            className="text-red-500 hover:text-red-700"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    ))}
                    <div className="pt-2 border-t-2 border-gold-300 flex items-center justify-between">
                      <span className="font-bold text-gray-900">TOTAL</span>
                      <span className="text-xl font-bold text-green-600">${billing.total}</span>
                    </div>
                  </div>
                ) : (
                  <div className="text-sm text-gray-600 mb-3 italic">
                    Services détectés auto ou ajoutez manuellement
                  </div>
                )}

                <div className="text-xs font-medium text-gray-700 mb-2">Services disponibles</div>
                <div className="space-y-1 max-h-40 overflow-y-auto">
                  {serviceTypes.slice(0, 6).map((service) => (
                    <button
                      key={service.id}
                      onClick={() => addService(service)}
                      disabled={!!billing.services.find(s => s.service_id === service.id)}
                      className="w-full text-left px-3 py-2 bg-white border border-gray-200 hover:border-gold-400 hover:bg-gold-50 rounded text-sm transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <div className="flex items-center justify-between">
                        <span>{service.name}</span>
                        <span className="font-bold text-green-600">${service.default_price}</span>
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              <div className="bg-gradient-to-br from-blue-50 to-indigo-50 border-2 border-blue-300 rounded-xl p-4">
                <div className="flex items-center gap-2 mb-3">
                  <Calendar className="w-5 h-5 text-blue-600" />
                  <h4 className="font-bold text-gray-900">Prochain RDV</h4>
                </div>

                <label className="flex items-center gap-2 mb-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={nextAppointment.enabled}
                    onChange={(e) => setNextAppointment({ ...nextAppointment, enabled: e.target.checked, date: suggestedNextDate })}
                    className="w-4 h-4 text-blue-600"
                  />
                  <span className="text-sm font-medium text-gray-700">Booker prochain rendez-vous</span>
                </label>

                {nextAppointment.enabled && (
                  <div className="space-y-3">
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">Date</label>
                      <input
                        type="date"
                        value={nextAppointment.date}
                        onChange={(e) => setNextAppointment({ ...nextAppointment, date: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">Heure</label>
                      <input
                        type="time"
                        value={nextAppointment.time}
                        onChange={(e) => setNextAppointment({ ...nextAppointment, time: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                      />
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between mt-6 pt-6 border-t-2 border-gray-200">
            <div className="text-sm text-gray-600">
              {billing.services.length > 0 && <span className="font-medium text-green-600">✓ Facture auto: ${billing.total}</span>}
              {nextAppointment.enabled && <span className="ml-4 font-medium text-blue-600">✓ RDV suivant: {nextAppointment.date}</span>}
            </div>
            <div className="flex gap-3">
              <button
                onClick={onClose}
                className="px-6 py-3 border-2 border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-all font-medium"
              >
                Annuler
              </button>
              <button
                onClick={handleSave}
                disabled={saving}
                className="flex items-center gap-2 px-8 py-3 bg-gradient-to-r from-green-500 to-green-600 text-white rounded-lg hover:from-green-600 hover:to-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 shadow-lg font-bold text-lg"
              >
                {saving ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    <span>Sauvegarde...</span>
                  </>
                ) : (
                  <>
                    <Save className="w-5 h-5" />
                    <span>Sauvegarder Tout (Ctrl+S)</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
