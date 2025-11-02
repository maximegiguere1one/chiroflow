import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Plus, Trash2, Save, FileText, Eye, ChevronDown, ChevronUp } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useToastContext } from '../../contexts/ToastContext';
import { buttonHover, buttonTap } from '../../lib/animations';

interface Question {
  id: string;
  type: 'text' | 'textarea' | 'select' | 'checkbox' | 'radio' | 'date' | 'number';
  label: string;
  options?: string[];
  required: boolean;
  placeholder?: string;
}

interface IntakeForm {
  id: string;
  title: string;
  description: string;
  form_type: string;
  questions: Question[];
  active: boolean;
  required_for_booking: boolean;
  send_before_hours: number;
}

export default function IntakeFormBuilder() {
  const toast = useToastContext();
  const [forms, setForms] = useState<IntakeForm[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<string | null>(null);
  const [expandedForm, setExpandedForm] = useState<string | null>(null);

  const [currentForm, setCurrentForm] = useState<Partial<IntakeForm>>({
    title: '',
    description: '',
    form_type: 'general',
    questions: [],
    active: true,
    required_for_booking: false,
    send_before_hours: 48,
  });

  useEffect(() => {
    loadForms();
  }, []);

  async function loadForms() {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Non authentifié');

      const { data, error } = await supabase
        .from('intake_forms')
        .select('*')
        .eq('owner_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setForms(data || []);
    } catch (error: any) {
      console.error('Error loading forms:', error);
      toast.error('Erreur lors du chargement des formulaires');
    } finally {
      setLoading(false);
    }
  }

  function addQuestion() {
    const newQuestion: Question = {
      id: crypto.randomUUID(),
      type: 'text',
      label: 'Nouvelle question',
      required: false,
      placeholder: '',
    };

    setCurrentForm({
      ...currentForm,
      questions: [...(currentForm.questions || []), newQuestion],
    });
  }

  function updateQuestion(id: string, updates: Partial<Question>) {
    setCurrentForm({
      ...currentForm,
      questions: (currentForm.questions || []).map((q) =>
        q.id === id ? { ...q, ...updates } : q
      ),
    });
  }

  function removeQuestion(id: string) {
    setCurrentForm({
      ...currentForm,
      questions: (currentForm.questions || []).filter((q) => q.id !== id),
    });
  }

  async function saveForm() {
    if (!currentForm.title?.trim()) {
      toast.error('Le titre est obligatoire');
      return;
    }

    if (!currentForm.questions || currentForm.questions.length === 0) {
      toast.error('Ajoutez au moins une question');
      return;
    }

    setLoading(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Non authentifié');

      const formData = {
        ...currentForm,
        owner_id: user.id,
        questions: currentForm.questions,
        updated_at: new Date().toISOString(),
      };

      if (editing) {
        const { error } = await supabase
          .from('intake_forms')
          .update(formData)
          .eq('id', editing);

        if (error) throw error;
        toast.success('Formulaire mis à jour');
      } else {
        const { error } = await supabase
          .from('intake_forms')
          .insert([formData]);

        if (error) throw error;
        toast.success('Formulaire créé');
      }

      setCurrentForm({
        title: '',
        description: '',
        form_type: 'general',
        questions: [],
        active: true,
        required_for_booking: false,
        send_before_hours: 48,
      });
      setEditing(null);
      loadForms();
    } catch (error: any) {
      console.error('Error saving form:', error);
      toast.error('Erreur lors de la sauvegarde');
    } finally {
      setLoading(false);
    }
  }

  function editForm(form: IntakeForm) {
    setCurrentForm(form);
    setEditing(form.id);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  async function deleteForm(id: string) {
    if (!confirm('Êtes-vous sûr de vouloir supprimer ce formulaire?')) return;

    try {
      const { error } = await supabase
        .from('intake_forms')
        .delete()
        .eq('id', id);

      if (error) throw error;
      toast.success('Formulaire supprimé');
      loadForms();
    } catch (error: any) {
      console.error('Error deleting form:', error);
      toast.error('Erreur lors de la suppression');
    }
  }

  async function toggleActive(id: string, active: boolean) {
    try {
      const { error } = await supabase
        .from('intake_forms')
        .update({ active: !active })
        .eq('id', id);

      if (error) throw error;
      toast.success(active ? 'Formulaire désactivé' : 'Formulaire activé');
      loadForms();
    } catch (error: any) {
      console.error('Error toggling form:', error);
      toast.error('Erreur lors de la modification');
    }
  }

  const questionTypes = [
    { value: 'text', label: 'Texte court' },
    { value: 'textarea', label: 'Texte long' },
    { value: 'select', label: 'Liste déroulante' },
    { value: 'radio', label: 'Choix unique' },
    { value: 'checkbox', label: 'Cases à cocher' },
    { value: 'date', label: 'Date' },
    { value: 'number', label: 'Nombre' },
  ];

  return (
    <div className="space-y-6">
      <div className="bg-white border border-slate-200 rounded-lg shadow-sm">
        <div className="p-6 border-b border-slate-200">
          <h2 className="text-xl font-semibold text-slate-900 flex items-center gap-2">
            <FileText className="w-6 h-6 text-amber-600" />
            {editing ? 'Modifier le formulaire' : 'Nouveau formulaire d\'admission'}
          </h2>
        </div>

        <div className="p-6 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Titre du formulaire *
              </label>
              <input
                type="text"
                value={currentForm.title || ''}
                onChange={(e) => setCurrentForm({ ...currentForm, title: e.target.value })}
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-amber-600 focus:border-transparent"
                placeholder="Ex: Formulaire d'admission initial"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Type de formulaire
              </label>
              <select
                value={currentForm.form_type || 'general'}
                onChange={(e) => setCurrentForm({ ...currentForm, form_type: e.target.value })}
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-amber-600 focus:border-transparent"
              >
                <option value="general">Général</option>
                <option value="initial">Initial</option>
                <option value="followup">Suivi</option>
                <option value="consent">Consentement</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Description
            </label>
            <textarea
              value={currentForm.description || ''}
              onChange={(e) => setCurrentForm({ ...currentForm, description: e.target.value })}
              rows={2}
              className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-amber-600 focus:border-transparent"
              placeholder="Décrivez l'objectif de ce formulaire..."
            />
          </div>

          <div className="flex items-center gap-6">
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={currentForm.required_for_booking || false}
                onChange={(e) =>
                  setCurrentForm({ ...currentForm, required_for_booking: e.target.checked })
                }
                className="w-4 h-4 text-amber-600 border-slate-300 rounded focus:ring-amber-600"
              />
              <span className="text-sm text-slate-700">Obligatoire pour réservation en ligne</span>
            </label>

            <div className="flex items-center gap-2">
              <label className="text-sm text-slate-700">Envoyer</label>
              <input
                type="number"
                value={currentForm.send_before_hours || 48}
                onChange={(e) =>
                  setCurrentForm({ ...currentForm, send_before_hours: parseInt(e.target.value) })
                }
                className="w-20 px-3 py-1 border border-slate-300 rounded-lg focus:ring-2 focus:ring-amber-600"
                min="1"
              />
              <label className="text-sm text-slate-700">heures avant le RDV</label>
            </div>
          </div>

          <div className="border-t border-slate-200 pt-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-slate-900">Questions</h3>
              <button
                onClick={addQuestion}
                className="flex items-center gap-2 px-4 py-2 bg-amber-600 text-white rounded-lg hover:bg-amber-700 text-sm font-medium"
              >
                <Plus className="w-4 h-4" />
                Ajouter une question
              </button>
            </div>

            <div className="space-y-4">
              {(currentForm.questions || []).map((question, index) => (
                <div key={question.id} className="border border-slate-200 rounded-lg p-4 bg-slate-50">
                  <div className="flex items-start justify-between mb-3">
                    <span className="text-sm font-medium text-slate-500">Question {index + 1}</span>
                    <button
                      onClick={() => removeQuestion(question.id)}
                      className="text-red-600 hover:text-red-700"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-2">
                        Type de question
                      </label>
                      <select
                        value={question.type}
                        onChange={(e) =>
                          updateQuestion(question.id, {
                            type: e.target.value as Question['type'],
                          })
                        }
                        className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-amber-600 text-sm"
                      >
                        {questionTypes.map((type) => (
                          <option key={type.value} value={type.value}>
                            {type.label}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="flex items-center">
                      <label className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          checked={question.required}
                          onChange={(e) =>
                            updateQuestion(question.id, { required: e.target.checked })
                          }
                          className="w-4 h-4 text-amber-600 border-slate-300 rounded focus:ring-amber-600"
                        />
                        <span className="text-sm text-slate-700">Obligatoire</span>
                      </label>
                    </div>
                  </div>

                  <div className="mt-3">
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      Question
                    </label>
                    <input
                      type="text"
                      value={question.label}
                      onChange={(e) => updateQuestion(question.id, { label: e.target.value })}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-amber-600 text-sm"
                      placeholder="Entrez votre question..."
                    />
                  </div>

                  {(question.type === 'select' ||
                    question.type === 'radio' ||
                    question.type === 'checkbox') && (
                    <div className="mt-3">
                      <label className="block text-sm font-medium text-slate-700 mb-2">
                        Options (une par ligne)
                      </label>
                      <textarea
                        value={(question.options || []).join('\n')}
                        onChange={(e) =>
                          updateQuestion(question.id, {
                            options: e.target.value.split('\n').filter((o) => o.trim()),
                          })
                        }
                        rows={3}
                        className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-amber-600 text-sm"
                        placeholder="Option 1&#10;Option 2&#10;Option 3"
                      />
                    </div>
                  )}
                </div>
              ))}

              {(!currentForm.questions || currentForm.questions.length === 0) && (
                <div className="text-center py-8 text-slate-500">
                  Aucune question. Cliquez sur "Ajouter une question" pour commencer.
                </div>
              )}
            </div>
          </div>

          <div className="flex gap-3 pt-6 border-t border-slate-200">
            <button
              onClick={saveForm}
              disabled={loading}
              className="flex items-center gap-2 px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 font-semibold disabled:opacity-50"
            >
              <Save className="w-5 h-5" />
              {editing ? 'Mettre à jour' : 'Créer le formulaire'}
            </button>

            {editing && (
              <button
                onClick={() => {
                  setCurrentForm({
                    title: '',
                    description: '',
                    form_type: 'general',
                    questions: [],
                    active: true,
                    required_for_booking: false,
                    send_before_hours: 48,
                  });
                  setEditing(null);
                }}
                className="px-6 py-3 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50"
              >
                Annuler
              </button>
            )}
          </div>
        </div>
      </div>

      <div className="bg-white border border-slate-200 rounded-lg shadow-sm">
        <div className="p-6 border-b border-slate-200">
          <h2 className="text-xl font-semibold text-slate-900">Formulaires existants</h2>
        </div>

        <div className="divide-y divide-slate-200">
          {loading && forms.length === 0 ? (
            <div className="p-12 text-center text-slate-500">Chargement...</div>
          ) : forms.length === 0 ? (
            <div className="p-12 text-center text-slate-500">
              Aucun formulaire créé. Créez-en un ci-dessus!
            </div>
          ) : (
            forms.map((form) => (
              <div key={form.id} className="p-6">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-lg font-semibold text-slate-900">{form.title}</h3>
                      <span
                        className={`px-3 py-1 rounded-full text-xs font-medium ${
                          form.active
                            ? 'bg-green-100 text-green-700'
                            : 'bg-slate-100 text-slate-600'
                        }`}
                      >
                        {form.active ? 'Actif' : 'Inactif'}
                      </span>
                      {form.required_for_booking && (
                        <span className="px-3 py-1 rounded-full text-xs font-medium bg-amber-100 text-amber-700">
                          Obligatoire
                        </span>
                      )}
                    </div>

                    {form.description && (
                      <p className="text-sm text-slate-600 mb-2">{form.description}</p>
                    )}

                    <p className="text-xs text-slate-500">
                      {form.questions.length} question{form.questions.length > 1 ? 's' : ''} •
                      Envoyé {form.send_before_hours}h avant le RDV
                    </p>

                    {expandedForm === form.id && (
                      <div className="mt-4 space-y-2 p-4 bg-slate-50 rounded-lg">
                        {form.questions.map((q, i) => (
                          <div key={q.id} className="text-sm">
                            <span className="font-medium text-slate-700">
                              {i + 1}. {q.label}
                            </span>
                            <span className="text-slate-500 ml-2">
                              ({questionTypes.find((t) => t.value === q.type)?.label})
                              {q.required && ' - Obligatoire'}
                            </span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  <div className="flex items-center gap-2 ml-4">
                    <button
                      onClick={() =>
                        setExpandedForm(expandedForm === form.id ? null : form.id)
                      }
                      className="p-2 text-slate-600 hover:text-slate-900"
                      title="Voir les questions"
                    >
                      {expandedForm === form.id ? (
                        <ChevronUp className="w-5 h-5" />
                      ) : (
                        <ChevronDown className="w-5 h-5" />
                      )}
                    </button>
                    <button
                      onClick={() => toggleActive(form.id, form.active)}
                      className={`px-3 py-2 rounded-lg text-sm font-medium ${
                        form.active
                          ? 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                          : 'bg-green-100 text-green-700 hover:bg-green-200'
                      }`}
                    >
                      {form.active ? 'Désactiver' : 'Activer'}
                    </button>
                    <button
                      onClick={() => editForm(form)}
                      className="px-3 py-2 bg-amber-100 text-amber-700 rounded-lg hover:bg-amber-200 text-sm font-medium"
                    >
                      Modifier
                    </button>
                    <button
                      onClick={() => deleteForm(form.id)}
                      className="p-2 text-red-600 hover:text-red-700"
                    >
                      <Trash2 className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
