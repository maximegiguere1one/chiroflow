import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  FileText, Bone, Activity, Brain, Video, Calendar, Eye, Download,
  Filter, Search, TrendingUp, Clock, CheckCircle, XCircle,
  Printer, Share2, BarChart3, GitCompare, X, ChevronDown, ChevronUp,
  AlertCircle, Award, Target
} from 'lucide-react';
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

type ViewMode = 'list' | 'timeline' | 'compare';
type FilterType = 'all' | 'anamnese' | 'atm' | 'spinal' | 'neurological' | 'teleconsult';

export function PatientFormsHistory({ contactId }: PatientFormsHistoryProps) {
  const toast = useToastContext();
  const [forms, setForms] = useState<FormRecord[]>([]);
  const [filteredForms, setFilteredForms] = useState<FormRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedForm, setSelectedForm] = useState<FormRecord | null>(null);
  const [viewMode, setViewMode] = useState<ViewMode>('list');
  const [filterType, setFilterType] = useState<FilterType>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [compareMode, setCompareMode] = useState(false);
  const [selectedForCompare, setSelectedForCompare] = useState<FormRecord[]>([]);

  useEffect(() => {
    loadForms();
  }, [contactId]);

  useEffect(() => {
    applyFilters();
  }, [forms, filterType, searchQuery]);

  const loadForms = async () => {
    setLoading(true);
    try {
      const allForms: FormRecord[] = [];

      const tables = [
        { name: 'anamnese_forms', type: 'anamnese' as const, dateField: 'created_at' },
        { name: 'atm_exams', type: 'atm' as const, dateField: 'exam_date' },
        { name: 'spinal_exams', type: 'spinal' as const, dateField: 'exam_date' },
        { name: 'neurological_exams', type: 'neurological' as const, dateField: 'exam_date' },
        { name: 'teleconsultation_consents', type: 'teleconsult' as const, dateField: 'consent_date' }
      ];

      await Promise.all(tables.map(async (table) => {
        const { data } = await supabase
          .from(table.name)
          .select('*')
          .eq('contact_id', contactId)
          .order(table.dateField, { ascending: false });

        if (data) {
          data.forEach(form => allForms.push({
            id: form.id,
            type: table.type,
            exam_date: form[table.dateField],
            completed: table.type === 'teleconsult' ? form.is_valid : form.completed,
            data: form
          }));
        }
      }));

      allForms.sort((a, b) => new Date(b.exam_date).getTime() - new Date(a.exam_date).getTime());
      setForms(allForms);
    } catch (error: any) {
      toast.error('Erreur de chargement: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const applyFilters = () => {
    let filtered = forms;

    if (filterType !== 'all') {
      filtered = filtered.filter(f => f.type === filterType);
    }

    if (searchQuery) {
      filtered = filtered.filter(f =>
        getFormLabel(f.type).toLowerCase().includes(searchQuery.toLowerCase()) ||
        formatDate(f.exam_date).toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    setFilteredForms(filtered);
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
      case 'anamnese': return { bg: 'bg-blue-50', border: 'border-blue-200', text: 'text-blue-900', accent: 'bg-blue-500' };
      case 'atm': return { bg: 'bg-green-50', border: 'border-green-200', text: 'text-green-900', accent: 'bg-green-500' };
      case 'spinal': return { bg: 'bg-orange-50', border: 'border-orange-200', text: 'text-orange-900', accent: 'bg-orange-500' };
      case 'neurological': return { bg: 'bg-purple-50', border: 'border-purple-200', text: 'text-purple-900', accent: 'bg-purple-500' };
      case 'teleconsult': return { bg: 'bg-red-50', border: 'border-red-200', text: 'text-red-900', accent: 'bg-red-500' };
      default: return { bg: 'bg-neutral-50', border: 'border-neutral-200', text: 'text-neutral-900', accent: 'bg-neutral-500' };
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

  const formatShortDate = (date: string) => {
    return new Date(date).toLocaleDateString('fr-CA', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    });
  };

  const getFormStats = () => {
    const stats = {
      total: forms.length,
      completed: forms.filter(f => f.completed).length,
      byType: {} as Record<string, number>,
      lastExam: forms[0]?.exam_date || null
    };

    forms.forEach(f => {
      stats.byType[f.type] = (stats.byType[f.type] || 0) + 1;
    });

    return stats;
  };

  const renderFormattedData = (form: FormRecord) => {
    const data = form.data;
    const sections: { title: string; items: { label: string; value: any }[] }[] = [];

    if (form.type === 'spinal') {
      sections.push({
        title: 'Signes Vitaux',
        items: [
          { label: 'Pression artérielle (gauche)', value: `${data.bp_left_systolic || '-'}/${data.bp_left_diastolic || '-'} mmHg` },
          { label: 'Pouls (gauche)', value: data.pulse_left ? `${data.pulse_left} bpm` : '-' },
          { label: 'Température', value: data.temperature_celsius ? `${data.temperature_celsius}°C` : '-' },
          { label: 'Poids', value: data.weight_kg ? `${data.weight_kg} kg` : '-' },
          { label: 'Taille', value: data.height_cm ? `${data.height_cm} cm` : '-' }
        ]
      });

      sections.push({
        title: 'Observations',
        items: [
          { label: 'Signe de Rust', value: data.rust_sign ? '✓ Présent' : '✗ Absent' },
          { label: 'Signe de Bakody', value: data.bakody_sign ? '✓ Présent' : '✗ Absent' },
          { label: 'Notes posture', value: data.posture_notes || '-' }
        ]
      });

      sections.push({
        title: 'Amplitudes Cervicales',
        items: [
          { label: 'Flexion active', value: data.cervical_flexion_active ? `${data.cervical_flexion_active}°` : '-' },
          { label: 'Extension active', value: data.cervical_extension_active ? `${data.cervical_extension_active}°` : '-' },
          { label: 'Rotation D active', value: data.cervical_rotation_right_active ? `${data.cervical_rotation_right_active}°` : '-' },
          { label: 'Rotation G active', value: data.cervical_rotation_left_active ? `${data.cervical_rotation_left_active}°` : '-' }
        ]
      });
    }

    if (form.type === 'atm') {
      sections.push({
        title: 'Examen ATM',
        items: [
          { label: 'Ouverture maximale', value: data.max_opening_mm ? `${data.max_opening_mm} mm` : '-' },
          { label: 'Déviation', value: data.deviation_on_opening || '-' },
          { label: 'Clics/Craquements', value: data.clicks_or_crepitus ? '✓ Présents' : '✗ Absents' },
          { label: 'Douleur palpation', value: data.pain_on_palpation ? '✓ Présente' : '✗ Absente' }
        ]
      });
    }

    if (form.type === 'neurological') {
      sections.push({
        title: 'Examen Neurologique',
        items: [
          { label: 'Réflexes normaux', value: data.reflexes_normal ? '✓ Normal' : '✗ Anormal' },
          { label: 'Force musculaire', value: data.muscle_strength || '-' },
          { label: 'Sensibilité', value: data.sensory_intact ? '✓ Intacte' : '✗ Altérée' }
        ]
      });
    }

    if (sections.length === 0) {
      sections.push({
        title: 'Données',
        items: Object.entries(data)
          .filter(([key]) => !['id', 'contact_id', 'owner_id', 'created_at', 'updated_at'].includes(key))
          .slice(0, 10)
          .map(([key, value]) => ({
            label: key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
            value: typeof value === 'boolean' ? (value ? '✓ Oui' : '✗ Non') : String(value || '-')
          }))
      });
    }

    return sections;
  };

  const renderFormDetails = (form: FormRecord) => {
    const Icon = getFormIcon(form.type);
    const colors = getFormColor(form.type);
    const sections = renderFormattedData(form);

    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
        onClick={() => setSelectedForm(null)}
      >
        <div
          className="bg-white rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto shadow-2xl"
          onClick={(e) => e.stopPropagation()}
        >
          <div className={`p-6 border-b-2 ${colors.bg} ${colors.border} flex items-center justify-between sticky top-0 z-10`}>
            <div className="flex items-center gap-3">
              <div className={`p-3 ${colors.accent} rounded-xl`}>
                <Icon className="w-6 h-6 text-white" />
              </div>
              <div>
                <h3 className={`text-xl font-bold ${colors.text}`}>{getFormLabel(form.type)}</h3>
                <div className="flex items-center gap-3 mt-1">
                  <p className="text-sm opacity-75 flex items-center gap-1">
                    <Calendar className="w-3 h-3" />
                    {formatDate(form.exam_date)}
                  </p>
                  {form.completed && (
                    <span className="px-2 py-0.5 bg-green-500 text-white text-xs rounded-full flex items-center gap-1">
                      <CheckCircle className="w-3 h-3" />
                      Complété
                    </span>
                  )}
                </div>
              </div>
            </div>
            <button
              onClick={() => setSelectedForm(null)}
              className="p-2 hover:bg-white/50 rounded-lg transition"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="p-6 space-y-6">
            {sections.map((section, idx) => (
              <div key={idx} className="space-y-3">
                <h4 className="font-bold text-lg text-neutral-800 flex items-center gap-2">
                  <div className={`w-1 h-6 ${colors.accent} rounded-full`}></div>
                  {section.title}
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {section.items.map((item, itemIdx) => (
                    <div key={itemIdx} className="bg-neutral-50 rounded-lg p-3 border border-neutral-200">
                      <div className="text-xs text-neutral-600 mb-1">{item.label}</div>
                      <div className="font-semibold text-neutral-900">{item.value}</div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>

          <div className="p-6 border-t border-neutral-200 flex gap-3 sticky bottom-0 bg-white">
            <button
              onClick={() => {
                window.print();
                toast.success('Impression lancée');
              }}
              className="flex items-center gap-2 px-4 py-2 bg-neutral-600 text-white rounded-lg hover:bg-neutral-700 transition"
            >
              <Printer className="w-4 h-4" />
              Imprimer
            </button>
            <button
              onClick={() => {
                toast.info('Export PDF à venir');
              }}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
            >
              <Download className="w-4 h-4" />
              Exporter PDF
            </button>
            <button
              onClick={() => setSelectedForm(null)}
              className="flex-1 px-4 py-2 border-2 border-neutral-200 rounded-lg hover:bg-neutral-50 transition font-medium"
            >
              Fermer
            </button>
          </div>
        </div>
      </motion.div>
    );
  };

  const renderTimelineView = () => {
    const groupedByMonth: Record<string, FormRecord[]> = {};

    filteredForms.forEach(form => {
      const monthKey = new Date(form.exam_date).toLocaleDateString('fr-CA', { year: 'numeric', month: 'long' });
      if (!groupedByMonth[monthKey]) groupedByMonth[monthKey] = [];
      groupedByMonth[monthKey].push(form);
    });

    return (
      <div className="space-y-8">
        {Object.entries(groupedByMonth).map(([month, monthForms]) => (
          <div key={month} className="relative">
            <div className="sticky top-0 bg-gradient-to-r from-blue-500 to-blue-600 text-white px-4 py-2 rounded-lg mb-4 shadow-md z-10">
              <h4 className="font-bold flex items-center gap-2">
                <Calendar className="w-4 h-4" />
                {month} ({monthForms.length})
              </h4>
            </div>
            <div className="space-y-3 pl-6 border-l-2 border-neutral-200">
              {monthForms.map((form) => {
                const Icon = getFormIcon(form.type);
                const colors = getFormColor(form.type);
                return (
                  <motion.div
                    key={form.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    className={`relative p-4 rounded-xl border-2 ${colors.bg} ${colors.border} hover:shadow-md transition-all cursor-pointer`}
                    onClick={() => setSelectedForm(form)}
                  >
                    <div className={`absolute -left-[29px] top-4 w-4 h-4 ${colors.accent} rounded-full border-4 border-white`}></div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <Icon className={`w-5 h-5 ${colors.text}`} />
                        <div>
                          <p className={`font-semibold ${colors.text}`}>{getFormLabel(form.type)}</p>
                          <p className="text-xs opacity-75">{formatShortDate(form.exam_date)}</p>
                        </div>
                      </div>
                      <Eye className={`w-4 h-4 ${colors.text} opacity-60`} />
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    );
  };

  const stats = getFormStats();

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-4 border-blue-600 mb-4"></div>
        <p className="text-neutral-600 font-medium">Chargement des formulaires...</p>
      </div>
    );
  }

  if (forms.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="w-16 h-16 bg-neutral-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
          <FileText className="w-8 h-8 text-neutral-400" />
        </div>
        <p className="font-bold text-neutral-900 text-lg mb-1">Aucun formulaire rempli</p>
        <p className="text-sm text-neutral-600">Les formulaires complétés apparaîtront ici automatiquement</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h3 className="text-lg font-bold flex items-center gap-2">
            <FileText className="w-5 h-5 text-blue-600" />
            Formulaires Professionnels
          </h3>
          <p className="text-sm text-neutral-600 mt-1">
            {stats.total} formulaire{stats.total > 1 ? 's' : ''} • {stats.completed} complété{stats.completed > 1 ? 's' : ''}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`flex items-center gap-2 px-3 py-2 rounded-lg border-2 transition ${
              showFilters ? 'bg-blue-50 border-blue-300 text-blue-700' : 'border-neutral-200 hover:bg-neutral-50'
            }`}
          >
            <Filter className="w-4 h-4" />
            Filtres
            {showFilters ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
          </button>

          <div className="flex gap-1 bg-neutral-100 p-1 rounded-lg">
            {(['list', 'timeline'] as ViewMode[]).map((mode) => (
              <button
                key={mode}
                onClick={() => setViewMode(mode)}
                className={`px-3 py-1.5 rounded-md text-sm font-medium transition ${
                  viewMode === mode ? 'bg-white shadow-sm' : 'hover:bg-neutral-50'
                }`}
              >
                {mode === 'list' ? 'Liste' : 'Timeline'}
              </button>
            ))}
          </div>
        </div>
      </div>

      <AnimatePresence>
        {showFilters && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden"
          >
            <div className="bg-neutral-50 rounded-xl p-4 border border-neutral-200 space-y-3">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-neutral-400" />
                <input
                  type="text"
                  placeholder="Rechercher un formulaire..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              <div className="flex flex-wrap gap-2">
                {(['all', 'anamnese', 'atm', 'spinal', 'neurological', 'teleconsult'] as FilterType[]).map((type) => {
                  const Icon = type === 'all' ? FileText : getFormIcon(type);
                  const count = type === 'all' ? stats.total : (stats.byType[type] || 0);
                  return (
                    <button
                      key={type}
                      onClick={() => setFilterType(type)}
                      className={`flex items-center gap-2 px-3 py-2 rounded-lg border-2 transition text-sm font-medium ${
                        filterType === type
                          ? 'bg-blue-50 border-blue-300 text-blue-700'
                          : 'border-neutral-200 hover:bg-white'
                      }`}
                    >
                      <Icon className="w-4 h-4" />
                      {type === 'all' ? 'Tous' : getFormLabel(type)}
                      <span className="ml-1 px-1.5 py-0.5 bg-neutral-200 rounded-full text-xs">{count}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {filteredForms.length === 0 && (
        <div className="text-center py-8 text-neutral-500">
          <AlertCircle className="w-8 h-8 mx-auto mb-2 opacity-50" />
          <p className="font-medium">Aucun résultat</p>
          <p className="text-sm">Essayez un autre filtre</p>
        </div>
      )}

      {viewMode === 'list' && filteredForms.length > 0 && (
        <div className="space-y-2">
          {filteredForms.map((form) => {
            const Icon = getFormIcon(form.type);
            const colors = getFormColor(form.type);
            return (
              <motion.div
                key={form.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                whileHover={{ scale: 1.01 }}
                className={`p-4 rounded-xl border-2 ${colors.bg} ${colors.border} hover:shadow-md transition-all cursor-pointer`}
                onClick={() => setSelectedForm(form)}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`p-2 ${colors.accent} rounded-lg`}>
                      <Icon className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <p className={`font-semibold ${colors.text}`}>{getFormLabel(form.type)}</p>
                      <div className="flex items-center gap-2 text-xs opacity-75 mt-1">
                        <Clock className="w-3 h-3" />
                        {formatDate(form.exam_date)}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {form.completed && (
                      <span className="px-2 py-1 bg-green-500 text-white text-xs rounded-full flex items-center gap-1">
                        <CheckCircle className="w-3 h-3" />
                        Complété
                      </span>
                    )}
                    <div className="p-2 hover:bg-white/50 rounded-lg transition">
                      <Eye className="w-4 h-4" />
                    </div>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      )}

      {viewMode === 'timeline' && filteredForms.length > 0 && renderTimelineView()}

      <AnimatePresence>
        {selectedForm && renderFormDetails(selectedForm)}
      </AnimatePresence>
    </div>
  );
}
