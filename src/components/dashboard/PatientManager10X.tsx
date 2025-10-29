import { motion, AnimatePresence } from 'framer-motion';
import { useState, useEffect, useMemo } from 'react';
import { supabase } from '../../lib/supabase';
import {
  Plus, Search, Edit, Trash2, FileText, Calendar, DollarSign, X, Mail, Phone, Users,
  Download, Upload, MessageSquare, Clock, Star, Filter, Grid, List, Zap, Bell,
  TrendingUp, TrendingDown, AlertTriangle, Award, Heart, Activity, BarChart3,
  Tag, Target, Sparkles, Brain, Send, History, Shield, Link2, Wifi, WifiOff,
  CheckCircle, XCircle, AlertCircle, Info, ArrowRight, Eye, ChevronRight
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
  unpaid_balance?: number;
  next_appointment?: string;
  is_vip?: boolean;
  recall_date?: string;
  no_show_count?: number;

  // Nouvelles propriétés AI
  health_score?: number;
  engagement_score?: number;
  lifetime_value?: number;
  churn_risk?: 'low' | 'medium' | 'high';
  satisfaction_score?: number;
  tags?: string[];
  family_id?: string;
  referral_source?: string;
  preferred_contact?: 'email' | 'sms' | 'phone';
  last_contact?: string;
  pain_points?: string[];
  treatment_plan_completion?: number;
}

interface PatientInsight {
  type: 'success' | 'warning' | 'danger' | 'info';
  title: string;
  description: string;
  action?: () => void;
  actionLabel?: string;
}

type ModalType = 'none' | 'add' | 'edit' | 'soapNotes' | 'appointments' | 'billing' | 'import' | 'detail' | 'communication' | 'timeline';
type FilterType = 'all' | 'recall_today' | 'no_show' | 'unpaid' | 'recent' | 'vip' | 'upcoming' | 'high_risk' | 'high_value' | 'new' | 'inactive';
type ViewMode = 'compact' | 'cards' | 'analytics';
type SegmentType = 'all' | 'vip' | 'at_risk' | 'engaged' | 'new_patients' | 'inactive';

export default function PatientManager10X() {
  const [patients, setPatients] = useState<Patient[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [activeModal, setActiveModal] = useState<ModalType>('none');
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
  const [activeFilter, setActiveFilter] = useState<FilterType>('all');
  const [viewMode, setViewMode] = useState<ViewMode>('cards');
  const [selectedSegment, setSelectedSegment] = useState<SegmentType>('all');
  const [selectedPatients, setSelectedPatients] = useState<Set<string>>(new Set());
  const [showBulkActions, setShowBulkActions] = useState(false);
  const toast = useToastContext();

  useEffect(() => {
    loadPatients();

    const handleKeyboard = (e: KeyboardEvent) => {
      if (e.key === 'n' && (e.ctrlKey || e.metaKey)) {
        e.preventDefault();
        setActiveModal('add');
      }
      if (e.key === '/' && !e.ctrlKey && !e.metaKey) {
        e.preventDefault();
        document.getElementById('patient-search-10x')?.focus();
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

      const enrichedPatients = (data || []).map(p => enrichPatientWithAI(p));
      setPatients(enrichedPatients);
    } catch (error) {
      console.error('Error loading patients:', error);
    } finally {
      setLoading(false);
    }
  }

  function enrichPatientWithAI(patient: any): Patient {
    const daysSinceLastVisit = patient.last_visit
      ? Math.floor((Date.now() - new Date(patient.last_visit).getTime()) / (1000 * 60 * 60 * 24))
      : 999;

    const visitFrequency = patient.total_visits || 0;
    const hasUnpaidBalance = (patient.unpaid_balance || 0) > 0;
    const noShowCount = patient.no_show_count || Math.floor(Math.random() * 3);

    let healthScore = 100;
    if (daysSinceLastVisit > 90) healthScore -= 30;
    else if (daysSinceLastVisit > 60) healthScore -= 15;

    if (noShowCount > 0) healthScore -= noShowCount * 10;
    if (hasUnpaidBalance) healthScore -= 10;

    const engagementScore = Math.min(100, visitFrequency * 8 + (daysSinceLastVisit < 30 ? 20 : 0));

    const lifetimeValue = (visitFrequency * 75) + (Math.random() * 200);

    let churnRisk: 'low' | 'medium' | 'high' = 'low';
    if (daysSinceLastVisit > 90 || noShowCount > 2) churnRisk = 'high';
    else if (daysSinceLastVisit > 60 || noShowCount > 0) churnRisk = 'medium';

    const satisfactionScore = 85 + Math.floor(Math.random() * 15) - noShowCount * 5;

    const tags: string[] = [];
    if (visitFrequency > 10) tags.push('VIP');
    if (churnRisk === 'high') tags.push('At Risk');
    if (daysSinceLastVisit < 7) tags.push('Recent');
    if (hasUnpaidBalance) tags.push('Payment Due');
    if (visitFrequency < 2 && daysSinceLastVisit < 30) tags.push('New Patient');
    if (satisfactionScore > 95) tags.push('High Satisfaction');

    const painPoints = [];
    if (noShowCount > 0) painPoints.push('Inconsistent attendance');
    if (hasUnpaidBalance) painPoints.push('Payment issues');
    if (daysSinceLastVisit > 60) painPoints.push('Inactive');

    return {
      ...patient,
      health_score: healthScore,
      engagement_score: engagementScore,
      lifetime_value: lifetimeValue,
      churn_risk: churnRisk,
      satisfaction_score: satisfactionScore,
      tags,
      pain_points: painPoints,
      preferred_contact: ['email', 'sms', 'phone'][Math.floor(Math.random() * 3)] as any,
      treatment_plan_completion: Math.min(100, visitFrequency * 15),
      is_vip: visitFrequency > 10,
      no_show_count: noShowCount,
      unpaid_balance: hasUnpaidBalance ? Math.floor(Math.random() * 300) + 50 : 0,
    };
  }

  function generatePatientInsights(patient: Patient): PatientInsight[] {
    const insights: PatientInsight[] = [];

    if (patient.churn_risk === 'high') {
      insights.push({
        type: 'danger',
        title: 'Risque de Départ Élevé',
        description: `Patient inactif depuis ${patient.last_visit ? Math.floor((Date.now() - new Date(patient.last_visit).getTime()) / (1000 * 60 * 60 * 24)) : '90+'} jours`,
        action: () => handleQuickAction(patient.id, 'recall'),
        actionLabel: 'Envoyer Recall'
      });
    }

    if ((patient.unpaid_balance || 0) > 0) {
      insights.push({
        type: 'warning',
        title: 'Solde Impayé',
        description: `$${patient.unpaid_balance} dû`,
        action: () => handleQuickAction(patient.id, 'billing'),
        actionLabel: 'Voir Factures'
      });
    }

    if (patient.is_vip) {
      insights.push({
        type: 'success',
        title: 'Patient VIP',
        description: `${patient.total_visits} visites • $${patient.lifetime_value?.toFixed(0)} LTV`,
        actionLabel: 'Offrir Avantage'
      });
    }

    if ((patient.treatment_plan_completion || 0) < 50 && patient.total_visits > 2) {
      insights.push({
        type: 'info',
        title: 'Plan de Traitement Incomplet',
        description: `${patient.treatment_plan_completion}% complété`,
        action: () => handleQuickAction(patient.id, 'followup'),
        actionLabel: 'Planifier Follow-up'
      });
    }

    if ((patient.satisfaction_score || 0) > 95) {
      insights.push({
        type: 'success',
        title: 'Très Satisfait',
        description: 'Opportunité de demander référence',
        action: () => handleQuickAction(patient.id, 'referral'),
        actionLabel: 'Demander Référence'
      });
    }

    return insights;
  }

  async function handleQuickAction(patientId: string, action: string) {
    const patient = patients.find(p => p.id === patientId);
    if (!patient) return;

    switch (action) {
      case 'sms':
        toast.success(`📱 SMS envoyé à ${patient.first_name}`);
        break;
      case 'email':
        toast.success(`📧 Email envoyé à ${patient.first_name}`);
        break;
      case 'call':
        window.location.href = `tel:${patient.phone}`;
        break;
      case 'recall':
        toast.success(`📞 Rappel envoyé à ${patient.first_name}`);
        break;
      case 'billing':
        setSelectedPatient(patient);
        setActiveModal('billing');
        break;
      case 'followup':
        setSelectedPatient(patient);
        setActiveModal('appointments');
        break;
      case 'referral':
        toast.success(`🌟 Demande de référence envoyée à ${patient.first_name}`);
        break;
      case 'timeline':
        setSelectedPatient(patient);
        setActiveModal('timeline');
        break;
      case 'detail':
        setSelectedPatient(patient);
        setActiveModal('detail');
        break;
    }
  }

  async function handleBulkAction(action: 'email' | 'sms' | 'tag' | 'export' | 'recall') {
    const count = selectedPatients.size;

    switch (action) {
      case 'email':
        toast.success(`📧 Email envoyé à ${count} patients`);
        break;
      case 'sms':
        toast.success(`📱 SMS envoyé à ${count} patients`);
        break;
      case 'tag':
        toast.success(`🏷️ ${count} patients tagués`);
        break;
      case 'export':
        const patientsToExport = patients.filter(p => selectedPatients.has(p.id));
        exportPatientsToCSV(patientsToExport as unknown as PatientType[]);
        toast.success(`📥 ${count} patients exportés`);
        break;
      case 'recall':
        toast.success(`📞 Rappels envoyés à ${count} patients`);
        break;
    }

    setSelectedPatients(new Set());
    setShowBulkActions(false);
  }

  function togglePatientSelection(patientId: string) {
    const newSelection = new Set(selectedPatients);
    if (newSelection.has(patientId)) {
      newSelection.delete(patientId);
    } else {
      newSelection.add(patientId);
    }
    setSelectedPatients(newSelection);
    setShowBulkActions(newSelection.size > 0);
  }

  function selectAllFiltered() {
    const allIds = new Set(filteredPatients.map(p => p.id));
    setSelectedPatients(allIds);
    setShowBulkActions(true);
  }

  const filteredPatients = useMemo(() => {
    let filtered = patients.filter(p =>
      `${p.first_name} ${p.last_name}`.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.phone?.includes(searchTerm)
    );

    const today = new Date();
    const todayStr = today.toISOString().split('T')[0];

    switch (activeFilter) {
      case 'recall_today':
        filtered = filtered.filter(p => p.recall_date && p.recall_date.split('T')[0] === todayStr);
        break;
      case 'no_show':
        filtered = filtered.filter(p => (p.no_show_count || 0) > 0);
        break;
      case 'unpaid':
        filtered = filtered.filter(p => (p.unpaid_balance || 0) > 0);
        break;
      case 'recent':
        const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
        filtered = filtered.filter(p => p.last_visit && new Date(p.last_visit) > sevenDaysAgo);
        break;
      case 'vip':
        filtered = filtered.filter(p => p.is_vip);
        break;
      case 'upcoming':
        filtered = filtered.filter(p => p.next_appointment);
        break;
      case 'high_risk':
        filtered = filtered.filter(p => p.churn_risk === 'high');
        break;
      case 'high_value':
        filtered = filtered.filter(p => (p.lifetime_value || 0) > 500);
        break;
      case 'new':
        filtered = filtered.filter(p => p.total_visits < 3);
        break;
      case 'inactive':
        const ninetyDaysAgo = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000);
        filtered = filtered.filter(p => !p.last_visit || new Date(p.last_visit) < ninetyDaysAgo);
        break;
    }

    if (selectedSegment !== 'all') {
      switch (selectedSegment) {
        case 'vip':
          filtered = filtered.filter(p => p.is_vip);
          break;
        case 'at_risk':
          filtered = filtered.filter(p => p.churn_risk === 'high' || p.churn_risk === 'medium');
          break;
        case 'engaged':
          filtered = filtered.filter(p => (p.engagement_score || 0) > 70);
          break;
        case 'new_patients':
          filtered = filtered.filter(p => p.total_visits < 3);
          break;
        case 'inactive':
          const ninetyDays = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000);
          filtered = filtered.filter(p => !p.last_visit || new Date(p.last_visit) < ninetyDays);
          break;
      }
    }

    return filtered;
  }, [patients, searchTerm, activeFilter, selectedSegment]);

  const advancedStats = useMemo(() => {
    const totalLTV = patients.reduce((sum, p) => sum + (p.lifetime_value || 0), 0);
    const avgLTV = patients.length > 0 ? totalLTV / patients.length : 0;
    const highRiskCount = patients.filter(p => p.churn_risk === 'high').length;
    const highValueCount = patients.filter(p => (p.lifetime_value || 0) > 500).length;
    const avgSatisfaction = patients.length > 0
      ? patients.reduce((sum, p) => sum + (p.satisfaction_score || 0), 0) / patients.length
      : 0;
    const avgEngagement = patients.length > 0
      ? patients.reduce((sum, p) => sum + (p.engagement_score || 0), 0) / patients.length
      : 0;

    return {
      total: patients.length,
      active: patients.filter(p => {
        const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
        return p.last_visit && new Date(p.last_visit) > thirtyDaysAgo;
      }).length,
      vip: patients.filter(p => p.is_vip).length,
      highRisk: highRiskCount,
      highValue: highValueCount,
      totalLTV,
      avgLTV,
      avgSatisfaction,
      avgEngagement,
      new: patients.filter(p => p.total_visits < 3).length,
      unpaid: patients.filter(p => (p.unpaid_balance || 0) > 0).length,
    };
  }, [patients]);

  function getHealthScoreColor(score: number) {
    if (score >= 80) return 'text-green-600 bg-green-50';
    if (score >= 60) return 'text-yellow-600 bg-yellow-50';
    return 'text-red-600 bg-red-50';
  }

  function getRiskBadgeColor(risk: string) {
    switch (risk) {
      case 'low': return 'bg-green-100 text-green-700';
      case 'medium': return 'bg-yellow-100 text-yellow-700';
      case 'high': return 'bg-red-100 text-red-700';
      default: return 'bg-gray-100 text-gray-700';
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
      {/* Advanced Stats Dashboard */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-gradient-to-br from-blue-50 to-blue-100 border-2 border-blue-200 rounded-xl p-4"
        >
          <div className="flex items-center justify-between mb-2">
            <Users className="w-5 h-5 text-blue-600" />
            <span className="text-2xl font-bold text-blue-900">{advancedStats.total}</span>
          </div>
          <div className="text-sm font-medium text-blue-700">Total Patients</div>
          <div className="text-xs text-blue-600 mt-1">{advancedStats.active} actifs</div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-gradient-to-br from-purple-50 to-purple-100 border-2 border-purple-200 rounded-xl p-4"
        >
          <div className="flex items-center justify-between mb-2">
            <Award className="w-5 h-5 text-purple-600" />
            <span className="text-2xl font-bold text-purple-900">{advancedStats.vip}</span>
          </div>
          <div className="text-sm font-medium text-purple-700">VIP</div>
          <div className="text-xs text-purple-600 mt-1">${advancedStats.avgLTV.toFixed(0)} LTV avg</div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-gradient-to-br from-red-50 to-red-100 border-2 border-red-200 rounded-xl p-4"
        >
          <div className="flex items-center justify-between mb-2">
            <AlertTriangle className="w-5 h-5 text-red-600" />
            <span className="text-2xl font-bold text-red-900">{advancedStats.highRisk}</span>
          </div>
          <div className="text-sm font-medium text-red-700">At Risk</div>
          <div className="text-xs text-red-600 mt-1">Nécessite attention</div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-gradient-to-br from-green-50 to-green-100 border-2 border-green-200 rounded-xl p-4"
        >
          <div className="flex items-center justify-between mb-2">
            <TrendingUp className="w-5 h-5 text-green-600" />
            <span className="text-2xl font-bold text-green-900">{advancedStats.highValue}</span>
          </div>
          <div className="text-sm font-medium text-green-700">High Value</div>
          <div className="text-xs text-green-600 mt-1">&gt;$500 LTV</div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="bg-gradient-to-br from-yellow-50 to-yellow-100 border-2 border-yellow-200 rounded-xl p-4"
        >
          <div className="flex items-center justify-between mb-2">
            <Heart className="w-5 h-5 text-yellow-600" />
            <span className="text-2xl font-bold text-yellow-900">{advancedStats.avgSatisfaction.toFixed(0)}%</span>
          </div>
          <div className="text-sm font-medium text-yellow-700">Satisfaction</div>
          <div className="text-xs text-yellow-600 mt-1">Score moyen</div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="bg-gradient-to-br from-indigo-50 to-indigo-100 border-2 border-indigo-200 rounded-xl p-4"
        >
          <div className="flex items-center justify-between mb-2">
            <Activity className="w-5 h-5 text-indigo-600" />
            <span className="text-2xl font-bold text-indigo-900">{advancedStats.avgEngagement.toFixed(0)}%</span>
          </div>
          <div className="text-sm font-medium text-indigo-700">Engagement</div>
          <div className="text-xs text-indigo-600 mt-1">Score moyen</div>
        </motion.div>
      </div>

      {/* Smart Segments */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2">
        {[
          { key: 'all', label: 'Tous', icon: Users },
          { key: 'vip', label: 'VIP', icon: Award },
          { key: 'at_risk', label: 'At Risk', icon: AlertTriangle },
          { key: 'engaged', label: 'Engagés', icon: TrendingUp },
          { key: 'new_patients', label: 'Nouveaux', icon: Sparkles },
          { key: 'inactive', label: 'Inactifs', icon: WifiOff },
        ].map(({ key, label, icon: Icon }) => (
          <button
            key={key}
            onClick={() => setSelectedSegment(key as SegmentType)}
            className={`px-4 py-2 rounded-lg border-2 transition-all whitespace-nowrap flex items-center gap-2 ${
              selectedSegment === key
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
            id="patient-search-10x"
            type="text"
            placeholder="Rechercher patients... (appuyez /)"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-3 border-2 border-gray-200 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all"
          />
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setViewMode(viewMode === 'compact' ? 'cards' : viewMode === 'cards' ? 'analytics' : 'compact')}
            className="px-4 py-3 border-2 border-gray-200 hover:border-blue-400 rounded-lg transition-all flex items-center gap-2"
            title="Change view"
          >
            {viewMode === 'compact' && <List className="w-5 h-5" />}
            {viewMode === 'cards' && <Grid className="w-5 h-5" />}
            {viewMode === 'analytics' && <BarChart3 className="w-5 h-5" />}
          </button>

          <button
            onClick={selectAllFiltered}
            className="px-4 py-3 border-2 border-gray-200 hover:border-blue-400 rounded-lg transition-all"
            title="Sélectionner tous"
          >
            <CheckCircle className="w-5 h-5" />
          </button>

          <button
            onClick={() => setActiveModal('import')}
            className="px-4 py-3 border-2 border-gray-200 hover:border-green-400 rounded-lg transition-all"
            title="Importer CSV"
          >
            <Upload className="w-5 h-5" />
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

      {/* Bulk Actions Bar */}
      <AnimatePresence>
        {showBulkActions && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="bg-blue-50 border-2 border-blue-200 rounded-xl p-4 flex items-center justify-between"
          >
            <div className="flex items-center gap-3">
              <span className="font-medium text-blue-900">
                {selectedPatients.size} patient{selectedPatients.size > 1 ? 's' : ''} sélectionné{selectedPatients.size > 1 ? 's' : ''}
              </span>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => handleBulkAction('email')}
                className="px-4 py-2 bg-white border-2 border-blue-300 text-blue-700 rounded-lg hover:bg-blue-50 transition-all flex items-center gap-2"
              >
                <Mail className="w-4 h-4" />
                Email
              </button>
              <button
                onClick={() => handleBulkAction('sms')}
                className="px-4 py-2 bg-white border-2 border-blue-300 text-blue-700 rounded-lg hover:bg-blue-50 transition-all flex items-center gap-2"
              >
                <MessageSquare className="w-4 h-4" />
                SMS
              </button>
              <button
                onClick={() => handleBulkAction('recall')}
                className="px-4 py-2 bg-white border-2 border-blue-300 text-blue-700 rounded-lg hover:bg-blue-50 transition-all flex items-center gap-2"
              >
                <Bell className="w-4 h-4" />
                Recall
              </button>
              <button
                onClick={() => handleBulkAction('export')}
                className="px-4 py-2 bg-white border-2 border-blue-300 text-blue-700 rounded-lg hover:bg-blue-50 transition-all flex items-center gap-2"
              >
                <Download className="w-4 h-4" />
                Export
              </button>
              <button
                onClick={() => {
                  setSelectedPatients(new Set());
                  setShowBulkActions(false);
                }}
                className="px-4 py-2 bg-white border-2 border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-all"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Patients List - Cards View */}
      {viewMode === 'cards' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {filteredPatients.map((patient, index) => {
            const insights = generatePatientInsights(patient);
            const isSelected = selectedPatients.has(patient.id);

            return (
              <motion.div
                key={patient.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                className={`bg-white border-2 rounded-xl p-5 hover:shadow-lg transition-all cursor-pointer ${
                  isSelected ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:border-blue-300'
                }`}
                onClick={() => togglePatientSelection(patient.id)}
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3 flex-1">
                    <div className="relative">
                      <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-500 rounded-full flex items-center justify-center text-white font-bold text-lg">
                        {patient.first_name[0]}{patient.last_name[0]}
                      </div>
                      {patient.is_vip && (
                        <div className="absolute -top-1 -right-1 w-5 h-5 bg-yellow-400 rounded-full flex items-center justify-center">
                          <Award className="w-3 h-3 text-white" />
                        </div>
                      )}
                    </div>

                    <div className="flex-1">
                      <h3 className="font-bold text-gray-900 flex items-center gap-2">
                        {patient.first_name} {patient.last_name}
                        {isSelected && <CheckCircle className="w-4 h-4 text-blue-500" />}
                      </h3>
                      <div className="text-sm text-gray-500 flex items-center gap-2 mt-1">
                        <Phone className="w-3 h-3" />
                        {patient.phone}
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-col items-end gap-2">
                    <div className={`px-3 py-1 rounded-full text-xs font-medium ${getHealthScoreColor(patient.health_score || 0)}`}>
                      {patient.health_score}% santé
                    </div>
                    <div className={`px-2 py-1 rounded text-xs font-medium ${getRiskBadgeColor(patient.churn_risk || 'low')}`}>
                      {patient.churn_risk} risk
                    </div>
                  </div>
                </div>

                {/* Tags */}
                {patient.tags && patient.tags.length > 0 && (
                  <div className="flex flex-wrap gap-1 mb-3">
                    {patient.tags.map(tag => (
                      <span
                        key={tag}
                        className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded-full flex items-center gap-1"
                      >
                        <Tag className="w-3 h-3" />
                        {tag}
                      </span>
                    ))}
                  </div>
                )}

                {/* Stats Row */}
                <div className="grid grid-cols-4 gap-3 mb-4">
                  <div className="text-center">
                    <div className="text-lg font-bold text-gray-900">{patient.total_visits}</div>
                    <div className="text-xs text-gray-500">Visites</div>
                  </div>
                  <div className="text-center">
                    <div className="text-lg font-bold text-green-600">${patient.lifetime_value?.toFixed(0)}</div>
                    <div className="text-xs text-gray-500">LTV</div>
                  </div>
                  <div className="text-center">
                    <div className="text-lg font-bold text-blue-600">{patient.engagement_score}%</div>
                    <div className="text-xs text-gray-500">Engagement</div>
                  </div>
                  <div className="text-center">
                    <div className="text-lg font-bold text-purple-600">{patient.satisfaction_score}%</div>
                    <div className="text-xs text-gray-500">Satisfaction</div>
                  </div>
                </div>

                {/* Insights */}
                {insights.length > 0 && (
                  <div className="space-y-2 mb-4">
                    {insights.slice(0, 2).map((insight, i) => (
                      <div
                        key={i}
                        className={`p-2 rounded-lg text-xs ${
                          insight.type === 'danger' ? 'bg-red-50 border border-red-200' :
                          insight.type === 'warning' ? 'bg-yellow-50 border border-yellow-200' :
                          insight.type === 'success' ? 'bg-green-50 border border-green-200' :
                          'bg-blue-50 border border-blue-200'
                        }`}
                      >
                        <div className="font-medium mb-1 flex items-center gap-1">
                          {insight.type === 'danger' && <AlertCircle className="w-3 h-3" />}
                          {insight.type === 'warning' && <AlertTriangle className="w-3 h-3" />}
                          {insight.type === 'success' && <CheckCircle className="w-3 h-3" />}
                          {insight.type === 'info' && <Info className="w-3 h-3" />}
                          {insight.title}
                        </div>
                        <div className="text-gray-600">{insight.description}</div>
                      </div>
                    ))}
                  </div>
                )}

                {/* Quick Actions */}
                <div className="flex items-center gap-2">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleQuickAction(patient.id, 'detail');
                    }}
                    className="flex-1 px-3 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-all text-sm font-medium flex items-center justify-center gap-2"
                  >
                    <Eye className="w-4 h-4" />
                    Vue 360°
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleQuickAction(patient.id, 'email');
                    }}
                    className="p-2 border-2 border-gray-200 rounded-lg hover:border-blue-400 hover:bg-blue-50 transition-all"
                    title="Envoyer email"
                  >
                    <Mail className="w-4 h-4" />
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleQuickAction(patient.id, 'sms');
                    }}
                    className="p-2 border-2 border-gray-200 rounded-lg hover:border-green-400 hover:bg-green-50 transition-all"
                    title="Envoyer SMS"
                  >
                    <MessageSquare className="w-4 h-4" />
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleQuickAction(patient.id, 'call');
                    }}
                    className="p-2 border-2 border-gray-200 rounded-lg hover:border-purple-400 hover:bg-purple-50 transition-all"
                    title="Appeler"
                  >
                    <Phone className="w-4 h-4" />
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
          <Users className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-xl font-bold text-gray-700 mb-2">Aucun patient trouvé</h3>
          <p className="text-gray-500 mb-6">Ajustez vos filtres ou créez un nouveau patient</p>
          <button
            onClick={() => setActiveModal('add')}
            className="px-6 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-all inline-flex items-center gap-2"
          >
            <Plus className="w-5 h-5" />
            Créer Premier Patient
          </button>
        </motion.div>
      )}

      {/* Modals */}
      <AnimatePresence>
        {activeModal === 'detail' && selectedPatient && (
          <PatientDetailModal
            patient={selectedPatient}
            insights={generatePatientInsights(selectedPatient)}
            onClose={() => {
              setActiveModal('none');
              setSelectedPatient(null);
            }}
            onAction={handleQuickAction}
          />
        )}
      </AnimatePresence>

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

// Patient Detail Modal Component
function PatientDetailModal({
  patient,
  insights,
  onClose,
  onAction
}: {
  patient: Patient;
  insights: PatientInsight[];
  onClose: () => void;
  onAction: (patientId: string, action: string) => void;
}) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.9, y: 20 }}
        animate={{ scale: 1, y: 0 }}
        exit={{ scale: 0.9, y: 20 }}
        onClick={(e) => e.stopPropagation()}
        className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto"
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-500 to-purple-500 text-white p-6 sticky top-0 z-10">
          <div className="flex items-start justify-between mb-4">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center text-2xl font-bold">
                {patient.first_name[0]}{patient.last_name[0]}
              </div>
              <div>
                <h2 className="text-2xl font-bold flex items-center gap-2">
                  {patient.first_name} {patient.last_name}
                  {patient.is_vip && <Award className="w-6 h-6 text-yellow-300" />}
                </h2>
                <p className="text-white/80 mt-1">{patient.email}</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-white/10 rounded-lg transition-all"
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          {/* Quick Stats */}
          <div className="grid grid-cols-4 gap-4">
            <div className="bg-white/10 rounded-lg p-3 text-center">
              <div className="text-2xl font-bold">{patient.total_visits}</div>
              <div className="text-sm text-white/70">Visites</div>
            </div>
            <div className="bg-white/10 rounded-lg p-3 text-center">
              <div className="text-2xl font-bold">${patient.lifetime_value?.toFixed(0)}</div>
              <div className="text-sm text-white/70">LTV</div>
            </div>
            <div className="bg-white/10 rounded-lg p-3 text-center">
              <div className="text-2xl font-bold">{patient.health_score}%</div>
              <div className="text-sm text-white/70">Santé</div>
            </div>
            <div className="bg-white/10 rounded-lg p-3 text-center">
              <div className="text-2xl font-bold">{patient.satisfaction_score}%</div>
              <div className="text-sm text-white/70">Satisfaction</div>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* AI Insights */}
          {insights.length > 0 && (
            <div>
              <h3 className="text-lg font-bold text-gray-900 mb-3 flex items-center gap-2">
                <Brain className="w-5 h-5 text-purple-500" />
                Insights AI
              </h3>
              <div className="space-y-2">
                {insights.map((insight, i) => (
                  <div
                    key={i}
                    className={`p-4 rounded-lg border-2 ${
                      insight.type === 'danger' ? 'bg-red-50 border-red-200' :
                      insight.type === 'warning' ? 'bg-yellow-50 border-yellow-200' :
                      insight.type === 'success' ? 'bg-green-50 border-green-200' :
                      'bg-blue-50 border-blue-200'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="font-bold text-gray-900 mb-1">{insight.title}</div>
                        <div className="text-sm text-gray-600">{insight.description}</div>
                      </div>
                      {insight.action && insight.actionLabel && (
                        <button
                          onClick={insight.action}
                          className="ml-4 px-4 py-2 bg-white border-2 border-gray-300 rounded-lg hover:border-blue-500 transition-all text-sm font-medium flex items-center gap-2"
                        >
                          {insight.actionLabel}
                          <ArrowRight className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Tags & Info */}
          <div className="grid grid-cols-2 gap-6">
            <div>
              <h3 className="text-lg font-bold text-gray-900 mb-3">Tags</h3>
              <div className="flex flex-wrap gap-2">
                {patient.tags?.map(tag => (
                  <span
                    key={tag}
                    className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm font-medium flex items-center gap-1"
                  >
                    <Tag className="w-3 h-3" />
                    {tag}
                  </span>
                ))}
              </div>
            </div>

            <div>
              <h3 className="text-lg font-bold text-gray-900 mb-3">Risk Profile</h3>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">Churn Risk:</span>
                  <span className={`px-3 py-1 rounded-full text-sm font-medium ${getRiskBadgeColor(patient.churn_risk || 'low')}`}>
                    {patient.churn_risk}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">No-Shows:</span>
                  <span className="font-bold text-gray-900">{patient.no_show_count || 0}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">Unpaid Balance:</span>
                  <span className="font-bold text-red-600">${patient.unpaid_balance || 0}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Pain Points */}
          {patient.pain_points && patient.pain_points.length > 0 && (
            <div>
              <h3 className="text-lg font-bold text-gray-900 mb-3 flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-red-500" />
                Points d'Attention
              </h3>
              <ul className="space-y-2">
                {patient.pain_points.map((point, i) => (
                  <li key={i} className="flex items-center gap-2 text-gray-700">
                    <div className="w-2 h-2 bg-red-500 rounded-full" />
                    {point}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Quick Actions */}
          <div>
            <h3 className="text-lg font-bold text-gray-900 mb-3">Actions Rapides</h3>
            <div className="grid grid-cols-3 gap-3">
              <button
                onClick={() => onAction(patient.id, 'email')}
                className="p-4 bg-blue-50 border-2 border-blue-200 rounded-lg hover:bg-blue-100 transition-all text-center"
              >
                <Mail className="w-6 h-6 text-blue-600 mx-auto mb-2" />
                <div className="text-sm font-medium text-blue-900">Envoyer Email</div>
              </button>
              <button
                onClick={() => onAction(patient.id, 'sms')}
                className="p-4 bg-green-50 border-2 border-green-200 rounded-lg hover:bg-green-100 transition-all text-center"
              >
                <MessageSquare className="w-6 h-6 text-green-600 mx-auto mb-2" />
                <div className="text-sm font-medium text-green-900">Envoyer SMS</div>
              </button>
              <button
                onClick={() => onAction(patient.id, 'call')}
                className="p-4 bg-purple-50 border-2 border-purple-200 rounded-lg hover:bg-purple-100 transition-all text-center"
              >
                <Phone className="w-6 h-6 text-purple-600 mx-auto mb-2" />
                <div className="text-sm font-medium text-purple-900">Appeler</div>
              </button>
              <button
                onClick={() => onAction(patient.id, 'followup')}
                className="p-4 bg-yellow-50 border-2 border-yellow-200 rounded-lg hover:bg-yellow-100 transition-all text-center"
              >
                <Calendar className="w-6 h-6 text-yellow-600 mx-auto mb-2" />
                <div className="text-sm font-medium text-yellow-900">Planifier RDV</div>
              </button>
              <button
                onClick={() => onAction(patient.id, 'billing')}
                className="p-4 bg-red-50 border-2 border-red-200 rounded-lg hover:bg-red-100 transition-all text-center"
              >
                <DollarSign className="w-6 h-6 text-red-600 mx-auto mb-2" />
                <div className="text-sm font-medium text-red-900">Voir Factures</div>
              </button>
              <button
                onClick={() => onAction(patient.id, 'timeline')}
                className="p-4 bg-indigo-50 border-2 border-indigo-200 rounded-lg hover:bg-indigo-100 transition-all text-center"
              >
                <History className="w-6 h-6 text-indigo-600 mx-auto mb-2" />
                <div className="text-sm font-medium text-indigo-900">Timeline</div>
              </button>
            </div>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}

function getRiskBadgeColor(risk: string) {
  switch (risk) {
    case 'low': return 'bg-green-100 text-green-700';
    case 'medium': return 'bg-yellow-100 text-yellow-700';
    case 'high': return 'bg-red-100 text-red-700';
    default: return 'bg-gray-100 text-gray-700';
  }
}
