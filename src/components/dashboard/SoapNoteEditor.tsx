import { motion } from 'framer-motion';
import { useState } from 'react';
import { X, Save, FileText } from 'lucide-react';
import type { SoapNote, Patient } from '../../types/database';
import { supabase } from '../../lib/supabase';
import { useToastContext } from '../../contexts/ToastContext';
import { Tooltip } from '../common/Tooltip';
import { buttonHover, buttonTap } from '../../lib/animations';

interface SoapNoteEditorProps {
  patient: Patient;
  existingNote?: SoapNote;
  onClose: () => void;
  onSave: () => void;
}

export function SoapNoteEditor({ patient, existingNote, onClose, onSave }: SoapNoteEditorProps) {
  const toast = useToastContext();
  const [formData, setFormData] = useState({
    visit_date: existingNote?.visit_date || new Date().toISOString().split('T')[0],
    subjective: existingNote?.subjective || '',
    objective: existingNote?.objective || '',
    assessment: existingNote?.assessment || '',
    plan: existingNote?.plan || '',
    follow_up_date: existingNote?.follow_up_date || '',
  });

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError('');

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Non authentifié');

      const noteData = {
        ...formData,
        patient_id: patient.id,
        created_by: user.id,
        subjective: formData.subjective || null,
        objective: formData.objective || null,
        assessment: formData.assessment || null,
        plan: formData.plan || null,
        follow_up_date: formData.follow_up_date || null,
      };

      if (existingNote) {
        const { error: updateError } = await supabase
          .from('soap_notes')
          .update(noteData)
          .eq('id', existingNote.id);

        if (updateError) throw updateError;
      } else {
        const { error: insertError } = await supabase
          .from('soap_notes')
          .insert([noteData]);

        if (insertError) throw insertError;
      }

      toast.success(existingNote ? 'Note SOAP mise à jour' : 'Note SOAP créée');
      onSave();
      onClose();
    } catch (err: any) {
      const errorMsg = err.message || 'Erreur lors de l\'enregistrement';
      setError(errorMsg);
      toast.error(errorMsg);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-6">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-white w-full max-w-4xl max-h-[90vh] overflow-y-auto shadow-lifted"
      >
        <div className="sticky top-0 bg-white border-b border-neutral-200 p-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-gold-400 to-gold-600 rounded-lg flex items-center justify-center">
              <FileText className="w-6 h-6 text-white" />
            </div>
            <div>
              <h3 className="text-2xl font-heading text-foreground">Note SOAP</h3>
              <p className="text-sm text-foreground/60 mt-1">
                {patient.first_name} {patient.last_name}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-neutral-100 rounded-lg transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
              {error}
            </div>
          )}

          <div className="grid grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-foreground/70 mb-2">
                Date de la visite *
              </label>
              <input
                type="date"
                required
                value={formData.visit_date}
                onChange={(e) => setFormData({ ...formData, visit_date: e.target.value })}
                className="w-full px-4 py-3 border border-neutral-300 focus:border-gold-400 focus:outline-none focus:ring-2 focus:ring-gold-200 transition-all"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-foreground/70 mb-2">
                Date de suivi
              </label>
              <input
                type="date"
                value={formData.follow_up_date}
                onChange={(e) => setFormData({ ...formData, follow_up_date: e.target.value })}
                className="w-full px-4 py-3 border border-neutral-300 focus:border-gold-400 focus:outline-none focus:ring-2 focus:ring-gold-200 transition-all"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-foreground/70 mb-2">
              <strong>S</strong>ubjectif
            </label>
            <p className="text-xs text-foreground/50 mb-2">
              Symptômes rapportés par le patient, ce qu'il ressent
            </p>
            <textarea
              value={formData.subjective}
              onChange={(e) => setFormData({ ...formData, subjective: e.target.value })}
              rows={4}
              className="w-full px-4 py-3 border border-neutral-300 focus:border-gold-400 focus:outline-none focus:ring-2 focus:ring-gold-200 transition-all resize-none"
              placeholder="Ex: Douleur au bas du dos depuis 3 jours, irradiant dans la jambe gauche..."
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-foreground/70 mb-2">
              <strong>O</strong>bjectif
            </label>
            <p className="text-xs text-foreground/50 mb-2">
              Observations mesurables, examens physiques, tests
            </p>
            <textarea
              value={formData.objective}
              onChange={(e) => setFormData({ ...formData, objective: e.target.value })}
              rows={4}
              className="w-full px-4 py-3 border border-neutral-300 focus:border-gold-400 focus:outline-none focus:ring-2 focus:ring-gold-200 transition-all resize-none"
              placeholder="Ex: ROM lombaire réduite de 40%, tension musculaire palpable L4-L5..."
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-foreground/70 mb-2">
              <strong>A</strong>ssessment (Évaluation)
            </label>
            <p className="text-xs text-foreground/50 mb-2">
              Diagnostic ou impression clinique
            </p>
            <textarea
              value={formData.assessment}
              onChange={(e) => setFormData({ ...formData, assessment: e.target.value })}
              rows={3}
              className="w-full px-4 py-3 border border-neutral-300 focus:border-gold-400 focus:outline-none focus:ring-2 focus:ring-gold-200 transition-all resize-none"
              placeholder="Ex: Subluxation lombaire avec spasme musculaire secondaire..."
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-foreground/70 mb-2">
              <strong>P</strong>lan
            </label>
            <p className="text-xs text-foreground/50 mb-2">
              Plan de traitement, recommandations, suivi
            </p>
            <textarea
              value={formData.plan}
              onChange={(e) => setFormData({ ...formData, plan: e.target.value })}
              rows={4}
              className="w-full px-4 py-3 border border-neutral-300 focus:border-gold-400 focus:outline-none focus:ring-2 focus:ring-gold-200 transition-all resize-none"
              placeholder="Ex: Ajustement L4-L5, thérapie des tissus mous, exercices d'étirement, retour dans 1 semaine..."
            />
          </div>

          <div className="flex items-center justify-end gap-4 pt-6 border-t border-neutral-200">
            <Tooltip content="Fermer sans enregistrer" placement="top">
              <motion.button
                type="button"
                onClick={onClose}
                className="px-6 py-3 border border-neutral-300 text-foreground hover:bg-neutral-50 transition-all"
                whileHover={buttonHover}
                whileTap={buttonTap}
              >
                Annuler
              </motion.button>
            </Tooltip>
            <Tooltip content={existingNote ? "Mettre à jour la note" : "Créer la note SOAP"} placement="top">
              <motion.button
                type="submit"
                disabled={saving}
                className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-gold-500 to-gold-600 text-white hover:from-gold-600 hover:to-gold-700 disabled:opacity-50 transition-all duration-300 shadow-soft hover:shadow-gold"
                whileHover={!saving ? buttonHover : undefined}
                whileTap={!saving ? buttonTap : undefined}
              >
                <Save className="w-4 h-4" />
                <span>{saving ? 'Enregistrement...' : 'Enregistrer'}</span>
              </motion.button>
            </Tooltip>
          </div>
        </form>
      </motion.div>
    </div>
  );
}
