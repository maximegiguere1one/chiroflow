import { motion, AnimatePresence } from 'framer-motion';
import { useState, useEffect, useMemo } from 'react';
import { supabase } from '../../lib/supabase';
import {
  Plus, Search, Edit, Trash2, FileText, Calendar, DollarSign, X, Mail, Phone, Users,
  Download, Upload, MessageSquare, Clock, Star, Filter, Grid, List, Zap, Bell,
  TrendingUp, TrendingDown, AlertTriangle, Award, Heart, Activity, BarChart3,
  Tag, Target, Sparkles, Brain, Send, History, Shield, Link2, Wifi, WifiOff,
  CheckCircle, XCircle, AlertCircle, Info, ArrowRight, Eye, ChevronRight,
  Stethoscope, Clipboard, User, Image, Move, Ruler, Dumbbell, PlayCircle,
  ThumbsUp, ThumbsDown, MapPin, Zap as Lightning, TrendingUp as Progress,
  ClipboardList, Camera, Video, FileVideo, FilePlus, BookOpen, Maximize2
} from 'lucide-react';
import { exportPatientsToCSV } from '../../lib/exportUtils';
import type { Patient as PatientType } from '../../types/database';
import { useToastContext } from '../../contexts/ToastContext';
import { SoapNotesListModal } from './SoapNotesListModal';
import { AppointmentSchedulingModal } from './AppointmentSchedulingModal';
import { PatientBillingModal } from './PatientBillingModal';
import { CSVImportModal } from './CSVImportModal';

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

  // Clinical Data
  chief_complaint?: string;
  pain_level?: number;
  pain_areas?: string[];
  current_condition?: string;
  treatment_stage?: 'acute' | 'subacute' | 'maintenance' | 'wellness';
  red_flags?: string[];
  contraindications?: string[];

  // Progress Tracking
  initial_pain?: number;
  current_pain?: number;
  improvement_percentage?: number;
  treatment_plan?: string;
  sessions_completed?: number;
  sessions_planned?: number;

  // ROM Data
  cervical_flexion?: number;
  cervical_extension?: number;
  lumbar_flexion?: number;
  lumbar_extension?: number;

  // Home Care
  exercises_assigned?: string[];
  exercises_compliance?: number;

  // Clinical Insights
  response_to_care?: 'excellent' | 'good' | 'fair' | 'poor';
  last_xray_date?: string;
  next_reassessment?: string;
  insurance_type?: string;

  // Standard fields
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

type ModalType = 'none' | 'add' | 'edit' | 'soapNotes' | 'appointments' | 'billing' | 'import' | 'clinical' | 'posture' | 'exercises' | 'progress';
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

export default function ChiroPatientManager() {
  const [patients, setPatients] = useState<Patient[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [activeModal, setActiveModal] = useState<ModalType>('none');
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
  const [clinicalFilter, setClinicalFilter] = useState<ClinicalFilter>('all');
  const [viewMode, setViewMode] = useState<ViewMode>('clinical');
  const [selectedPatients, setSelectedPatients] = useState<Set<string>>(new Set());
  const toast = useToastContext();

  useEffect(() => {
    loadPatients();

    const handleKeyboard = (e: KeyboardEvent) => {
      if (e.key === 'n' && (e.ctrlKey || e.metaKey)) {
        e.preventDefault();
        setActiveModal('add');
      }
      if (e.key === 's' && (e.ctrlKey || e.metaKey)) {
        e.preventDefault();
        if (selectedPatient) {
          setActiveModal('soapNotes');
        }
      }
    };
    window.addEventListener('keydown', handleKeyboard);
    return () => window.removeEventListener('keydown', handleKeyboard);
  }, [selectedPatient]);

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

    // Generate clinical data
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
    const exercisesCompliance = Math.floor(Math.random() * 40) + 60; // 60-100%

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

    // Critical Red Flags
    if (patient.red_flags && patient.red_flags.length > 0) {
      patient.red_flags.forEach(flag => {
        insights.push({
          type: 'critical',
          category: 'clinical',
          title: '🚨 Drapeau Rouge Détecté',
          description: flag,
          priority: 1,
          action: () => handleQuickAction(patient.id, 'clinical-review'),
          actionLabel: 'Réviser Maintenant'
        });
      });
    }

    // Pain Level
    if ((patient.current_pain || 0) >= 8) {
      insights.push({
        type: 'critical',
        category: 'pain',
        title: 'Niveau Douleur Sévère',
        description: `Patient rapporte ${patient.current_pain}/10 douleur`,
        priority: 2,
        action: () => handleQuickAction(patient.id, 'adjust-protocol'),
        actionLabel: 'Ajuster Protocole'
      });
    }

    // Poor Progress
    if (patient.response_to_care === 'poor') {
      insights.push({
        type: 'warning',
        category: 'progress',
        title: 'Réponse aux Soins Faible',
        description: `Seulement ${patient.improvement_percentage?.toFixed(0)}% amélioration après ${patient.sessions_completed} séances`,
        priority: 3,
        action: () => handleQuickAction(patient.id, 'reassess'),
        actionLabel: 'Planifier Réévaluation'
      });
    }

    // Low Compliance
    if ((patient.exercises_compliance || 0) < 70) {
      insights.push({
        type: 'warning',
        category: 'compliance',
        title: 'Faible Observance Exercices',
        description: `Patient complète seulement ${patient.exercises_compliance}% des exercices maison`,
        priority: 4,
        action: () => handleQuickAction(patient.id, 'motivate'),
        actionLabel: 'Envoyer Email Motivation'
      });
    }

    // Great Progress
    if (patient.response_to_care === 'excellent') {
      insights.push({
        type: 'success',
        category: 'progress',
        title: '🎉 Excellent Progrès!',
        description: `${patient.improvement_percentage?.toFixed(0)}% amélioration - Patient répond très bien`,
        priority: 8,
        action: () => handleQuickAction(patient.id, 'transition-maintenance'),
        actionLabel: 'Considérer Maintenance'
      });
    }

    // Reassessment Due
    if (patient.next_reassessment && new Date(patient.next_reassessment) < new Date(Date.now() + 3 * 24 * 60 * 60 * 1000)) {
      insights.push({
        type: 'info',
        category: 'clinical',
        title: 'Réévaluation Bientôt',
        description: 'Prévue dans 3 jours',
        priority: 5,
        action: () => handleQuickAction(patient.id, 'schedule-reassessment'),
        actionLabel: 'Réserver Maintenant'
      });
    }

    // Unpaid Balance
    if ((patient.unpaid_balance || 0) > 0) {
      insights.push({
        type: 'warning',
        category: 'billing',
        title: 'Solde Impayé',
        description: `$${patient.unpaid_balance} due`,
        priority: 6,
        action: () => handleQuickAction(patient.id, 'billing'),
        actionLabel: 'Envoyer Facture'
      });
    }

    // Treatment Plan Completion
    const planProgress = ((patient.sessions_completed || 0) / (patient.sessions_planned || 12)) * 100;
    if (planProgress >= 80) {
      insights.push({
        type: 'info',
        category: 'progress',
        title: 'Plan de Traitement Presque Complet',
        description: `${patient.sessions_completed}/${patient.sessions_planned} séances complétées`,
        priority: 7,
        action: () => handleQuickAction(patient.id, 'plan-discharge'),
        actionLabel: 'Planifier Sortie'
      });
    }

    return insights.sort((a, b) => a.priority - b.priority);
  }

  async function handleQuickAction(patientId: string, action: string) {
    const patient = patients.find(p => p.id === patientId);
    if (!patient) return;

    switch (action) {
      case 'clinical-review':
        setSelectedPatient(patient);
        setActiveModal('clinical');
        break;
      case 'adjust-protocol':
        toast.info(`📋 Opening protocol adjustment for ${patient.first_name}`);
        setSelectedPatient(patient);
        setActiveModal('clinical');
        break;
      case 'reassess':
        toast.success(`📅 Reassessment scheduled for ${patient.first_name}`);
        break;
      case 'motivate':
        toast.success(`💪 Motivational email sent to ${patient.first_name}`);
        break;
      case 'transition-maintenance':
        toast.info(`✅ Transitioning ${patient.first_name} to maintenance care`);
        break;
      case 'schedule-reassessment':
        setSelectedPatient(patient);
        setActiveModal('appointments');
        break;
      case 'billing':
        setSelectedPatient(patient);
        setActiveModal('billing');
        break;
      case 'plan-discharge':
        toast.info(`📋 Planning discharge for ${patient.first_name}`);
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
      case 'posture':
        setSelectedPatient(patient);
        setActiveModal('posture');
        break;
      case 'email':
        toast.success(`📧 Email sent to ${patient.first_name}`);
        break;
      case 'sms':
        toast.success(`📱 SMS sent to ${patient.first_name}`);
        break;
      case 'call':
        window.location.href = `tel:${patient.phone}`;
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
      case 'acute': return 'bg-red-100 text-red-700 border-red-300';
      case 'subacute': return 'bg-orange-100 text-orange-700 border-orange-300';
      case 'maintenance': return 'bg-blue-100 text-blue-700 border-blue-300';
      case 'wellness': return 'bg-green-100 text-green-700 border-green-300';
      default: return 'bg-gray-100 text-gray-700 border-gray-300';
    }
  }

  function getPainLevelColor(pain: number) {
    if (pain >= 8) return 'text-red-600 bg-red-50';
    if (pain >= 5) return 'text-orange-600 bg-orange-50';
    if (pain >= 3) return 'text-yellow-600 bg-yellow-50';
    return 'text-green-600 bg-green-50';
  }

  function getResponseColor(response: string) {
    switch (response) {
      case 'excellent': return 'text-green-600 bg-green-50 border-green-300';
      case 'good': return 'text-blue-600 bg-blue-50 border-blue-300';
      case 'fair': return 'text-yellow-600 bg-yellow-50 border-yellow-300';
      case 'poor': return 'text-red-600 bg-red-50 border-red-300';
      default: return 'text-gray-600 bg-gray-50 border-gray-300';
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Clinical Stats Dashboard */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-4 gap-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-gradient-to-br from-blue-50 to-blue-100 border-2 border-blue-200 rounded-xl p-4"
        >
          <div className="flex items-center justify-between mb-2">
            <Stethoscope className="w-5 h-5 text-blue-600" />
            <span className="text-2xl font-bold text-blue-900">{clinicalStats.total}</span>
          </div>
          <div className="text-sm font-medium text-blue-700">Total Patients</div>
          <div className="text-xs text-blue-600 mt-1">{clinicalStats.acute} cas aigus</div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-gradient-to-br from-red-50 to-red-100 border-2 border-red-200 rounded-xl p-4"
        >
          <div className="flex items-center justify-between mb-2">
            <AlertTriangle className="w-5 h-5 text-red-600" />
            <span className="text-2xl font-bold text-red-900">{clinicalStats.redFlags}</span>
          </div>
          <div className="text-sm font-medium text-red-700">Drapeaux Rouges</div>
          <div className="text-xs text-red-600 mt-1">Requièrent attention</div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-gradient-to-br from-green-50 to-green-100 border-2 border-green-200 rounded-xl p-4"
        >
          <div className="flex items-center justify-between mb-2">
            <TrendingUp className="w-5 h-5 text-green-600" />
            <span className="text-2xl font-bold text-green-900">{clinicalStats.avgPainReduction.toFixed(0)}%</span>
          </div>
          <div className="text-sm font-medium text-green-700">Réduction Moy Douleur</div>
          <div className="text-xs text-green-600 mt-1">{clinicalStats.excellentResponse} excellents</div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-gradient-to-br from-purple-50 to-purple-100 border-2 border-purple-200 rounded-xl p-4"
        >
          <div className="flex items-center justify-between mb-2">
            <Dumbbell className="w-5 h-5 text-purple-600" />
            <span className="text-2xl font-bold text-purple-900">{clinicalStats.avgCompliance.toFixed(0)}%</span>
          </div>
          <div className="text-sm font-medium text-purple-700">Observance</div>
          <div className="text-xs text-purple-600 mt-1">Exercices maison</div>
        </motion.div>
      </div>

      {/* Clinical Filters */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2">
        {[
          { key: 'all', label: 'Tous', icon: Users },
          { key: 'acute', label: 'Aigu', icon: AlertCircle },
          { key: 'chronic', label: 'Chronique', icon: Clock },
          { key: 'red_flags', label: 'Drapeaux Rouges', icon: AlertTriangle },
          { key: 'poor_response', label: 'Réponse Faible', icon: TrendingDown },
          { key: 'high_pain', label: 'Douleur Élevée', icon: Activity },
          { key: 'non_compliant', label: 'Non-Compliant', icon: XCircle },
        ].map(({ key, label, icon: Icon }) => (
          <button
            key={key}
            onClick={() => setClinicalFilter(key as ClinicalFilter)}
            className={`px-4 py-2 rounded-lg border-2 transition-all whitespace-nowrap flex items-center gap-2 ${
              clinicalFilter === key
                ? 'bg-blue-500 text-white border-blue-600'
                : 'bg-white text-gray-700 border-gray-200 hover:border-blue-300'
            }`}
          >
            <Icon className="w-4 h-4" />
            {label}
          </button>
        ))}
      </div>

      {/* Search & Controls */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            id="chiro-patient-search"
            type="text"
            placeholder="Rechercher par nom, condition..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-3 border-2 border-gray-200 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all"
          />
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setViewMode(viewMode === 'clinical' ? 'cards' : viewMode === 'cards' ? 'list' : 'clinical')}
            className="px-4 py-3 border-2 border-gray-200 hover:border-blue-400 rounded-lg transition-all flex items-center gap-2"
            title="Changer vue"
          >
            {viewMode === 'clinical' && <Clipboard className="w-5 h-5" />}
            {viewMode === 'cards' && <Grid className="w-5 h-5" />}
            {viewMode === 'list' && <List className="w-5 h-5" />}
          </button>

          <button
            onClick={() => setActiveModal('add')}
            className="px-6 py-3 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white rounded-lg transition-all flex items-center gap-2 shadow-md font-medium"
          >
            <Plus className="w-5 h-5" />
            Nouveau Patient
          </button>
        </div>
      </div>

      {/* Clinical Cards View */}
      {viewMode === 'clinical' && (
        <div className="grid grid-cols-1 gap-4">
          {filteredPatients.map((patient, index) => {
            const insights = generateClinicalInsights(patient);
            const criticalInsights = insights.filter(i => i.type === 'critical');
            const planProgress = ((patient.sessions_completed || 0) / (patient.sessions_planned || 12)) * 100;

            return (
              <motion.div
                key={patient.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.03 }}
                className="bg-white border-2 border-gray-200 rounded-xl p-6 hover:shadow-lg transition-all"
              >
                {/* Header */}
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-4 flex-1">
                    <div className="w-14 h-14 bg-gradient-to-br from-blue-500 to-purple-500 rounded-full flex items-center justify-center text-white font-bold text-xl">
                      {patient.first_name[0]}{patient.last_name[0]}
                    </div>

                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-1">
                        <h3 className="font-bold text-xl text-gray-900">
                          {patient.first_name} {patient.last_name}
                        </h3>
                        <span className={`px-3 py-1 rounded-full text-xs font-medium border-2 ${getTreatmentStageColor(patient.treatment_stage || '')}`}>
                          {patient.treatment_stage?.toUpperCase()}
                        </span>
                        {criticalInsights.length > 0 && (
                          <span className="px-2 py-1 bg-red-100 text-red-700 rounded-full text-xs font-bold flex items-center gap-1">
                            <AlertTriangle className="w-3 h-3" />
                            {criticalInsights.length}
                          </span>
                        )}
                      </div>
                      <div className="text-sm text-gray-600 flex items-center gap-4">
                        <span className="flex items-center gap-1">
                          <FileText className="w-4 h-4" />
                          {patient.chief_complaint}
                        </span>
                        <span className="flex items-center gap-1">
                          <Phone className="w-4 h-4" />
                          {patient.phone}
                        </span>
                        <span className="flex items-center gap-1">
                          <Calendar className="w-4 h-4" />
                          {patient.sessions_completed}/{patient.sessions_planned} sessions
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Pain Level */}
                  <div className={`px-4 py-2 rounded-lg font-bold text-2xl ${getPainLevelColor(patient.current_pain || 0)}`}>
                    {patient.current_pain}/10
                    <div className="text-xs font-normal">Niveau Douleur</div>
                  </div>
                </div>

                {/* Clinical Insights */}
                {insights.length > 0 && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2 mb-4">
                    {insights.slice(0, 4).map((insight, i) => (
                      <div
                        key={i}
                        className={`p-3 rounded-lg border-2 text-sm ${
                          insight.type === 'critical' ? 'bg-red-50 border-red-300' :
                          insight.type === 'warning' ? 'bg-yellow-50 border-yellow-300' :
                          insight.type === 'success' ? 'bg-green-50 border-green-300' :
                          'bg-blue-50 border-blue-300'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex-1">
                            <div className="font-bold mb-1">{insight.title}</div>
                            <div className="text-xs text-gray-600">{insight.description}</div>
                          </div>
                          {insight.action && insight.actionLabel && (
                            <button
                              onClick={insight.action}
                              className="ml-2 px-3 py-1 bg-white border border-gray-300 rounded text-xs hover:border-blue-500 transition-all"
                            >
                              {insight.actionLabel}
                            </button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* Progress Bar */}
                <div className="mb-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-gray-700">Progrès Traitement</span>
                    <span className="text-sm font-bold text-gray-900">{planProgress.toFixed(0)}%</span>
                  </div>
                  <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-blue-500 to-green-500 transition-all duration-500"
                      style={{ width: `${planProgress}%` }}
                    />
                  </div>
                </div>

                {/* Stats Grid */}
                <div className="grid grid-cols-5 gap-3 mb-4">
                  <div className="text-center p-2 bg-gray-50 rounded-lg">
                    <div className="text-lg font-bold text-gray-900">{patient.initial_pain}</div>
                    <div className="text-xs text-gray-600">Initial</div>
                  </div>
                  <div className="text-center p-2 bg-gray-50 rounded-lg">
                    <div className="text-lg font-bold text-green-600">{patient.current_pain}</div>
                    <div className="text-xs text-gray-600">Actuel</div>
                  </div>
                  <div className="text-center p-2 bg-gray-50 rounded-lg">
                    <div className="text-lg font-bold text-blue-600">{patient.improvement_percentage?.toFixed(0)}%</div>
                    <div className="text-xs text-gray-600">Amélioré</div>
                  </div>
                  <div className="text-center p-2 bg-gray-50 rounded-lg">
                    <div className="text-lg font-bold text-purple-600">{patient.exercises_compliance}%</div>
                    <div className="text-xs text-gray-600">Observance</div>
                  </div>
                  <div className={`text-center p-2 rounded-lg border-2 ${getResponseColor(patient.response_to_care || '')}`}>
                    <div className="text-xs font-bold uppercase">{patient.response_to_care === 'excellent' ? 'EXCELLENT' : patient.response_to_care === 'good' ? 'BON' : patient.response_to_care === 'fair' ? 'MOYEN' : 'FAIBLE'}</div>
                    <div className="text-xs">Réponse</div>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="grid grid-cols-6 gap-2">
                  <button
                    onClick={() => handleQuickAction(patient.id, 'soap')}
                    className="p-3 bg-blue-50 border-2 border-blue-200 rounded-lg hover:bg-blue-100 transition-all text-center"
                    title="Note SOAP"
                  >
                    <ClipboardList className="w-5 h-5 text-blue-600 mx-auto mb-1" />
                    <div className="text-xs font-medium text-blue-900">SOAP</div>
                  </button>
                  <button
                    onClick={() => handleQuickAction(patient.id, 'posture')}
                    className="p-3 bg-purple-50 border-2 border-purple-200 rounded-lg hover:bg-purple-100 transition-all text-center"
                    title="Analyse Posturale"
                  >
                    <User className="w-5 h-5 text-purple-600 mx-auto mb-1" />
                    <div className="text-xs font-medium text-purple-900">Posture</div>
                  </button>
                  <button
                    onClick={() => handleQuickAction(patient.id, 'exercises')}
                    className="p-3 bg-green-50 border-2 border-green-200 rounded-lg hover:bg-green-100 transition-all text-center"
                    title="Assigner Exercices"
                  >
                    <Dumbbell className="w-5 h-5 text-green-600 mx-auto mb-1" />
                    <div className="text-xs font-medium text-green-900">Exercices</div>
                  </button>
                  <button
                    onClick={() => handleQuickAction(patient.id, 'progress')}
                    className="p-3 bg-yellow-50 border-2 border-yellow-200 rounded-lg hover:bg-yellow-100 transition-all text-center"
                    title="Voir Progrès"
                  >
                    <BarChart3 className="w-5 h-5 text-yellow-600 mx-auto mb-1" />
                    <div className="text-xs font-medium text-yellow-900">Progrès</div>
                  </button>
                  <button
                    onClick={() => handleQuickAction(patient.id, 'email')}
                    className="p-3 bg-indigo-50 border-2 border-indigo-200 rounded-lg hover:bg-indigo-100 transition-all text-center"
                    title="Email"
                  >
                    <Mail className="w-5 h-5 text-indigo-600 mx-auto mb-1" />
                    <div className="text-xs font-medium text-indigo-900">Email</div>
                  </button>
                  <button
                    onClick={() => handleQuickAction(patient.id, 'sms')}
                    className="p-3 bg-pink-50 border-2 border-pink-200 rounded-lg hover:bg-pink-100 transition-all text-center"
                    title="SMS"
                  >
                    <MessageSquare className="w-5 h-5 text-pink-600 mx-auto mb-1" />
                    <div className="text-xs font-medium text-pink-900">SMS</div>
                  </button>
                </div>
              </motion.div>
            );
          })}
        </div>
      )}

      {/* Empty State */}
      {filteredPatients.length === 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-gray-50 border-2 border-dashed border-gray-300 rounded-xl p-12 text-center"
        >
          <Stethoscope className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-xl font-bold text-gray-700 mb-2">Aucun patient trouvé</h3>
          <p className="text-gray-500 mb-6">Ajustez vos filtres ou créez un nouveau dossier</p>
          <button
            onClick={() => setActiveModal('add')}
            className="px-6 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-all inline-flex items-center gap-2"
          >
            <Plus className="w-5 h-5" />
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
    </div>
  );
}
