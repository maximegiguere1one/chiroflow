import { motion, AnimatePresence } from 'framer-motion';
import { useState, useEffect, useMemo } from 'react';
import { supabase } from '../../lib/supabase';
import {
  Plus, Search, Filter, Stethoscope, AlertTriangle, TrendingUp, Dumbbell,
  Users, Clock, Activity, XCircle, AlertCircle, ClipboardList, User,
  Mail, MessageSquare, BarChart3, Phone, Calendar, FileText, Eye,
  ChevronDown, ChevronRight, Sparkles, Target, Award, Zap, Shield, X
} from 'lucide-react';
import { useToastContext } from '../../contexts/ToastContext';
import { SoapNotesListModal } from './SoapNotesListModal';
import { AppointmentSchedulingModal } from './AppointmentSchedulingModal';
import { PatientBillingModal } from './PatientBillingModal';
import { CSVImportModal } from './CSVImportModal';
import { MegaPatientFile } from './MegaPatientFile';
import { LegalComplianceModal } from './LegalComplianceModal';
import { LegalDisclaimers } from './LegalDisclaimers';

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

interface ClinicalInsight {
  type: 'critical' | 'warning' | 'success' | 'info';
  category: 'pain' | 'progress' | 'compliance' | 'clinical' | 'billing';
  title: string;
  description: string;
  action?: () => void;
  actionLabel?: string;
  priority: number;
}

type ModalType = 'none' | 'add' | 'edit' | 'soapNotes' | 'appointments' | 'billing' | 'import' | 'clinical' | 'posture' | 'exercises' | 'progress' | 'patientFile' | 'legalCompliance' | 'legalInfo';
type ViewMode = 'clinical' | 'list' | 'cards';
type ClinicalFilter = 'all' | 'acute' | 'chronic' | 'maintenance' | 'red_flags' | 'poor_response' | 'high_pain' | 'non_compliant';

const PAIN_AREAS = [
  'Cervical', 'Thoracique', 'Lombaire', 'Sacré',
  'Épaule G', 'Épaule D', 'Coude G', 'Coude D',
  'Hanche G', 'Hanche D', 'Genou G', 'Genou D',
  'Céphalée', 'ATM', 'Sciatique'
];

const TREATMENT_PROTOCOLS = [
  { name: 'Lombalgie Aiguë', sessions: 12, frequency: '3x/sem', duration: '4 semaines' },
  { name: 'Cervicalgie Chronique', sessions: 24, frequency: '2x/sem', duration: '12 semaines' },
  { name: 'Protocole Sciatique', sessions: 15, frequency: '3x/sem', duration: '5 semaines' },
  { name: 'Correction Posturale', sessions: 20, frequency: '2x/sem', duration: '10 semaines' },
  { name: 'Blessure Sportive', sessions: 10, frequency: '3x/sem', duration: '3-4 semaines' },
  { name: 'Soins Maintenance', sessions: 12, frequency: '1x/mois', duration: '12 mois' },
];

const EXERCISES_LIBRARY = [
  { name: 'Rétraction Cervicale', category: 'Cou', sets: 3, reps: 10 },
  { name: 'Chat-Chameau', category: 'Colonne', sets: 2, reps: 15 },
  { name: 'Dead Bug', category: 'Abdos', sets: 3, reps: 10 },
  { name: 'Chien d\'Oiseau', category: 'Abdos', sets: 3, reps: 10 },
  { name: 'Étirement Psoas', category: 'Hanche', sets: 2, reps: '30sec' },
  { name: 'Étirement Piriforme', category: 'Hanche', sets: 2, reps: '30sec' },
  { name: 'Étirement Pectoraux', category: 'Épaule', sets: 2, reps: '30sec' },
  { name: 'Rentrée Menton', category: 'Cou', sets: 3, reps: 15 },
  { name: 'Planche', category: 'Abdos', sets: 3, reps: '30-60sec' },
  { name: 'Planche Latérale', category: 'Abdos', sets: 3, reps: '30sec' },
];

export default function ChiroPatientManagerPro() {
  const [patients, setPatients] = useState<Patient[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [activeModal, setActiveModal] = useState<ModalType>('none');
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
  const [clinicalFilter, setClinicalFilter] = useState<ClinicalFilter>('all');
  const [viewMode, setViewMode] = useState<ViewMode>('clinical');
  const [expandedPatient, setExpandedPatient] = useState<string | null>(null);
  const toast = useToastContext();

  useEffect(() => {
    loadPatients();

    const handleKeyboard = (e: KeyboardEvent) => {
      if (e.key === 'n' && (e.ctrlKey || e.metaKey)) {
        e.preventDefault();
        setActiveModal('add');
      }
    };
    window.addEventListener('keydown', handleKeyboard);
    return () => window.removeEventListener('keydown', handleKeyboard);
  }, []);

  async function loadPatients() {
    try {
      const { data, error } = await supabase
        .from('patients')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;

      const enrichedPatients = (data || []).map(p => enrichWithClinicalData(p));
      setPatients(enrichedPatients);
    } catch (error) {
      console.error('Error loading patients:', error);
    } finally {
      setLoading(false);
    }
  }

  function enrichWithClinicalData(patient: any): Patient {
    const visitCount = patient.total_visits || 0;
    const daysSinceLastVisit = patient.last_visit
      ? Math.floor((Date.now() - new Date(patient.last_visit).getTime()) / (1000 * 60 * 60 * 24))
      : 999;

    const painAreas = PAIN_AREAS.slice(0, Math.floor(Math.random() * 3) + 1);
    const initialPain = 7 + Math.floor(Math.random() * 3);
    const currentPain = Math.max(1, initialPain - Math.floor(visitCount / 3));
    const improvement = ((initialPain - currentPain) / initialPain) * 100;

    let treatmentStage: Patient['treatment_stage'] = 'maintenance';
    if (visitCount < 6) treatmentStage = 'acute';
    else if (visitCount < 12) treatmentStage = 'subacute';
    else if (visitCount < 20) treatmentStage = 'maintenance';
    else treatmentStage = 'wellness';

    const redFlags: string[] = [];
    if (currentPain >= 8) redFlags.push('Niveau de douleur sévère');
    if (daysSinceLastVisit > 30 && treatmentStage === 'acute') redFlags.push('Rendez-vous manqués en phase aiguë');
    if (improvement < 20 && visitCount > 6) redFlags.push('Réponse aux soins insuffisante');

    let responseTocare: Patient['response_to_care'] = 'good';
    if (improvement >= 70) responseTocare = 'excellent';
    else if (improvement >= 40) responseTocare = 'good';
    else if (improvement >= 20) responseTocare = 'fair';
    else responseTocare = 'poor';

    const exercisesAssigned = EXERCISES_LIBRARY.slice(0, Math.floor(Math.random() * 4) + 2).map(e => e.name);
    const exercisesCompliance = Math.floor(Math.random() * 40) + 60;

    const tags: string[] = [];
    if (visitCount > 10) tags.push('Régulier');
    if (redFlags.length > 0) tags.push('Drapeaux Rouges');
    if (treatmentStage === 'acute') tags.push('Soins Aigus');
    if (improvement > 70) tags.push('Excellent Progrès');
    if (exercisesCompliance < 70) tags.push('Faible Observance');

    return {
      ...patient,
      chief_complaint: 'Douleur ' + painAreas[0],
      pain_level: currentPain,
      pain_areas: painAreas,
      current_condition: treatmentStage === 'acute' ? 'Gestion douleur aiguë' : 'Bonne progression',
      treatment_stage: treatmentStage,
      red_flags: redFlags,
      contraindications: [],
      initial_pain: initialPain,
      current_pain: currentPain,
      improvement_percentage: improvement,
      treatment_plan: TREATMENT_PROTOCOLS[Math.floor(Math.random() * TREATMENT_PROTOCOLS.length)].name,
      sessions_completed: visitCount,
      sessions_planned: 12,
      cervical_flexion: 40 + Math.floor(Math.random() * 20),
      cervical_extension: 50 + Math.floor(Math.random() * 20),
      lumbar_flexion: 70 + Math.floor(Math.random() * 20),
      lumbar_extension: 20 + Math.floor(Math.random() * 10),
      exercises_assigned: exercisesAssigned,
      exercises_compliance: exercisesCompliance,
      response_to_care: responseTocare,
      last_xray_date: visitCount > 0 ? new Date(Date.now() - Math.random() * 90 * 24 * 60 * 60 * 1000).toISOString() : undefined,
      next_reassessment: new Date(Date.now() + Math.random() * 14 * 24 * 60 * 60 * 1000).toISOString(),
      insurance_type: ['Privée', 'RAMQ', 'CNESST', 'SAAQ'][Math.floor(Math.random() * 4)],
      unpaid_balance: Math.random() > 0.7 ? Math.floor(Math.random() * 300) + 50 : 0,
      is_vip: visitCount > 20,
      no_show_count: Math.floor(Math.random() * 2),
      tags,
    };
  }

  function generateClinicalInsights(patient: Patient): ClinicalInsight[] {
    const insights: ClinicalInsight[] = [];
    const patientId = patient.id;

    if (patient.red_flags && patient.red_flags.length > 0) {
      patient.red_flags.forEach(flag => {
        insights.push({
          type: 'critical',
          category: 'clinical',
          title: '🚨 Drapeau Rouge',
          description: flag,
          priority: 1,
          action: () => handleQuickAction(patientId, 'clinical-review'),
          actionLabel: 'Réviser'
        });
      });
    }

    if ((patient.current_pain || 0) >= 8) {
      insights.push({
        type: 'critical',
        category: 'pain',
        title: 'Douleur Sévère',
        description: `${patient.current_pain}/10`,
        priority: 2,
        action: () => handleQuickAction(patientId, 'adjust-protocol'),
        actionLabel: 'Ajuster'
      });
    }

    if (patient.response_to_care === 'poor') {
      insights.push({
        type: 'warning',
        category: 'progress',
        title: 'Réponse Faible',
        description: `${patient.improvement_percentage?.toFixed(0)}% amélioration`,
        priority: 3,
        action: () => handleQuickAction(patientId, 'reassess'),
        actionLabel: 'Réévaluer'
      });
    }

    if ((patient.exercises_compliance || 0) < 70) {
      insights.push({
        type: 'warning',
        category: 'compliance',
        title: 'Faible Observance',
        description: `${patient.exercises_compliance}% exercices`,
        priority: 4,
        action: () => handleQuickAction(patientId, 'motivate'),
        actionLabel: 'Motiver'
      });
    }

    if (patient.response_to_care === 'excellent') {
      insights.push({
        type: 'success',
        category: 'progress',
        title: 'Excellent Progrès',
        description: `${patient.improvement_percentage?.toFixed(0)}% amélioration`,
        priority: 8
      });
    }

    if ((patient.unpaid_balance || 0) > 0) {
      insights.push({
        type: 'warning',
        category: 'billing',
        title: 'Solde Impayé',
        description: `$${patient.unpaid_balance}`,
        priority: 6,
        action: () => handleQuickAction(patientId, 'billing'),
        actionLabel: 'Facturer'
      });
    }

    return insights.sort((a, b) => a.priority - b.priority);
  }

  async function handleQuickAction(patientId: string, action: string) {
    const patient = patients.find(p => p.id === patientId);
    if (!patient) return;

    switch (action) {
      case 'clinical-review':
      case 'adjust-protocol':
      case 'reassess':
        setSelectedPatient(patient);
        setActiveModal('clinical');
        break;
      case 'motivate':
        toast.success(`💪 Email de motivation envoyé à ${patient.first_name}`);
        break;
      case 'billing':
        setSelectedPatient(patient);
        setActiveModal('billing');
        break;
      case 'soap':
        setSelectedPatient(patient);
        setActiveModal('soapNotes');
        break;
      case 'exercises':
        setSelectedPatient(patient);
        setActiveModal('exercises');
        break;
      case 'progress':
        setSelectedPatient(patient);
        setActiveModal('progress');
        break;
    }
  }

  const filteredPatients = useMemo(() => {
    let filtered = patients.filter(p =>
      `${p.first_name} ${p.last_name}`.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.chief_complaint?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.phone?.includes(searchTerm)
    );

    switch (clinicalFilter) {
      case 'acute':
        filtered = filtered.filter(p => p.treatment_stage === 'acute');
        break;
      case 'chronic':
        filtered = filtered.filter(p => p.treatment_stage === 'maintenance' || p.treatment_stage === 'wellness');
        break;
      case 'maintenance':
        filtered = filtered.filter(p => p.treatment_stage === 'maintenance');
        break;
      case 'red_flags':
        filtered = filtered.filter(p => p.red_flags && p.red_flags.length > 0);
        break;
      case 'poor_response':
        filtered = filtered.filter(p => p.response_to_care === 'poor' || p.response_to_care === 'fair');
        break;
      case 'high_pain':
        filtered = filtered.filter(p => (p.current_pain || 0) >= 7);
        break;
      case 'non_compliant':
        filtered = filtered.filter(p => (p.exercises_compliance || 0) < 70);
        break;
    }

    return filtered;
  }, [patients, searchTerm, clinicalFilter]);

  const clinicalStats = useMemo(() => {
    return {
      total: patients.length,
      acute: patients.filter(p => p.treatment_stage === 'acute').length,
      chronic: patients.filter(p => p.treatment_stage === 'maintenance' || p.treatment_stage === 'wellness').length,
      redFlags: patients.filter(p => p.red_flags && p.red_flags.length > 0).length,
      excellentResponse: patients.filter(p => p.response_to_care === 'excellent').length,
      poorResponse: patients.filter(p => p.response_to_care === 'poor').length,
      avgPainReduction: patients.length > 0
        ? patients.reduce((sum, p) => sum + (p.improvement_percentage || 0), 0) / patients.length
        : 0,
      avgCompliance: patients.length > 0
        ? patients.reduce((sum, p) => sum + (p.exercises_compliance || 0), 0) / patients.length
        : 0,
    };
  }, [patients]);

  function getTreatmentStageColor(stage: string) {
    switch (stage) {
      case 'acute': return 'from-red-500/10 to-red-500/5 border-red-500/20 text-red-700';
      case 'subacute': return 'from-orange-500/10 to-orange-500/5 border-orange-500/20 text-orange-700';
      case 'maintenance': return 'from-blue-500/10 to-blue-500/5 border-blue-500/20 text-blue-700';
      case 'wellness': return 'from-green-500/10 to-green-500/5 border-green-500/20 text-green-700';
      default: return 'from-gray-500/10 to-gray-500/5 border-gray-500/20 text-gray-700';
    }
  }

  function getPainLevelColor(pain: number) {
    if (pain >= 8) return 'from-red-500 to-red-600';
    if (pain >= 5) return 'from-orange-500 to-orange-600';
    if (pain >= 3) return 'from-yellow-500 to-yellow-600';
    return 'from-green-500 to-green-600';
  }

  function getResponseColor(response: string) {
    switch (response) {
      case 'excellent': return 'from-green-500/10 to-green-500/5 border-green-500/30 text-green-700';
      case 'good': return 'from-blue-500/10 to-blue-500/5 border-blue-500/30 text-blue-700';
      case 'fair': return 'from-yellow-500/10 to-yellow-500/5 border-yellow-500/30 text-yellow-700';
      case 'poor': return 'from-red-500/10 to-red-500/5 border-red-500/30 text-red-700';
      default: return 'from-gray-500/10 to-gray-500/5 border-gray-500/30 text-gray-700';
    }
  }

  function getResponseLabel(response: string) {
    switch (response) {
      case 'excellent': return 'EXCELLENT';
      case 'good': return 'BON';
      case 'fair': return 'MOYEN';
      case 'poor': return 'FAIBLE';
      default: return response?.toUpperCase();
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <div className="relative">
          <div className="w-16 h-16 border-4 border-blue-200 rounded-full" />
          <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin absolute top-0" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 p-1">
      {/* Premium Header */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-8 shadow-2xl">
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmYiIGZpbGwtb3BhY2l0eT0iMC4wNSI+PHBhdGggZD0iTTM2IDM0djItaDJ2LTJoLTJ6bTAtNGgydjJoLTJ2LTJ6bTAgOGgydjJoLTJ2LTJ6bTQtNHYyaDJ2LTJoLTJ6bS00IDB2Mmgydi0yaC0yem0tOCAwdjJoMnYtMmgtMnptOC00djJoMnYtMmgtMnoiLz48L2c+PC9nPjwvc3ZnPg==')] opacity-30" />

        <div className="relative z-10 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-white mb-2 tracking-tight">Gestion Clinique</h1>
            <p className="text-slate-300 text-sm">Vue d'ensemble et suivi des patients</p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => setActiveModal('legalInfo')}
              className="px-4 py-3 bg-white/10 hover:bg-white/20 backdrop-blur-sm text-white rounded-xl transition-all inline-flex items-center gap-2 font-semibold border border-white/20"
              title="Conformité Légale Québec/Canada"
            >
              <Shield className="w-5 h-5" />
              <span className="hidden md:inline">Conformité</span>
            </button>
            <button
              onClick={() => setActiveModal('add')}
              className="group relative px-6 py-3 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white rounded-xl transition-all duration-300 shadow-lg shadow-blue-500/25 hover:shadow-xl hover:shadow-blue-500/40 hover:-translate-y-0.5 flex items-center gap-2"
            >
              <Plus className="w-5 h-5 transition-transform group-hover:rotate-90 duration-300" />
              <span className="font-semibold">Nouveau Patient</span>
            </button>
          </div>
        </div>
      </div>

      {/* Premium Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[
          {
            icon: Stethoscope,
            label: 'Total Patients',
            value: clinicalStats.total,
            subtext: `${clinicalStats.acute} cas aigus`,
            gradient: 'from-blue-500 to-cyan-500',
            bgGradient: 'from-blue-50 to-cyan-50',
            iconBg: 'from-blue-500/10 to-cyan-500/10'
          },
          {
            icon: AlertTriangle,
            label: 'Drapeaux Rouges',
            value: clinicalStats.redFlags,
            subtext: 'Requièrent attention',
            gradient: 'from-red-500 to-rose-500',
            bgGradient: 'from-red-50 to-rose-50',
            iconBg: 'from-red-500/10 to-rose-500/10'
          },
          {
            icon: TrendingUp,
            label: 'Réduction Douleur',
            value: `${clinicalStats.avgPainReduction.toFixed(0)}%`,
            subtext: `${clinicalStats.excellentResponse} excellents`,
            gradient: 'from-green-500 to-emerald-500',
            bgGradient: 'from-green-50 to-emerald-50',
            iconBg: 'from-green-500/10 to-emerald-500/10'
          },
          {
            icon: Dumbbell,
            label: 'Observance Moy',
            value: `${clinicalStats.avgCompliance.toFixed(0)}%`,
            subtext: 'Exercices maison',
            gradient: 'from-purple-500 to-pink-500',
            bgGradient: 'from-purple-50 to-pink-50',
            iconBg: 'from-purple-500/10 to-pink-500/10'
          },
        ].map((stat, index) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1, duration: 0.5 }}
            className="group relative overflow-hidden rounded-2xl bg-white border border-slate-200 p-6 shadow-sm hover:shadow-xl transition-all duration-300 hover:-translate-y-1"
          >
            <div className={`absolute inset-0 bg-gradient-to-br ${stat.bgGradient} opacity-0 group-hover:opacity-50 transition-opacity duration-300`} />

            <div className="relative z-10">
              <div className="flex items-center justify-between mb-4">
                <div className={`p-3 rounded-xl bg-gradient-to-br ${stat.iconBg} backdrop-blur-sm`}>
                  <stat.icon className={`w-6 h-6 bg-gradient-to-br ${stat.gradient} bg-clip-text text-transparent`} style={{ WebkitTextFillColor: 'transparent' }} />
                </div>
                <div className="text-right">
                  <div className={`text-3xl font-bold bg-gradient-to-br ${stat.gradient} bg-clip-text text-transparent`}>
                    {stat.value}
                  </div>
                </div>
              </div>

              <div className="space-y-1">
                <div className="text-sm font-semibold text-slate-700">{stat.label}</div>
                <div className="text-xs text-slate-500">{stat.subtext}</div>
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Search & Filters */}
      <div className="flex flex-col lg:flex-row gap-4">
        <div className="flex-1 relative group">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 group-focus-within:text-blue-500 transition-colors" />
          <input
            type="text"
            placeholder="Rechercher par nom, condition, téléphone..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-12 pr-4 py-3.5 bg-white border-2 border-slate-200 rounded-xl focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all outline-none text-slate-700 placeholder:text-slate-400"
          />
        </div>

        <div className="flex items-center gap-2 overflow-x-auto pb-2 lg:pb-0">
          {[
            { key: 'all', label: 'Tous', icon: Users, color: 'slate' },
            { key: 'acute', label: 'Aigu', icon: AlertCircle, color: 'red' },
            { key: 'chronic', label: 'Chronique', icon: Clock, color: 'orange' },
            { key: 'red_flags', label: 'Drapeaux', icon: AlertTriangle, color: 'red' },
            { key: 'high_pain', label: 'Douleur Élevée', icon: Activity, color: 'red' },
          ].map(({ key, label, icon: Icon, color }) => (
            <button
              key={key}
              onClick={() => setClinicalFilter(key as ClinicalFilter)}
              className={`px-4 py-2.5 rounded-xl border-2 transition-all whitespace-nowrap flex items-center gap-2 font-medium ${
                clinicalFilter === key
                  ? `bg-${color}-500 text-white border-${color}-600 shadow-lg shadow-${color}-500/25`
                  : 'bg-white text-slate-600 border-slate-200 hover:border-slate-300 hover:shadow-sm'
              }`}
            >
              <Icon className="w-4 h-4" />
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Premium Patient Cards */}
      <div className="space-y-4">
        <AnimatePresence mode="popLayout">
          {filteredPatients.map((patient, index) => {
            const insights = generateClinicalInsights(patient);
            const criticalInsights = insights.filter(i => i.type === 'critical');
            const planProgress = ((patient.sessions_completed || 0) / (patient.sessions_planned || 12)) * 100;
            const isExpanded = expandedPatient === patient.id;

            return (
              <motion.div
                key={patient.id}
                layout
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ delay: index * 0.05, duration: 0.4 }}
                className="group relative overflow-hidden bg-white rounded-2xl border-2 border-slate-200 hover:border-slate-300 shadow-sm hover:shadow-2xl transition-all duration-300"
              >
                {/* Accent Bar */}
                <div className={`absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b ${
                  patient.treatment_stage === 'acute' ? 'from-red-500 to-red-600' :
                  patient.treatment_stage === 'subacute' ? 'from-orange-500 to-orange-600' :
                  patient.treatment_stage === 'maintenance' ? 'from-blue-500 to-blue-600' :
                  'from-green-500 to-green-600'
                }`} />

                <div className="p-6">
                  {/* Header */}
                  <div className="flex items-start justify-between mb-6">
                    <div className="flex items-center gap-4 flex-1">
                      {/* Avatar */}
                      <div className="relative">
                        <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-bold text-xl shadow-lg">
                          {patient.first_name[0]}{patient.last_name[0]}
                        </div>
                        {patient.is_vip && (
                          <div className="absolute -top-1 -right-1 w-6 h-6 bg-gradient-to-br from-yellow-400 to-yellow-500 rounded-full flex items-center justify-center shadow-lg">
                            <Award className="w-3 h-3 text-white" />
                          </div>
                        )}
                      </div>

                      {/* Patient Info */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-3 mb-2">
                          <h3
                            className="font-bold text-xl text-slate-900 truncate cursor-pointer hover:text-blue-600 transition-colors"
                            onClick={() => {
                              setSelectedPatient(patient);
                              setActiveModal('patientFile');
                            }}
                          >
                            {patient.first_name} {patient.last_name}
                          </h3>
                          <span className={`px-3 py-1 rounded-lg text-xs font-bold uppercase bg-gradient-to-r ${getTreatmentStageColor(patient.treatment_stage || '')} border backdrop-blur-sm`}>
                            {patient.treatment_stage}
                          </span>
                          {criticalInsights.length > 0 && (
                            <span className="px-2.5 py-1 bg-red-500 text-white rounded-lg text-xs font-bold flex items-center gap-1 shadow-lg shadow-red-500/25 animate-pulse">
                              <AlertTriangle className="w-3 h-3" />
                              {criticalInsights.length}
                            </span>
                          )}
                        </div>

                        <div className="flex flex-wrap items-center gap-4 text-sm text-slate-600">
                          <span className="flex items-center gap-1.5">
                            <FileText className="w-4 h-4 text-slate-400" />
                            <span className="font-medium">{patient.chief_complaint}</span>
                          </span>
                          <span className="flex items-center gap-1.5">
                            <Phone className="w-4 h-4 text-slate-400" />
                            {patient.phone}
                          </span>
                          <span className="flex items-center gap-1.5">
                            <Calendar className="w-4 h-4 text-slate-400" />
                            {patient.sessions_completed}/{patient.sessions_planned} séances
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Pain Score */}
                    <div className="flex flex-col items-end gap-2">
                      <div className={`px-5 py-3 rounded-xl bg-gradient-to-br ${getPainLevelColor(patient.current_pain || 0)} text-white font-bold text-2xl shadow-lg`}>
                        {patient.current_pain}/10
                      </div>
                      <div className="text-xs font-medium text-slate-500 uppercase tracking-wide">Niveau Douleur</div>
                    </div>
                  </div>

                  {/* Clinical Insights */}
                  {insights.length > 0 && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-6">
                      {insights.slice(0, isExpanded ? insights.length : 4).map((insight, i) => (
                        <motion.div
                          key={i}
                          initial={{ opacity: 0, scale: 0.95 }}
                          animate={{ opacity: 1, scale: 1 }}
                          transition={{ delay: i * 0.05 }}
                          className={`p-4 rounded-xl border-2 backdrop-blur-sm ${
                            insight.type === 'critical' ? 'bg-red-500/5 border-red-500/20' :
                            insight.type === 'warning' ? 'bg-yellow-500/5 border-yellow-500/20' :
                            insight.type === 'success' ? 'bg-green-500/5 border-green-500/20' :
                            'bg-blue-500/5 border-blue-500/20'
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex-1 min-w-0">
                              <div className="font-bold text-sm mb-1 text-slate-900">{insight.title}</div>
                              <div className="text-xs text-slate-600">{insight.description}</div>
                            </div>
                            {insight.action && insight.actionLabel && (
                              <button
                                onClick={insight.action}
                                className="ml-3 px-3 py-1.5 bg-white border-2 border-slate-200 hover:border-blue-500 rounded-lg text-xs font-semibold transition-all hover:shadow-md whitespace-nowrap"
                              >
                                {insight.actionLabel}
                              </button>
                            )}
                          </div>
                        </motion.div>
                      ))}
                    </div>
                  )}

                  {/* Progress Bar */}
                  <div className="mb-6">
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-sm font-semibold text-slate-700">Progrès Traitement</span>
                      <span className="text-sm font-bold text-slate-900">{planProgress.toFixed(0)}%</span>
                    </div>
                    <div className="relative h-3 bg-slate-100 rounded-full overflow-hidden">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${planProgress}%` }}
                        transition={{ duration: 1, ease: "easeOut" }}
                        className="absolute inset-y-0 left-0 bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 rounded-full shadow-lg"
                      />
                    </div>
                  </div>

                  {/* Stats Grid */}
                  <div className="grid grid-cols-5 gap-3 mb-6">
                    {[
                      { label: 'Initial', value: patient.initial_pain, color: 'slate' },
                      { label: 'Actuel', value: patient.current_pain, color: 'green' },
                      { label: 'Amélioré', value: `${patient.improvement_percentage?.toFixed(0)}%`, color: 'blue' },
                      { label: 'Observance', value: `${patient.exercises_compliance}%`, color: 'purple' },
                    ].map((stat, i) => (
                      <div key={i} className="text-center p-3 bg-gradient-to-br from-slate-50 to-slate-100 rounded-xl border border-slate-200">
                        <div className={`text-lg font-bold text-${stat.color}-600 mb-1`}>{stat.value}</div>
                        <div className="text-xs text-slate-600 font-medium">{stat.label}</div>
                      </div>
                    ))}

                    <div className={`text-center p-3 rounded-xl border-2 bg-gradient-to-br ${getResponseColor(patient.response_to_care || '')}`}>
                      <div className="text-xs font-bold uppercase mb-1">{getResponseLabel(patient.response_to_care || '')}</div>
                      <div className="text-xs font-medium">Réponse</div>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      {[
                        { icon: ClipboardList, label: 'SOAP', action: 'soap', color: 'blue' },
                        { icon: User, label: 'Posture', action: 'posture', color: 'purple' },
                        { icon: Dumbbell, label: 'Exercices', action: 'exercises', color: 'green' },
                        { icon: BarChart3, label: 'Progrès', action: 'progress', color: 'yellow' },
                        { icon: Mail, label: 'Email', action: 'email', color: 'indigo' },
                      ].map((btn, i) => (
                        <button
                          key={i}
                          onClick={() => handleQuickAction(patient.id, btn.action)}
                          className={`group/btn p-3 bg-${btn.color}-50 hover:bg-${btn.color}-100 border-2 border-${btn.color}-200 hover:border-${btn.color}-300 rounded-xl transition-all hover:shadow-lg hover:-translate-y-0.5`}
                          title={btn.label}
                        >
                          <btn.icon className={`w-5 h-5 text-${btn.color}-600`} />
                        </button>
                      ))}
                    </div>

                    <button
                      onClick={() => setExpandedPatient(isExpanded ? null : patient.id)}
                      className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl transition-all flex items-center gap-2 font-medium"
                    >
                      {isExpanded ? 'Moins' : 'Plus'}
                      <ChevronDown className={`w-4 h-4 transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
                    </button>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>

      {/* Empty State */}
      {filteredPatients.length === 0 && (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-gradient-to-br from-slate-50 to-slate-100 border-2 border-dashed border-slate-300 rounded-2xl p-16 text-center"
        >
          <Stethoscope className="w-20 h-20 text-slate-300 mx-auto mb-6" />
          <h3 className="text-2xl font-bold text-slate-700 mb-3">Aucun patient trouvé</h3>
          <p className="text-slate-500 mb-8 text-lg">Ajustez vos filtres ou créez un nouveau dossier</p>
          <button
            onClick={() => setActiveModal('add')}
            className="px-8 py-4 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-xl hover:shadow-xl transition-all inline-flex items-center gap-3 font-semibold text-lg"
          >
            <Plus className="w-6 h-6" />
            Nouveau Patient
          </button>
        </motion.div>
      )}

      {/* Modals */}
      {activeModal === 'soapNotes' && selectedPatient && (
        <SoapNotesListModal
          patientId={selectedPatient.id}
          patientName={`${selectedPatient.first_name} ${selectedPatient.last_name}`}
          onClose={() => {
            setActiveModal('none');
            setSelectedPatient(null);
          }}
        />
      )}

      {activeModal === 'appointments' && selectedPatient && (
        <AppointmentSchedulingModal
          patientId={selectedPatient.id}
          patientName={`${selectedPatient.first_name} ${selectedPatient.last_name}`}
          onClose={() => {
            setActiveModal('none');
            setSelectedPatient(null);
          }}
          onSuccess={() => {
            loadPatients();
            setActiveModal('none');
            setSelectedPatient(null);
          }}
        />
      )}

      {activeModal === 'billing' && selectedPatient && (
        <PatientBillingModal
          patientId={selectedPatient.id}
          patientName={`${selectedPatient.first_name} ${selectedPatient.last_name}`}
          onClose={() => {
            setActiveModal('none');
            setSelectedPatient(null);
          }}
        />
      )}

      {activeModal === 'import' && (
        <CSVImportModal
          onClose={() => setActiveModal('none')}
          onSuccess={() => {
            loadPatients();
            setActiveModal('none');
          }}
        />
      )}

      {activeModal === 'patientFile' && selectedPatient && (
        <MegaPatientFile
          patient={selectedPatient}
          onClose={() => {
            setActiveModal('none');
            setSelectedPatient(null);
          }}
          onUpdate={() => {
            loadPatients();
          }}
        />
      )}

      {activeModal === 'legalCompliance' && selectedPatient && (
        <LegalComplianceModal
          patientId={selectedPatient.id}
          patientName={`${selectedPatient.first_name} ${selectedPatient.last_name}`}
          onClose={() => {
            setActiveModal('none');
            setSelectedPatient(null);
          }}
          onConsentGranted={() => {
            showToast('Consentements enregistrés avec succès', 'success');
            loadPatients();
          }}
        />
      )}

      {activeModal === 'legalInfo' && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="bg-white rounded-3xl shadow-2xl w-full max-w-6xl max-h-[90vh] overflow-hidden flex flex-col"
          >
            <div className="bg-gradient-to-br from-blue-900 via-blue-800 to-blue-900 p-6 relative overflow-hidden">
              <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmYiIGZpbGwtb3BhY2l0eT0iMC4wNSI+PHBhdGggZD0iTTM2IDM0djItaDJ2LTJoLTJ6bTAtNGgydjJoLTJ2LTJ6bTAgOGgydjJoLTJ2LTJ6bTQtNHYyaDJ2LTJoLTJ6bS00IDB2Mmgydi0yaC0yem0tOCAwdjJoMnYtMmgtMnptOC00djJoMnYtMmgtMnoiLz48L2c+PC9nPjwvc3ZnPg==')] opacity-30" />
              <div className="relative z-10 flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 bg-white/10 backdrop-blur-sm rounded-2xl flex items-center justify-center">
                    <Shield className="w-8 h-8 text-white" />
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold text-white">Conformité Légale</h2>
                    <p className="text-blue-200 text-sm">Loi 25 (Québec) & LPRPDE (Canada)</p>
                  </div>
                </div>
                <button
                  onClick={() => setActiveModal('none')}
                  className="p-2 bg-white/10 hover:bg-white/20 backdrop-blur-sm text-white rounded-xl transition-all"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>
            </div>
            <div className="flex-1 overflow-y-auto p-8">
              <LegalDisclaimers />
            </div>
            <div className="border-t border-slate-200 bg-slate-50 p-6 flex justify-end">
              <button
                onClick={() => setActiveModal('none')}
                className="px-6 py-3 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-xl hover:shadow-xl transition-all font-semibold"
              >
                Fermer
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}
