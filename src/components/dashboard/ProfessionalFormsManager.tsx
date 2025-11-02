import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { FileText, Brain, Bone, Stethoscope, Video, Plus, Search, Filter, Calendar } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useToastContext } from '../../contexts/ToastContext';
import { AnamneseForm } from '../forms/AnamneseForm';
import { ATMExamForm } from '../forms/ATMExamForm';
import { SpinalExamForm } from '../forms/SpinalExamForm';
import { NeurologicalExamForm } from '../forms/NeurologicalExamForm';
import { TeleconsultationConsentForm } from '../forms/TeleconsultationConsentForm';

interface Contact {
  id: string;
  full_name: string;
  email: string;
}

interface FormRecord {
  id: string;
  form_type: string;
  contact_id: string;
  form_date: string;
  completed: boolean;
  contact: Contact;
}

const FORM_TYPES = [
  {
    id: 'anamnese',
    name: 'Anamnèse',
    description: 'Historique complet du patient',
    icon: <FileText className="w-6 h-6" />,
    color: 'blue',
    gradient: 'from-blue-500 to-indigo-600',
    estimatedTime: '8-12 min'
  },
  {
    id: 'spinal',
    name: 'Examen Colonne',
    description: 'Examen physique cervical, thoracique, lombaire',
    icon: <Bone className="w-6 h-6" />,
    color: 'green',
    gradient: 'from-green-500 to-emerald-600',
    estimatedTime: '5-8 min'
  },
  {
    id: 'neurological',
    name: 'Examen Neurologique',
    description: 'Évaluation neurologique détaillée',
    icon: <Brain className="w-6 h-6" />,
    color: 'purple',
    gradient: 'from-purple-500 to-indigo-600',
    estimatedTime: '6-10 min'
  },
  {
    id: 'atm',
    name: 'Examen ATM',
    description: 'Articulation temporo-mandibulaire',
    icon: <Stethoscope className="w-6 h-6" />,
    color: 'amber',
    gradient: 'from-amber-500 to-orange-600',
    estimatedTime: '3-5 min'
  },
  {
    id: 'teleconsultation',
    name: 'Consentement Télécons.',
    description: 'Consentement téléconsultation',
    icon: <Video className="w-6 h-6" />,
    color: 'red',
    gradient: 'from-red-500 to-pink-600',
    estimatedTime: '2 min'
  }
];

export function ProfessionalFormsManager() {
  const toast = useToastContext();
  const [view, setView] = useState<'list' | 'new-form'>('list');
  const [selectedFormType, setSelectedFormType] = useState<string | null>(null);
  const [selectedContactId, setSelectedContactId] = useState<string | null>(null);
  const [forms, setForms] = useState<FormRecord[]>([]);
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<string>('all');

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    try {
      const { data: user } = await supabase.auth.getUser();
      if (!user.user) return;

      const [contactsRes, formsRes] = await Promise.all([
        supabase
          .from('contacts')
          .select('id, full_name, email')
          .eq('owner_id', user.user.id)
          .eq('status', 'active')
          .order('full_name'),

        supabase
          .from('anamnese_forms')
          .select(`
            id,
            contact_id,
            form_date,
            completed,
            contacts (
              id,
              full_name,
              email
            )
          `)
          .eq('owner_id', user.user.id)
          .order('form_date', { ascending: false })
          .limit(50)
      ]);

      if (contactsRes.data) setContacts(contactsRes.data);

      if (formsRes.data) {
        const formattedForms = formsRes.data.map(f => ({
          ...f,
          form_type: 'anamnese',
          contact: f.contacts as unknown as Contact
        }));
        setForms(formattedForms);
      }
    } catch (error) {
      console.error('Error loading data:', error);
      toast.error('Erreur lors du chargement des données');
    } finally {
      setLoading(false);
    }
  }

  function handleNewForm(formType: string, contactId: string) {
    setSelectedFormType(formType);
    setSelectedContactId(contactId);
    setView('new-form');
  }

  function handleFormSaved() {
    setView('list');
    setSelectedFormType(null);
    setSelectedContactId(null);
    loadData();
  }

  function handleCancel() {
    setView('list');
    setSelectedFormType(null);
    setSelectedContactId(null);
  }

  const filteredForms = forms.filter(form => {
    const matchesSearch =
      form.contact?.full_name?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesFilter = filterType === 'all' || form.form_type === filterType;
    return matchesSearch && matchesFilter;
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="animate-spin w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full" />
      </div>
    );
  }

  if (view === 'new-form' && selectedFormType && selectedContactId) {
    if (selectedFormType === 'anamnese') {
      return (
        <AnamneseForm
          contactId={selectedContactId}
          onSave={handleFormSaved}
          onCancel={handleCancel}
        />
      );
    }

    if (selectedFormType === 'atm') {
      return (
        <ATMExamForm
          contactId={selectedContactId}
          onSave={handleFormSaved}
          onClose={handleCancel}
        />
      );
    }

    if (selectedFormType === 'spinal') {
      return (
        <SpinalExamForm
          contactId={selectedContactId}
          onSave={handleFormSaved}
          onClose={handleCancel}
        />
      );
    }

    if (selectedFormType === 'neurological') {
      return (
        <NeurologicalExamForm
          contactId={selectedContactId}
          onSave={handleFormSaved}
          onClose={handleCancel}
        />
      );
    }

    if (selectedFormType === 'teleconsultation') {
      return (
        <TeleconsultationConsentForm
          contactId={selectedContactId}
          onSave={handleFormSaved}
          onClose={handleCancel}
        />
      );
    }
    return (
      <div className="text-center py-20">
        <p className="text-neutral-500">Formulaire en développement...</p>
        <button
          onClick={handleCancel}
          className="mt-4 px-6 py-2 bg-neutral-200 rounded-lg hover:bg-neutral-300"
        >
          Retour
        </button>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-neutral-900 mb-2">
          Formulaires Professionnels
        </h1>
        <p className="text-neutral-600">
          Gestion complète des formulaires OCQ - Remplissage intelligent
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4 mb-8">
        {FORM_TYPES.map((formType) => (
          <motion.div
            key={formType.id}
            whileHover={{ y: -4 }}
            className={`relative p-6 bg-gradient-to-br ${formType.gradient} rounded-2xl shadow-lg text-white cursor-pointer group overflow-hidden`}
            onClick={() => {
              const modal = document.getElementById('select-patient-modal');
              if (modal) {
                (modal as any).formType = formType.id;
                modal.classList.remove('hidden');
              }
            }}
          >
            <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16" />

            <div className="relative">
              <div className="mb-4">{formType.icon}</div>
              <h3 className="font-bold text-lg mb-1">{formType.name}</h3>
              <p className="text-white/80 text-sm mb-3">{formType.description}</p>
              <div className="flex items-center gap-2 text-xs text-white/70">
                <Calendar className="w-3 h-3" />
                <span>{formType.estimatedTime}</span>
              </div>
            </div>

            <div className="absolute bottom-3 right-3 w-10 h-10 bg-white/20 rounded-full flex items-center justify-center group-hover:bg-white/30 transition-all">
              <Plus className="w-5 h-5" />
            </div>
          </motion.div>
        ))}
      </div>

      <div className="bg-white rounded-2xl shadow-sm border-2 border-neutral-200">
        <div className="p-6 border-b-2 border-neutral-200">
          <div className="flex items-center gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-neutral-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Rechercher un patient..."
                className="w-full pl-10 pr-4 py-2.5 border-2 border-neutral-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              className="px-4 py-2.5 border-2 border-neutral-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">Tous les formulaires</option>
              {FORM_TYPES.map(ft => (
                <option key={ft.id} value={ft.id}>{ft.name}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-neutral-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-semibold text-neutral-600 uppercase">
                  Patient
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-neutral-600 uppercase">
                  Type Formulaire
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-neutral-600 uppercase">
                  Date
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-neutral-600 uppercase">
                  Statut
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-neutral-600 uppercase">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-200">
              {filteredForms.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-neutral-500">
                    Aucun formulaire trouvé. Créez-en un nouveau ci-dessus!
                  </td>
                </tr>
              ) : (
                filteredForms.map((form) => (
                  <tr key={form.id} className="hover:bg-neutral-50 transition-colors">
                    <td className="px-6 py-4">
                      <div>
                        <div className="font-medium text-neutral-900">
                          {form.contact?.full_name}
                        </div>
                        <div className="text-sm text-neutral-500">{form.contact?.email}</div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm font-medium">
                        {FORM_TYPES.find(ft => ft.id === form.form_type)?.name || 'Anamnèse'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-neutral-600">
                      {new Date(form.form_date).toLocaleDateString('fr-CA')}
                    </td>
                    <td className="px-6 py-4">
                      {form.completed ? (
                        <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-sm font-medium">
                          ✓ Complété
                        </span>
                      ) : (
                        <span className="px-3 py-1 bg-amber-100 text-amber-700 rounded-full text-sm font-medium">
                          Brouillon
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <button className="text-blue-600 hover:text-blue-700 font-medium text-sm">
                        Voir/Modifier
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <div id="select-patient-modal" className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[200] hidden flex items-center justify-center p-6">
        <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[80vh] overflow-hidden">
          <div className="p-6 border-b-2 border-neutral-200">
            <h2 className="text-2xl font-bold">Sélectionner un Patient</h2>
            <p className="text-neutral-600 mt-1">Choisissez le patient pour ce formulaire</p>
          </div>

          <div className="p-6 max-h-96 overflow-y-auto">
            <div className="space-y-2">
              {contacts.map(contact => (
                <button
                  key={contact.id}
                  onClick={() => {
                    const modal = document.getElementById('select-patient-modal');
                    const formType = (modal as any)?.formType || 'anamnese';
                    handleNewForm(formType, contact.id);
                    modal?.classList.add('hidden');
                  }}
                  className="w-full p-4 border-2 border-neutral-200 rounded-xl hover:border-blue-500 hover:bg-blue-50 transition-all text-left"
                >
                  <div className="font-medium text-neutral-900">
                    {contact.full_name}
                  </div>
                  <div className="text-sm text-neutral-500">{contact.email}</div>
                </button>
              ))}
            </div>
          </div>

          <div className="p-6 border-t-2 border-neutral-200 flex justify-end">
            <button
              onClick={() => {
                document.getElementById('select-patient-modal')?.classList.add('hidden');
              }}
              className="px-6 py-2 bg-neutral-200 rounded-lg hover:bg-neutral-300"
            >
              Annuler
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
