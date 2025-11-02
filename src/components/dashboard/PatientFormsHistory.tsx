import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { FileText, Bone, Activity, Brain, Video, Calendar, Eye, Download } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useToastContext } from '../../contexts/ToastContext';

interface FormRecord {
  id: string;
  type: 'anamnese' | 'atm' | 'spinal' | 'neurological' | 'teleconsult';
  exam_date: string;
  completed: boolean;
  data: any;
}

interface PatientFormsHistoryProps {
  contactId: string;
}

export function PatientFormsHistory({ contactId }: PatientFormsHistoryProps) {
  const toast = useToastContext();
  const [forms, setForms] = useState<FormRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedForm, setSelectedForm] = useState<FormRecord | null>(null);

  useEffect(() => {
    loadForms();
  }, [contactId]);

  const loadForms = async () => {
    setLoading(true);
    try {
      const allForms: FormRecord[] = [];

      const { data: anamneseData } = await supabase
        .from('anamnese_forms')
        .select('*')
        .eq('contact_id', contactId)
        .order('created_at', { ascending: false });

      const { data: atmData } = await supabase
        .from('atm_exams')
        .select('*')
        .eq('contact_id', contactId)
        .order('exam_date', { ascending: false });

      const { data: spinalData } = await supabase
        .from('spinal_exams')
        .select('*')
        .eq('contact_id', contactId)
        .order('exam_date', { ascending: false });

      const { data: neuroData } = await supabase
        .from('neurological_exams')
        .select('*')
        .eq('contact_id', contactId)
        .order('exam_date', { ascending: false });

      const { data: teleData } = await supabase
        .from('teleconsultation_consents')
        .select('*')
        .eq('contact_id', contactId)
        .order('consent_date', { ascending: false });

      if (anamneseData) {
        anamneseData.forEach(form => allForms.push({
          id: form.id,
          type: 'anamnese',
          exam_date: form.created_at,
          completed: form.completed,
          data: form
        }));
      }

      if (atmData) {
        atmData.forEach(form => allForms.push({
          id: form.id,
          type: 'atm',
          exam_date: form.exam_date,
          completed: form.completed,
          data: form
        }));
      }

      if (spinalData) {
        spinalData.forEach(form => allForms.push({
          id: form.id,
          type: 'spinal',
          exam_date: form.exam_date,
          completed: form.completed,
          data: form
        }));
      }

      if (neuroData) {
        neuroData.forEach(form => allForms.push({
          id: form.id,
          type: 'neurological',
          exam_date: form.exam_date,
          completed: form.completed,
          data: form
        }));
      }

      if (teleData) {
        teleData.forEach(form => allForms.push({
          id: form.id,
          type: 'teleconsult',
          exam_date: form.consent_date,
          completed: form.is_valid,
          data: form
        }));
      }

      allForms.sort((a, b) => new Date(b.exam_date).getTime() - new Date(a.exam_date).getTime());
      setForms(allForms);
    } catch (error: any) {
      toast.error('Erreur de chargement: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const getFormIcon = (type: string) => {
    switch (type) {
      case 'anamnese': return FileText;
      case 'atm': return Bone;
      case 'spinal': return Activity;
      case 'neurological': return Brain;
      case 'teleconsult': return Video;
      default: return FileText;
    }
  };

  const getFormLabel = (type: string) => {
    switch (type) {
      case 'anamnese': return 'Anamnèse';
      case 'atm': return 'Examen ATM';
      case 'spinal': return 'Examen Colonne';
      case 'neurological': return 'Examen Neurologique';
      case 'teleconsult': return 'Consentement Télécons';
      default: return 'Formulaire';
    }
  };

  const getFormColor = (type: string) => {
    switch (type) {
      case 'anamnese': return 'bg-blue-50 border-blue-200 text-blue-900';
      case 'atm': return 'bg-green-50 border-green-200 text-green-900';
      case 'spinal': return 'bg-orange-50 border-orange-200 text-orange-900';
      case 'neurological': return 'bg-purple-50 border-purple-200 text-purple-900';
      case 'teleconsult': return 'bg-red-50 border-red-200 text-red-900';
      default: return 'bg-neutral-50 border-neutral-200 text-neutral-900';
    }
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('fr-CA', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const renderFormDetails = (form: FormRecord) => {
    const Icon = getFormIcon(form.type);

    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
        onClick={() => setSelectedForm(null)}
      >
        <div
          className="bg-white rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto"
          onClick={(e) => e.stopPropagation()}
        >
          <div className={`p-6 border-b-2 ${getFormColor(form.type)} flex items-center justify-between`}>
            <div className="flex items-center gap-3">
              <Icon className="w-6 h-6" />
              <div>
                <h3 className="text-xl font-bold">{getFormLabel(form.type)}</h3>
                <p className="text-sm opacity-75">{formatDate(form.exam_date)}</p>
              </div>
            </div>
            <button
              onClick={() => setSelectedForm(null)}
              className="p-2 hover:bg-white/50 rounded-lg transition"
            >
              ✕
            </button>
          </div>

          <div className="p-6 space-y-4">
            <pre className="bg-neutral-50 p-4 rounded-lg overflow-x-auto text-sm">
              {JSON.stringify(form.data, null, 2)}
            </pre>
          </div>

          <div className="p-6 border-t border-neutral-200 flex gap-3">
            <button
              onClick={() => {
                toast.info('Fonction d\'export à venir');
              }}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              <Download className="w-4 h-4" />
              Exporter PDF
            </button>
            <button
              onClick={() => setSelectedForm(null)}
              className="flex-1 px-4 py-2 border-2 border-neutral-200 rounded-lg hover:bg-neutral-50"
            >
              Fermer
            </button>
          </div>
        </div>
      </motion.div>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (forms.length === 0) {
    return (
      <div className="text-center py-12 text-neutral-500">
        <FileText className="w-12 h-12 mx-auto mb-3 opacity-50" />
        <p className="font-medium">Aucun formulaire rempli</p>
        <p className="text-sm mt-1">Les formulaires complétés apparaîtront ici</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-bold flex items-center gap-2">
          <FileText className="w-5 h-5 text-blue-600" />
          Formulaires Professionnels ({forms.length})
        </h3>
      </div>

      {forms.map((form) => {
        const Icon = getFormIcon(form.type);
        return (
          <motion.div
            key={form.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className={`p-4 rounded-xl border-2 ${getFormColor(form.type)} hover:shadow-md transition-all cursor-pointer`}
            onClick={() => setSelectedForm(form)}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Icon className="w-5 h-5" />
                <div>
                  <p className="font-semibold">{getFormLabel(form.type)}</p>
                  <div className="flex items-center gap-2 text-xs opacity-75">
                    <Calendar className="w-3 h-3" />
                    {formatDate(form.exam_date)}
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {form.completed && (
                  <span className="px-2 py-1 bg-green-500 text-white text-xs rounded-full">
                    ✓ Complété
                  </span>
                )}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setSelectedForm(form);
                  }}
                  className="p-2 hover:bg-white/50 rounded-lg transition"
                >
                  <Eye className="w-4 h-4" />
                </button>
              </div>
            </div>
          </motion.div>
        );
      })}

      {selectedForm && renderFormDetails(selectedForm)}
    </div>
  );
}
