import { motion, AnimatePresence } from 'framer-motion';
import { useState } from 'react';
import {
  X, User, Mail, Phone, Calendar, MapPin, Heart, Activity, FileText,
  ClipboardList, DollarSign, TrendingUp, AlertTriangle, Award, Clock,
  Stethoscope, Dumbbell, BarChart3, Target, Edit, Save, History,
  MessageSquare, Upload, Download, Plus, ChevronDown, ChevronRight,
  Eye, CheckCircle, XCircle, Info
} from 'lucide-react';

interface Patient {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  date_of_birth: string;
  status: string;
  last_visit?: string;
  total_visits: number;
  created_at: string;
  chief_complaint?: string;
  pain_level?: number;
  pain_areas?: string[];
  current_condition?: string;
  treatment_stage?: 'acute' | 'subacute' | 'maintenance' | 'wellness';
  red_flags?: string[];
  contraindications?: string[];
  initial_pain?: number;
  current_pain?: number;
  improvement_percentage?: number;
  treatment_plan?: string;
  sessions_completed?: number;
  sessions_planned?: number;
  cervical_flexion?: number;
  cervical_extension?: number;
  lumbar_flexion?: number;
  lumbar_extension?: number;
  exercises_assigned?: string[];
  exercises_compliance?: number;
  response_to_care?: 'excellent' | 'good' | 'fair' | 'poor';
  last_xray_date?: string;
  next_reassessment?: string;
  insurance_type?: string;
  unpaid_balance?: number;
  next_appointment?: string;
  is_vip?: boolean;
  recall_date?: string;
  no_show_count?: number;
  tags?: string[];
}

interface PatientFileModalProps {
  patient: Patient;
  onClose: () => void;
  onUpdate?: () => void;
}

type TabType = 'overview' | 'clinical' | 'history' | 'billing' | 'documents' | 'notes';

export function PatientFileModal({ patient, onClose, onUpdate }: PatientFileModalProps) {
  const [activeTab, setActiveTab] = useState<TabType>('overview');
  const [isEditing, setIsEditing] = useState(false);
  const [expandedSections, setExpandedSections] = useState<string[]>(['vitals', 'progress']);

  const toggleSection = (section: string) => {
    setExpandedSections(prev =>
      prev.includes(section)
        ? prev.filter(s => s !== section)
        : [...prev, section]
    );
  };

  const tabs = [
    { id: 'overview', label: 'Vue d\'ensemble', icon: User },
    { id: 'clinical', label: 'Clinique', icon: Stethoscope },
    { id: 'history', label: 'Historique', icon: History },
    { id: 'billing', label: 'Facturation', icon: DollarSign },
    { id: 'documents', label: 'Documents', icon: FileText },
    { id: 'notes', label: 'Notes', icon: MessageSquare },
  ] as const;

  const getTreatmentStageColor = (stage: string) => {
    switch (stage) {
      case 'acute': return 'from-red-500 to-red-600';
      case 'subacute': return 'from-orange-500 to-orange-600';
      case 'maintenance': return 'from-blue-500 to-blue-600';
      case 'wellness': return 'from-green-500 to-green-600';
      default: return 'from-gray-500 to-gray-600';
    }
  };

  const getResponseLabel = (response: string) => {
    switch (response) {
      case 'excellent': return 'EXCELLENT';
      case 'good': return 'BON';
      case 'fair': return 'MOYEN';
      case 'poor': return 'FAIBLE';
      default: return response?.toUpperCase();
    }
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          className="bg-white rounded-3xl shadow-2xl w-full max-w-7xl max-h-[90vh] overflow-hidden flex flex-col"
        >
          {/* Header */}
          <div className="relative bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-8">
            <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmYiIGZpbGwtb3BhY2l0eT0iMC4wNSI+PHBhdGggZD0iTTM2IDM0djItaDJ2LTJoLTJ6bTAtNGgydjJoLTJ2LTJ6bTAgOGgydjJoLTJ2LTJ6bTQtNHYyaDJ2LTJoLTJ6bS00IDB2Mmgydi0yaC0yem0tOCAwdjJoMnYtMmgtMnptOC00djJoMnYtMmgtMnoiLz48L2c+PC9nPjwvc3ZnPg==')] opacity-30" />

            <div className="relative z-10 flex items-start justify-between">
              <div className="flex items-center gap-6">
                {/* Avatar */}
                <div className="relative">
                  <div className="w-24 h-24 rounded-2xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-bold text-3xl shadow-2xl">
                    {patient.first_name[0]}{patient.last_name[0]}
                  </div>
                  {patient.is_vip && (
                    <div className="absolute -top-2 -right-2 w-8 h-8 bg-gradient-to-br from-yellow-400 to-yellow-500 rounded-full flex items-center justify-center shadow-lg">
                      <Award className="w-4 h-4 text-white" />
                    </div>
                  )}
                </div>

                {/* Patient Info */}
                <div>
                  <h2 className="text-3xl font-bold text-white mb-2">
                    {patient.first_name} {patient.last_name}
                  </h2>
                  <div className="flex items-center gap-4 mb-3">
                    <span className={`px-4 py-1.5 rounded-xl text-xs font-bold uppercase bg-gradient-to-r ${getTreatmentStageColor(patient.treatment_stage || '')} text-white shadow-lg`}>
                      {patient.treatment_stage}
                    </span>
                    {patient.red_flags && patient.red_flags.length > 0 && (
                      <span className="px-3 py-1.5 bg-red-500 text-white rounded-xl text-xs font-bold flex items-center gap-2 shadow-lg animate-pulse">
                        <AlertTriangle className="w-4 h-4" />
                        {patient.red_flags.length} Alerte{patient.red_flags.length > 1 ? 's' : ''}
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-6 text-sm text-slate-300">
                    <span className="flex items-center gap-2">
                      <Mail className="w-4 h-4" />
                      {patient.email}
                    </span>
                    <span className="flex items-center gap-2">
                      <Phone className="w-4 h-4" />
                      {patient.phone}
                    </span>
                    <span className="flex items-center gap-2">
                      <Calendar className="w-4 h-4" />
                      {new Date(patient.date_of_birth).toLocaleDateString('fr-FR')}
                    </span>
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setIsEditing(!isEditing)}
                  className="p-3 bg-white/10 hover:bg-white/20 backdrop-blur-sm text-white rounded-xl transition-all"
                  title={isEditing ? 'Annuler' : 'Modifier'}
                >
                  {isEditing ? <X className="w-5 h-5" /> : <Edit className="w-5 h-5" />}
                </button>
                <button
                  onClick={onClose}
                  className="p-3 bg-white/10 hover:bg-white/20 backdrop-blur-sm text-white rounded-xl transition-all"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>
          </div>

          {/* Tabs */}
          <div className="border-b border-slate-200 bg-slate-50 px-8">
            <div className="flex gap-2 -mb-px overflow-x-auto">
              {tabs.map(tab => {
                const Icon = tab.icon;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id as TabType)}
                    className={`px-6 py-4 font-semibold text-sm flex items-center gap-2 border-b-2 transition-all whitespace-nowrap ${
                      activeTab === tab.id
                        ? 'border-blue-500 text-blue-600 bg-white'
                        : 'border-transparent text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    {tab.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto p-8">
            <AnimatePresence mode="wait">
              {/* Overview Tab */}
              {activeTab === 'overview' && (
                <motion.div
                  key="overview"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  className="space-y-6"
                >
                  {/* Quick Stats */}
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                    {[
                      { label: 'Visites Totales', value: patient.total_visits, icon: Calendar, color: 'blue' },
                      { label: 'Douleur Actuelle', value: `${patient.current_pain}/10`, icon: Activity, color: 'red' },
                      { label: 'Amélioration', value: `${patient.improvement_percentage?.toFixed(0)}%`, icon: TrendingUp, color: 'green' },
                      { label: 'Observance', value: `${patient.exercises_compliance}%`, icon: Dumbbell, color: 'purple' },
                    ].map((stat, i) => (
                      <div key={i} className="bg-gradient-to-br from-slate-50 to-slate-100 rounded-2xl p-6 border-2 border-slate-200">
                        <div className="flex items-center justify-between mb-3">
                          <stat.icon className={`w-8 h-8 text-${stat.color}-500`} />
                          <div className={`text-3xl font-bold text-${stat.color}-600`}>{stat.value}</div>
                        </div>
                        <div className="text-sm font-semibold text-slate-600">{stat.label}</div>
                      </div>
                    ))}
                  </div>

                  {/* Collapsible Sections */}
                  <div className="space-y-4">
                    {/* Vitals Section */}
                    <div className="bg-white rounded-2xl border-2 border-slate-200 overflow-hidden">
                      <button
                        onClick={() => toggleSection('vitals')}
                        className="w-full p-6 flex items-center justify-between hover:bg-slate-50 transition-all"
                      >
                        <div className="flex items-center gap-3">
                          <div className="p-3 bg-gradient-to-br from-red-500/10 to-red-500/5 rounded-xl">
                            <Heart className="w-6 h-6 text-red-500" />
                          </div>
                          <div className="text-left">
                            <h3 className="font-bold text-lg text-slate-900">Signes Vitaux & État</h3>
                            <p className="text-sm text-slate-500">Condition actuelle et plainte principale</p>
                          </div>
                        </div>
                        <ChevronDown className={`w-6 h-6 text-slate-400 transition-transform ${expandedSections.includes('vitals') ? 'rotate-180' : ''}`} />
                      </button>

                      {expandedSections.includes('vitals') && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: 'auto', opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          className="border-t border-slate-200 p-6 bg-slate-50"
                        >
                          <div className="grid grid-cols-2 gap-6">
                            <div>
                              <label className="text-xs font-bold text-slate-500 uppercase mb-2 block">Plainte Principale</label>
                              <div className="text-lg font-semibold text-slate-900">{patient.chief_complaint}</div>
                            </div>
                            <div>
                              <label className="text-xs font-bold text-slate-500 uppercase mb-2 block">Condition Actuelle</label>
                              <div className="text-lg font-semibold text-slate-900">{patient.current_condition}</div>
                            </div>
                            <div>
                              <label className="text-xs font-bold text-slate-500 uppercase mb-2 block">Zones Douloureuses</label>
                              <div className="flex flex-wrap gap-2">
                                {patient.pain_areas?.map((area, i) => (
                                  <span key={i} className="px-3 py-1 bg-red-100 text-red-700 rounded-lg text-sm font-medium">
                                    {area}
                                  </span>
                                ))}
                              </div>
                            </div>
                            <div>
                              <label className="text-xs font-bold text-slate-500 uppercase mb-2 block">Assurance</label>
                              <div className="text-lg font-semibold text-slate-900">{patient.insurance_type}</div>
                            </div>
                          </div>

                          {patient.red_flags && patient.red_flags.length > 0 && (
                            <div className="mt-6 p-4 bg-red-50 border-2 border-red-200 rounded-xl">
                              <div className="flex items-center gap-2 mb-3">
                                <AlertTriangle className="w-5 h-5 text-red-600" />
                                <h4 className="font-bold text-red-900">Drapeaux Rouges</h4>
                              </div>
                              <ul className="space-y-2">
                                {patient.red_flags.map((flag, i) => (
                                  <li key={i} className="text-sm text-red-700 flex items-start gap-2">
                                    <span className="w-1.5 h-1.5 bg-red-500 rounded-full mt-2" />
                                    {flag}
                                  </li>
                                ))}
                              </ul>
                            </div>
                          )}
                        </motion.div>
                      )}
                    </div>

                    {/* Progress Section */}
                    <div className="bg-white rounded-2xl border-2 border-slate-200 overflow-hidden">
                      <button
                        onClick={() => toggleSection('progress')}
                        className="w-full p-6 flex items-center justify-between hover:bg-slate-50 transition-all"
                      >
                        <div className="flex items-center gap-3">
                          <div className="p-3 bg-gradient-to-br from-green-500/10 to-green-500/5 rounded-xl">
                            <TrendingUp className="w-6 h-6 text-green-500" />
                          </div>
                          <div className="text-left">
                            <h3 className="font-bold text-lg text-slate-900">Progrès du Traitement</h3>
                            <p className="text-sm text-slate-500">{patient.sessions_completed}/{patient.sessions_planned} séances complétées</p>
                          </div>
                        </div>
                        <ChevronDown className={`w-6 h-6 text-slate-400 transition-transform ${expandedSections.includes('progress') ? 'rotate-180' : ''}`} />
                      </button>

                      {expandedSections.includes('progress') && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: 'auto', opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          className="border-t border-slate-200 p-6 bg-slate-50"
                        >
                          {/* Pain Progress */}
                          <div className="mb-6">
                            <h4 className="font-bold text-slate-900 mb-4">Évolution de la Douleur</h4>
                            <div className="grid grid-cols-3 gap-4">
                              <div className="text-center p-4 bg-white rounded-xl border-2 border-slate-200">
                                <div className="text-3xl font-bold text-slate-900 mb-1">{patient.initial_pain}</div>
                                <div className="text-xs font-semibold text-slate-500 uppercase">Initial</div>
                              </div>
                              <div className="text-center p-4 bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl border-2 border-green-200">
                                <div className="text-3xl font-bold text-green-600 mb-1">{patient.current_pain}</div>
                                <div className="text-xs font-semibold text-green-700 uppercase">Actuel</div>
                              </div>
                              <div className="text-center p-4 bg-gradient-to-br from-blue-50 to-cyan-50 rounded-xl border-2 border-blue-200">
                                <div className="text-3xl font-bold text-blue-600 mb-1">{patient.improvement_percentage?.toFixed(0)}%</div>
                                <div className="text-xs font-semibold text-blue-700 uppercase">Amélioration</div>
                              </div>
                            </div>
                          </div>

                          {/* Treatment Plan */}
                          <div className="mb-6">
                            <h4 className="font-bold text-slate-900 mb-3">Plan de Traitement</h4>
                            <div className="p-4 bg-white rounded-xl border-2 border-slate-200">
                              <div className="text-lg font-semibold text-slate-900 mb-2">{patient.treatment_plan}</div>
                              <div className="flex items-center justify-between mb-3">
                                <span className="text-sm text-slate-600">Progrès</span>
                                <span className="text-sm font-bold text-slate-900">
                                  {((patient.sessions_completed || 0) / (patient.sessions_planned || 12) * 100).toFixed(0)}%
                                </span>
                              </div>
                              <div className="h-3 bg-slate-100 rounded-full overflow-hidden">
                                <div
                                  className="h-full bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 rounded-full transition-all"
                                  style={{ width: `${((patient.sessions_completed || 0) / (patient.sessions_planned || 12) * 100)}%` }}
                                />
                              </div>
                            </div>
                          </div>

                          {/* Response to Care */}
                          <div>
                            <h4 className="font-bold text-slate-900 mb-3">Réponse aux Soins</h4>
                            <div className={`p-6 rounded-xl border-2 text-center ${
                              patient.response_to_care === 'excellent' ? 'bg-gradient-to-br from-green-50 to-emerald-50 border-green-300' :
                              patient.response_to_care === 'good' ? 'bg-gradient-to-br from-blue-50 to-cyan-50 border-blue-300' :
                              patient.response_to_care === 'fair' ? 'bg-gradient-to-br from-yellow-50 to-orange-50 border-yellow-300' :
                              'bg-gradient-to-br from-red-50 to-rose-50 border-red-300'
                            }`}>
                              <div className="text-4xl font-bold mb-2">
                                {getResponseLabel(patient.response_to_care || '')}
                              </div>
                              <div className="text-sm text-slate-600">Niveau de réponse au traitement</div>
                            </div>
                          </div>
                        </motion.div>
                      )}
                    </div>

                    {/* Exercises Section */}
                    <div className="bg-white rounded-2xl border-2 border-slate-200 overflow-hidden">
                      <button
                        onClick={() => toggleSection('exercises')}
                        className="w-full p-6 flex items-center justify-between hover:bg-slate-50 transition-all"
                      >
                        <div className="flex items-center gap-3">
                          <div className="p-3 bg-gradient-to-br from-purple-500/10 to-purple-500/5 rounded-xl">
                            <Dumbbell className="w-6 h-6 text-purple-500" />
                          </div>
                          <div className="text-left">
                            <h3 className="font-bold text-lg text-slate-900">Exercices Assignés</h3>
                            <p className="text-sm text-slate-500">{patient.exercises_compliance}% observance</p>
                          </div>
                        </div>
                        <ChevronDown className={`w-6 h-6 text-slate-400 transition-transform ${expandedSections.includes('exercises') ? 'rotate-180' : ''}`} />
                      </button>

                      {expandedSections.includes('exercises') && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: 'auto', opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          className="border-t border-slate-200 p-6 bg-slate-50"
                        >
                          <div className="space-y-3">
                            {patient.exercises_assigned?.map((exercise, i) => (
                              <div key={i} className="flex items-center justify-between p-4 bg-white rounded-xl border-2 border-slate-200">
                                <div className="flex items-center gap-3">
                                  <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-pink-500 rounded-lg flex items-center justify-center text-white font-bold">
                                    {i + 1}
                                  </div>
                                  <span className="font-semibold text-slate-900">{exercise}</span>
                                </div>
                                <CheckCircle className="w-5 h-5 text-green-500" />
                              </div>
                            ))}
                          </div>
                        </motion.div>
                      )}
                    </div>
                  </div>
                </motion.div>
              )}

              {/* Clinical Tab */}
              {activeTab === 'clinical' && (
                <motion.div
                  key="clinical"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  className="space-y-6"
                >
                  <div className="bg-gradient-to-br from-blue-50 to-cyan-50 rounded-2xl p-8 border-2 border-blue-200">
                    <h3 className="text-2xl font-bold text-slate-900 mb-6 flex items-center gap-3">
                      <Stethoscope className="w-8 h-8 text-blue-600" />
                      Données Cliniques
                    </h3>

                    {/* ROM Measurements */}
                    <div className="grid grid-cols-2 gap-6 mb-6">
                      <div className="bg-white rounded-xl p-6 border-2 border-slate-200">
                        <h4 className="font-bold text-slate-900 mb-4">ROM Cervical</h4>
                        <div className="space-y-3">
                          <div>
                            <div className="flex justify-between text-sm mb-1">
                              <span className="text-slate-600">Flexion</span>
                              <span className="font-bold text-slate-900">{patient.cervical_flexion}°</span>
                            </div>
                            <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                              <div
                                className="h-full bg-gradient-to-r from-blue-500 to-cyan-500"
                                style={{ width: `${(patient.cervical_flexion || 0) / 60 * 100}%` }}
                              />
                            </div>
                          </div>
                          <div>
                            <div className="flex justify-between text-sm mb-1">
                              <span className="text-slate-600">Extension</span>
                              <span className="font-bold text-slate-900">{patient.cervical_extension}°</span>
                            </div>
                            <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                              <div
                                className="h-full bg-gradient-to-r from-purple-500 to-pink-500"
                                style={{ width: `${(patient.cervical_extension || 0) / 70 * 100}%` }}
                              />
                            </div>
                          </div>
                        </div>
                      </div>

                      <div className="bg-white rounded-xl p-6 border-2 border-slate-200">
                        <h4 className="font-bold text-slate-900 mb-4">ROM Lombaire</h4>
                        <div className="space-y-3">
                          <div>
                            <div className="flex justify-between text-sm mb-1">
                              <span className="text-slate-600">Flexion</span>
                              <span className="font-bold text-slate-900">{patient.lumbar_flexion}°</span>
                            </div>
                            <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                              <div
                                className="h-full bg-gradient-to-r from-green-500 to-emerald-500"
                                style={{ width: `${(patient.lumbar_flexion || 0) / 90 * 100}%` }}
                              />
                            </div>
                          </div>
                          <div>
                            <div className="flex justify-between text-sm mb-1">
                              <span className="text-slate-600">Extension</span>
                              <span className="font-bold text-slate-900">{patient.lumbar_extension}°</span>
                            </div>
                            <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                              <div
                                className="h-full bg-gradient-to-r from-yellow-500 to-orange-500"
                                style={{ width: `${(patient.lumbar_extension || 0) / 30 * 100}%` }}
                              />
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Reassessment Info */}
                    {patient.next_reassessment && (
                      <div className="bg-white rounded-xl p-6 border-2 border-blue-300">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <Calendar className="w-6 h-6 text-blue-600" />
                            <div>
                              <div className="font-bold text-slate-900">Prochaine Réévaluation</div>
                              <div className="text-sm text-slate-600">{new Date(patient.next_reassessment).toLocaleDateString('fr-FR')}</div>
                            </div>
                          </div>
                          <button className="px-4 py-2 bg-blue-500 text-white rounded-xl hover:bg-blue-600 transition-all font-semibold">
                            Planifier
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                </motion.div>
              )}

              {/* Other tabs placeholder */}
              {activeTab === 'history' && (
                <motion.div
                  key="history"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  className="text-center py-16"
                >
                  <History className="w-16 h-16 text-slate-300 mx-auto mb-4" />
                  <h3 className="text-xl font-bold text-slate-700 mb-2">Historique des Visites</h3>
                  <p className="text-slate-500">Les visites passées s'afficheront ici</p>
                </motion.div>
              )}

              {activeTab === 'billing' && (
                <motion.div
                  key="billing"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  className="space-y-6"
                >
                  <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-2xl p-8 border-2 border-green-200">
                    <h3 className="text-2xl font-bold text-slate-900 mb-6 flex items-center gap-3">
                      <DollarSign className="w-8 h-8 text-green-600" />
                      Facturation
                    </h3>

                    <div className="grid grid-cols-3 gap-6">
                      <div className="bg-white rounded-xl p-6 border-2 border-slate-200 text-center">
                        <div className="text-4xl font-bold text-red-600 mb-2">${patient.unpaid_balance || 0}</div>
                        <div className="text-sm font-semibold text-slate-600">Solde Impayé</div>
                      </div>
                      <div className="bg-white rounded-xl p-6 border-2 border-slate-200 text-center">
                        <div className="text-4xl font-bold text-slate-900 mb-2">{patient.total_visits}</div>
                        <div className="text-sm font-semibold text-slate-600">Visites Facturées</div>
                      </div>
                      <div className="bg-white rounded-xl p-6 border-2 border-slate-200 text-center">
                        <div className="text-4xl font-bold text-blue-600 mb-2">{patient.insurance_type}</div>
                        <div className="text-sm font-semibold text-slate-600">Type Assurance</div>
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}

              {activeTab === 'documents' && (
                <motion.div
                  key="documents"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  className="text-center py-16"
                >
                  <FileText className="w-16 h-16 text-slate-300 mx-auto mb-4" />
                  <h3 className="text-xl font-bold text-slate-700 mb-2">Documents Patient</h3>
                  <p className="text-slate-500 mb-6">Formulaires, imagerie, rapports</p>
                  <button className="px-6 py-3 bg-blue-500 text-white rounded-xl hover:bg-blue-600 transition-all font-semibold inline-flex items-center gap-2">
                    <Upload className="w-5 h-5" />
                    Téléverser Document
                  </button>
                </motion.div>
              )}

              {activeTab === 'notes' && (
                <motion.div
                  key="notes"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  className="text-center py-16"
                >
                  <MessageSquare className="w-16 h-16 text-slate-300 mx-auto mb-4" />
                  <h3 className="text-xl font-bold text-slate-700 mb-2">Notes Cliniques</h3>
                  <p className="text-slate-500 mb-6">Notes SOAP et observations</p>
                  <button className="px-6 py-3 bg-blue-500 text-white rounded-xl hover:bg-blue-600 transition-all font-semibold inline-flex items-center gap-2">
                    <Plus className="w-5 h-5" />
                    Nouvelle Note SOAP
                  </button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Footer Actions */}
          <div className="border-t border-slate-200 bg-slate-50 p-6 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <button className="px-4 py-2 bg-white border-2 border-slate-200 text-slate-700 rounded-xl hover:border-slate-300 hover:shadow-sm transition-all font-semibold">
                Imprimer Dossier
              </button>
              <button className="px-4 py-2 bg-white border-2 border-slate-200 text-slate-700 rounded-xl hover:border-slate-300 hover:shadow-sm transition-all font-semibold">
                Exporter PDF
              </button>
            </div>
            <button
              onClick={onClose}
              className="px-6 py-2 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-xl hover:from-blue-600 hover:to-blue-700 transition-all font-semibold shadow-lg"
            >
              Fermer
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
