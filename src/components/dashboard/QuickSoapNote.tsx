import { motion } from 'framer-motion';
import { useState, useEffect } from 'react';
import { X, Save, Zap, Copy, Search } from 'lucide-react';
import { soapTemplates, quickNotes } from '../../lib/quickTemplates';
import { useToastContext } from '../../contexts/ToastContext';
import { supabase } from '../../lib/supabase';

interface QuickSoapNoteProps {
  isOpen: boolean;
  onClose: () => void;
  patientId?: string;
  patientName?: string;
}

interface Patient {
  id: string;
  first_name: string;
  last_name: string;
}

export function QuickSoapNote({ isOpen, onClose, patientId, patientName }: QuickSoapNoteProps) {
  const [selectedTemplate, setSelectedTemplate] = useState<string>('');
  const [selectedPatientId, setSelectedPatientId] = useState<string>(patientId || '');
  const [patients, setPatients] = useState<Patient[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [showPatientSearch, setShowPatientSearch] = useState(!patientId);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({
    subjective: '',
    objective: '',
    assessment: '',
    plan: ''
  });
  const toast = useToastContext();

  useEffect(() => {
    if (isOpen && !patientId) {
      loadPatients();
    }
  }, [isOpen, patientId]);

  async function loadPatients() {
    try {
      const { data, error } = await supabase
        .from('patients_full')
        .select('id, first_name, last_name')
        .eq('status', 'active')
        .order('last_name', { ascending: true });

      if (error) throw error;
      setPatients(data || []);
    } catch (error) {
      console.error('Error loading patients:', error);
      toast.error('Erreur lors du chargement des patients');
    }
  }

  const filteredPatients = patients.filter(p =>
    `${p.first_name} ${p.last_name}`.toLowerCase().includes(searchTerm.toLowerCase())
  );

  function applyTemplate(templateId: string) {
    const template = soapTemplates.find(t => t.id === templateId);
    if (template) {
      setFormData({
        subjective: template.subjective,
        objective: template.objective,
        assessment: template.assessment,
        plan: template.plan
      });
      setSelectedTemplate(templateId);
      toast.success(`Template "${template.name}" appliqué`);
    }
  }

  function insertQuickText(field: keyof typeof formData, text: string) {
    setFormData(prev => ({
      ...prev,
      [field]: prev[field] ? `${prev[field]}\n${text}` : text
    }));
  }

  async function handleSave() {
    if (!selectedPatientId) {
      toast.error('Veuillez sélectionner un patient');
      return;
    }

    if (!formData.subjective && !formData.objective && !formData.assessment && !formData.plan) {
      toast.error('Veuillez remplir au moins une section');
      return;
    }

    setSaving(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) {
        throw new Error('Non authentifié');
      }

      const { error } = await supabase
        .from('soap_notes')
        .insert({
          patient_id: selectedPatientId,
          visit_date: new Date().toISOString(),
          subjective: formData.subjective || null,
          objective: formData.objective || null,
          assessment: formData.assessment || null,
          plan: formData.plan || null,
          created_by: user.id
        });

      if (error) throw error;

      toast.success('Note SOAP enregistrée avec succès');

      setFormData({
        subjective: '',
        objective: '',
        assessment: '',
        plan: ''
      });
      setSelectedTemplate('');
      onClose();
    } catch (error: any) {
      console.error('Error saving SOAP note:', error);
      toast.error('Erreur lors de l\'enregistrement: ' + (error.message || 'Erreur inconnue'));
    } finally {
      setSaving(false);
    }
  }

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[60] flex items-center justify-center p-6">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-white w-full max-w-6xl max-h-[90vh] overflow-y-auto shadow-lifted"
      >
        <div className="sticky top-0 bg-white border-b border-neutral-200 p-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-green-500 to-green-600 rounded-lg flex items-center justify-center">
              <Zap className="w-6 h-6 text-white" />
            </div>
            <div>
              <h3 className="text-2xl font-heading text-foreground">Note SOAP rapide</h3>
              {selectedPatientId && (
                <p className="text-sm text-foreground/60 mt-1">
                  {patientName || patients.find(p => p.id === selectedPatientId)?.first_name + ' ' + patients.find(p => p.id === selectedPatientId)?.last_name}
                </p>
              )}
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-neutral-100 rounded-lg transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {showPatientSearch && !selectedPatientId && (
          <div className="p-6 bg-neutral-50 border-b border-neutral-200">
            <label className="block text-sm font-medium text-foreground/70 mb-3">
              Sélectionner un patient <span className="text-red-500">*</span>
            </label>
            <div className="relative mb-3">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-foreground/40" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Rechercher un patient..."
                className="w-full pl-10 pr-4 py-3 border border-neutral-300 focus:border-gold-400 focus:outline-none focus:ring-2 focus:ring-gold-200 transition-all"
              />
            </div>
            <div className="max-h-48 overflow-y-auto space-y-2">
              {filteredPatients.slice(0, 10).map((patient) => (
                <button
                  key={patient.id}
                  onClick={() => {
                    setSelectedPatientId(patient.id);
                    setShowPatientSearch(false);
                  }}
                  className="w-full text-left px-4 py-3 bg-white border border-neutral-200 hover:border-gold-400 hover:bg-gold-50 transition-all rounded"
                >
                  {patient.first_name} {patient.last_name}
                </button>
              ))}
              {filteredPatients.length === 0 && (
                <p className="text-sm text-foreground/60 text-center py-4">
                  Aucun patient trouvé
                </p>
              )}
            </div>
          </div>
        )}

        <div className="grid grid-cols-3 gap-6 p-6">
          {/* Templates sidebar */}
          <div className="space-y-4">
            <div>
              <h4 className="font-medium text-foreground mb-3">Templates rapides</h4>
              <div className="space-y-2">
                {soapTemplates.map(template => (
                  <button
                    key={template.id}
                    onClick={() => applyTemplate(template.id)}
                    className={`w-full text-left p-3 border rounded-lg transition-all ${
                      selectedTemplate === template.id
                        ? 'border-gold-400 bg-gold-50'
                        : 'border-neutral-200 hover:border-gold-300 bg-white'
                    }`}
                  >
                    <div className="font-medium text-sm text-foreground mb-1">
                      {template.name}
                    </div>
                    <div className="text-xs text-foreground/60">
                      {template.category}
                    </div>
                  </button>
                ))}
              </div>
            </div>

            <div>
              <h4 className="font-medium text-foreground mb-3">Textes rapides</h4>
              <div className="space-y-3">
                <QuickTextSection
                  title="Observations courantes"
                  items={quickNotes.commonFindings}
                  onInsert={(text) => insertQuickText('objective', text)}
                />
                <QuickTextSection
                  title="Traitements"
                  items={quickNotes.commonTreatments}
                  onInsert={(text) => insertQuickText('plan', text)}
                />
              </div>
            </div>
          </div>

          {/* SOAP Form */}
          <div className="col-span-2 space-y-4">
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="block text-sm font-medium text-foreground/70">
                  <strong>S</strong>ubjectif - Ce que le patient dit
                </label>
                <button
                  onClick={() => navigator.clipboard.writeText(formData.subjective)}
                  className="p-1 hover:bg-neutral-100 rounded"
                >
                  <Copy className="w-4 h-4" />
                </button>
              </div>
              <textarea
                value={formData.subjective}
                onChange={(e) => setFormData({ ...formData, subjective: e.target.value })}
                rows={4}
                className="w-full px-4 py-3 border border-neutral-300 focus:border-gold-400 focus:outline-none focus:ring-2 focus:ring-gold-200 transition-all resize-none"
                placeholder="Symptômes rapportés par le patient..."
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="block text-sm font-medium text-foreground/70">
                  <strong>O</strong>bjectif - Observations et examens
                </label>
                <button
                  onClick={() => navigator.clipboard.writeText(formData.objective)}
                  className="p-1 hover:bg-neutral-100 rounded"
                >
                  <Copy className="w-4 h-4" />
                </button>
              </div>
              <textarea
                value={formData.objective}
                onChange={(e) => setFormData({ ...formData, objective: e.target.value })}
                rows={5}
                className="w-full px-4 py-3 border border-neutral-300 focus:border-gold-400 focus:outline-none focus:ring-2 focus:ring-gold-200 transition-all resize-none"
                placeholder="Observations, tests, palpation..."
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="block text-sm font-medium text-foreground/70">
                  <strong>A</strong>ssessment - Évaluation/Diagnostic
                </label>
                <button
                  onClick={() => navigator.clipboard.writeText(formData.assessment)}
                  className="p-1 hover:bg-neutral-100 rounded"
                >
                  <Copy className="w-4 h-4" />
                </button>
              </div>
              <textarea
                value={formData.assessment}
                onChange={(e) => setFormData({ ...formData, assessment: e.target.value })}
                rows={3}
                className="w-full px-4 py-3 border border-neutral-300 focus:border-gold-400 focus:outline-none focus:ring-2 focus:ring-gold-200 transition-all resize-none"
                placeholder="Diagnostic, impression clinique..."
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="block text-sm font-medium text-foreground/70">
                  <strong>P</strong>lan - Plan de traitement
                </label>
                <button
                  onClick={() => navigator.clipboard.writeText(formData.plan)}
                  className="p-1 hover:bg-neutral-100 rounded"
                >
                  <Copy className="w-4 h-4" />
                </button>
              </div>
              <textarea
                value={formData.plan}
                onChange={(e) => setFormData({ ...formData, plan: e.target.value })}
                rows={4}
                className="w-full px-4 py-3 border border-neutral-300 focus:border-gold-400 focus:outline-none focus:ring-2 focus:ring-gold-200 transition-all resize-none"
                placeholder="Traitements effectués, recommandations, suivi..."
              />
            </div>

            <div className="flex items-center justify-end gap-3 pt-4 border-t border-neutral-200">
              <button
                onClick={onClose}
                className="px-6 py-3 border border-neutral-300 text-foreground hover:bg-neutral-50 transition-all"
              >
                Annuler
              </button>
              <button
                onClick={handleSave}
                disabled={saving || !selectedPatientId}
                className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-green-500 to-green-600 text-white hover:from-green-600 hover:to-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 shadow-soft"
              >
                {saving ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    <span>Enregistrement...</span>
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4" />
                    <span>Enregistrer (Ctrl+S)</span>
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

function QuickTextSection({
  title,
  items,
  onInsert
}: {
  title: string;
  items: string[];
  onInsert: (text: string) => void;
}) {
  return (
    <div>
      <div className="text-xs font-medium text-foreground/60 mb-2">{title}</div>
      <div className="space-y-1">
        {items.slice(0, 4).map((item, index) => (
          <button
            key={index}
            onClick={() => onInsert(item)}
            className="w-full text-left px-2 py-1.5 text-xs bg-neutral-50 hover:bg-gold-50 border border-neutral-200 hover:border-gold-300 rounded transition-all"
          >
            {item}
          </button>
        ))}
      </div>
    </div>
  );
}
