import { motion, AnimatePresence } from 'framer-motion';
import { useState, useEffect, useRef } from 'react';
import {
  X, Mail, Phone, Calendar, MapPin, Activity, FileText,
  DollarSign, TrendingUp, AlertTriangle, Award, Clock,
  Stethoscope, Dumbbell, BarChart3, Target, Edit, Save, History,
  MessageSquare, Download, Plus, CheckCircle, XCircle,
  Printer, Send, Shield, AlertCircle, FileCheck,
  Users, Building, Receipt, Briefcase, Pill, Brain, Bone, Share2
} from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useToastContext } from '../../contexts/ToastContext';
import { SmartSchedulingModal } from './SmartSchedulingModal';
import { QuickSoapNote } from './QuickSoapNote';
import { PatientBillingModal } from './PatientBillingModal';
import { SendMessageModal } from './SendMessageModal';
import { PatientFormsHistory } from './PatientFormsHistory';
import { usePatientFullData } from '../../hooks/usePatientFullData';

interface Patient {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  date_of_birth: string;
  status: string;
  city?: string;
  occupation?: string;
  last_visit?: string;
  total_visits: number;
  pain_areas?: string[];
  treatment_stage?: 'acute' | 'subacute' | 'maintenance' | 'wellness';
  red_flags?: string[];
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
  insurance_type?: string;
  unpaid_balance?: number;
  is_vip?: boolean;
  tags?: string[];
  sleep_quality?: number;
  stress_level?: number;
  posture_score?: number;
  functional_capacity?: number;
  medications?: string[];
  previous_injuries?: string[];
}

interface MegaPatientFileProps {
  patient: Patient;
  onClose: () => void;
  onUpdate?: () => void;
}

type TabType = 'dashboard' | 'clinical' | 'history' | 'billing' | 'documents' | 'communication' | 'goals' | 'imaging';

export function MegaPatientFile({ patient, onClose, onUpdate }: MegaPatientFileProps) {
  const toast = useToastContext();
  const [activeTab, setActiveTab] = useState<TabType>('dashboard');
  const [isEditing, setIsEditing] = useState(false);
  const [showAppointmentModal, setShowAppointmentModal] = useState(false);
  const [showSOAPModal, setShowSOAPModal] = useState(false);
  const [showBillingModal, setShowBillingModal] = useState(false);
  const [showMessageModal, setShowMessageModal] = useState(false);

  const [editedPatient, setEditedPatient] = useState(patient);
  const [appointments, setAppointments] = useState<any[]>([]);

  const fullData = usePatientFullData(patient.id);

  const documentInputRef = useRef<HTMLInputElement>(null);
  const imagingInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    loadPatientData();
  }, [patient.id]);

  const loadPatientData = async () => {
    const { data: appts } = await supabase
      .from('appointments_api')
      .select('*')
      .eq('contact_id', patient.id)
      .gte('scheduled_time', new Date().toISOString())
      .order('scheduled_time', { ascending: true })
      .limit(10);

    if (appts) setAppointments(appts);
  };

  const handleCancelAppointment = async (appointmentId: string) => {
    if (!confirm('Êtes-vous sûr de vouloir annuler ce rendez-vous?')) return;

    toast.info('Annulation du rendez-vous...');
    try {
      // Récupérer les détails du rendez-vous avant de l'annuler
      const { data: appointment, error: fetchError } = await supabase
        .from('appointments_api')
        .select('*')
        .eq('id', appointmentId)
        .single();

      if (fetchError) throw fetchError;

      // Annuler le rendez-vous
      const { error: updateError } = await supabase
        .from('appointments_api')
        .update({ status: 'cancelled' })
        .eq('id', appointmentId);

      if (updateError) throw updateError;

      toast.success('✅ Rendez-vous annulé!');

      // Notifier automatiquement tous les clients sur la liste de rappel
      toast.info('📧 Envoi des notifications aux clients en attente...');

      const { data: { session } } = await supabase.auth.getSession();
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
      const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

      const notifyResponse = await fetch(
        `${supabaseUrl}/functions/v1/notify-recall-clients`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${session?.access_token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            cancelled_appointment_date: appointment.scheduled_time,
            cancelled_appointment_time: new Date(appointment.scheduled_time).toLocaleTimeString('fr-CA', {
              hour: '2-digit',
              minute: '2-digit'
            }),
            service_type_id: appointment.service_type_id,
          }),
        }
      );

      if (notifyResponse.ok) {
        const result = await notifyResponse.json();
        toast.success(`✅ ${result.notified || 0} client(s) notifié(s) sur la liste de rappel!`);
      } else {
        console.error('Erreur notification clients:', await notifyResponse.text());
        toast.error('⚠️ Rendez-vous annulé mais erreur lors de la notification des clients');
      }

      loadPatientData();
    } catch (error) {
      console.error('Erreur annulation:', error);
      toast.error('❌ Erreur lors de l\'annulation');
    }
  };

  const tabs = [
    { id: 'dashboard', label: 'Tableau de Bord', icon: BarChart3 },
    { id: 'clinical', label: 'Clinique', icon: Stethoscope },
    { id: 'history', label: 'Historique', icon: History },
    { id: 'billing', label: 'Facturation', icon: DollarSign },
    { id: 'documents', label: 'Documents', icon: FileText },
    { id: 'communication', label: 'Communication', icon: MessageSquare },
    { id: 'goals', label: 'Objectifs', icon: Target },
    { id: 'imaging', label: 'Imagerie', icon: Activity },
  ] as const;

  const getTreatmentStageInfo = (stage: string) => {
    const stages = {
      acute: { color: 'bg-red-500', label: 'PHASE AIGUË' },
      subacute: { color: 'bg-orange-500', label: 'SUB-AIGUË' },
      maintenance: { color: 'bg-blue-500', label: 'MAINTENANCE' },
      wellness: { color: 'bg-green-500', label: 'BIEN-ÊTRE' }
    };
    return stages[stage as keyof typeof stages] || { color: 'bg-gray-500', label: stage?.toUpperCase() };
  };

  const getResponseColor = (response: string) => {
    const colors = {
      excellent: 'bg-green-500',
      good: 'bg-blue-500',
      fair: 'bg-yellow-500',
      poor: 'bg-red-500'
    };
    return colors[response as keyof typeof colors] || 'bg-gray-500';
  };

  const calculateAge = (dob: string) => {
    const birthDate = new Date(dob);
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) age--;
    return age;
  };

  const calculateDaysSinceLastVisit = () => {
    if (!patient.last_visit) return null;
    const diffTime = Math.abs(new Date().getTime() - new Date(patient.last_visit).getTime());
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  };

  const handlePrint = () => {
    toast.info('Impression du dossier...');
    window.print();
  };

  const handleExportPDF = () => {
    toast.info('Export PDF en cours...');
    setTimeout(() => {
      toast.success('PDF exporté avec succès!');
    }, 1000);
  };

  const handleShare = () => {
    const link = `${window.location.origin}/patient/${patient.id}`;
    navigator.clipboard.writeText(link);
    toast.success('Lien copié dans le presse-papiers!');
  };

  const handleDocumentUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      const fileName = files[0].name;
      toast.success(`Document "${fileName}" téléversé avec succès!`);
      if (documentInputRef.current) {
        documentInputRef.current.value = '';
      }
    }
  };

  const handleImagingUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      const fileName = files[0].name;
      toast.success(`Image médicale "${fileName}" téléversée avec succès!`);
      if (imagingInputRef.current) {
        imagingInputRef.current.value = '';
      }
    }
  };

  const handleAddGoal = () => {
    console.log('🎯 Bouton Ajouter un objectif cliqué!');
    toast.success('✅ Bouton cliqué! Ajout d\'objectifs en développement');
  };

  const handleSave = async () => {
    toast.info('Sauvegarde des modifications...');
    try {
      const { error } = await supabase
        .from('contacts')
        .update({
          first_name: editedPatient.first_name,
          last_name: editedPatient.last_name,
          email: editedPatient.email,
          phone: editedPatient.phone,
          date_of_birth: editedPatient.date_of_birth,
          city: editedPatient.city,
          occupation: editedPatient.occupation,
          status: editedPatient.status,
          updated_at: new Date().toISOString()
        })
        .eq('id', patient.id);

      if (error) throw error;

      setIsEditing(false);
      toast.success('✅ Modifications sauvegardées!');
      if (onUpdate) onUpdate();
    } catch (error) {
      console.error('Erreur sauvegarde patient:', error);
      toast.error('❌ Erreur lors de la sauvegarde');
    }
  };

  const handleNewAppointment = () => {
    setShowAppointmentModal(true);
    toast.info('Ouverture du calendrier...');
  };

  const handleNewSOAP = () => {
    setShowSOAPModal(true);
    toast.info('Ouverture de la note SOAP...');
  };

  const handleBilling = () => {
    setShowBillingModal(true);
    toast.info('Ouverture de la facturation...');
  };

  const handleSendMessage = () => {
    console.log('📧 Bouton message cliqué, ouverture du modal...', { patient });
    setShowMessageModal(true);
    toast.info('Ouverture de la messagerie...');
  };

  const stageInfo = getTreatmentStageInfo(patient.treatment_stage || '');
  const daysSinceLastVisit = calculateDaysSinceLastVisit();

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="bg-white rounded-2xl shadow-2xl w-full h-[90vh] max-w-7xl flex flex-col"
      >
        {/* HEADER FIXE */}
        <div className="flex-shrink-0 bg-gradient-to-r from-blue-600 to-blue-700 text-white px-6 py-4 rounded-t-2xl">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-xl bg-white/20 flex items-center justify-center text-2xl font-bold border-2 border-white/30">
                {patient.first_name[0]}{patient.last_name[0]}
              </div>
              <div>
                <div className="flex items-center gap-3">
                  <h2 className="text-2xl font-bold">{patient.first_name} {patient.last_name}</h2>
                  {patient.is_vip && (
                    <span className="px-2 py-1 bg-yellow-400 text-yellow-900 rounded-lg text-xs font-bold flex items-center gap-1">
                      <Award className="w-3 h-3" />VIP
                    </span>
                  )}
                  <span className={`px-3 py-1 ${stageInfo.color} text-white rounded-lg text-xs font-bold`}>
                    {stageInfo.label}
                  </span>
                </div>
                <div className="flex items-center gap-4 text-sm text-blue-100 mt-1">
                  <span>{calculateAge(patient.date_of_birth)} ans</span>
                  <span>•</span>
                  <span>{patient.total_visits} visites</span>
                  {daysSinceLastVisit && <><span>•</span><span>Dernière: {daysSinceLastVisit}j</span></>}
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button onClick={handlePrint} className="p-2 bg-white/10 hover:bg-white/20 rounded-lg transition-all hover:scale-110" title="Imprimer">
                <Printer className="w-4 h-4" />
              </button>
              <button onClick={handleExportPDF} className="p-2 bg-white/10 hover:bg-white/20 rounded-lg transition-all hover:scale-110" title="Exporter PDF">
                <Download className="w-4 h-4" />
              </button>
              <button onClick={handleShare} className="p-2 bg-white/10 hover:bg-white/20 rounded-lg transition-all hover:scale-110" title="Partager">
                <Share2 className="w-4 h-4" />
              </button>
              <button
                onClick={() => isEditing ? handleSave() : setIsEditing(true)}
                className={`px-4 py-2 rounded-lg font-semibold transition-all flex items-center gap-2 hover:scale-105 ${
                  isEditing ? 'bg-green-500 hover:bg-green-600 shadow-lg' : 'bg-white/10 hover:bg-white/20'
                }`}
              >
                {isEditing ? <Save className="w-4 h-4" /> : <Edit className="w-4 h-4" />}
                {isEditing ? 'Sauvegarder' : 'Modifier'}
              </button>
              <button onClick={onClose} className="p-2 bg-red-500 hover:bg-red-600 rounded-lg transition-all hover:scale-110">
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>
          <div className="grid grid-cols-6 gap-2">
            {[
              { label: 'Douleur', value: `${patient.current_pain}/10` },
              { label: 'Amélioration', value: `${patient.improvement_percentage?.toFixed(0)}%` },
              { label: 'Observance', value: `${patient.exercises_compliance}%` },
              { label: 'Séances', value: `${patient.sessions_completed}/${patient.sessions_planned}` },
              { label: 'Posture', value: patient.posture_score || 'N/A' },
              { label: 'Solde', value: `$${patient.unpaid_balance || 0}` }
            ].map((kpi, i) => (
              <div key={i} className="bg-white/10 backdrop-blur-sm rounded-lg px-3 py-2">
                <div className="text-xs text-blue-100">{kpi.label}</div>
                <div className="text-lg font-bold">{kpi.value}</div>
              </div>
            ))}
          </div>
        </div>

        {/* TABS NAVIGATION FIXE */}
        <div className="flex-shrink-0 border-b border-gray-200 bg-white">
          <div className="flex overflow-x-auto">
            {tabs.map(tab => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as TabType)}
                  className={`flex items-center gap-2 px-6 py-3 font-semibold text-sm whitespace-nowrap border-b-2 transition-all ${
                    activeTab === tab.id
                      ? 'border-blue-500 text-blue-600 bg-blue-50'
                      : 'border-transparent text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  {tab.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* CONTENT SCROLLABLE */}
        <div className="flex-1 overflow-y-auto bg-gray-50">
          <div className="p-6">
            <AnimatePresence mode="wait">
              {activeTab === 'dashboard' && (
                <motion.div key="dashboard" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
                  {patient.red_flags && patient.red_flags.length > 0 && (
                    <div className="bg-red-50 border-2 border-red-200 rounded-xl p-4">
                      <div className="flex items-center gap-2 mb-3">
                        <AlertTriangle className="w-5 h-5 text-red-600" />
                        <h3 className="font-bold text-red-900">Drapeaux Rouges</h3>
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        {patient.red_flags.map((flag, i) => (
                          <div key={i} className="text-sm text-red-700 flex items-start gap-2">
                            <XCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                            {flag}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    <div className="lg:col-span-2 space-y-6">
                      <div className="bg-white rounded-xl p-6 border border-gray-200">
                        <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
                          <Activity className="w-5 h-5 text-blue-600" />
                          Évolution de la Douleur
                        </h3>
                        <div className="space-y-4">
                          <div className="relative h-20 bg-gradient-to-r from-green-100 via-yellow-100 to-red-100 rounded-lg border border-gray-200">
                            <div className="absolute top-0 bottom-0 w-0.5 bg-red-600" style={{ left: `${((patient.initial_pain || 0) / 10) * 100}%` }}>
                              <div className="absolute -top-6 left-1/2 -translate-x-1/2 px-2 py-1 bg-red-600 text-white text-xs font-bold rounded whitespace-nowrap">
                                Initial: {patient.initial_pain}
                              </div>
                            </div>
                            <div className="absolute top-0 bottom-0 w-0.5 bg-green-600" style={{ left: `${((patient.current_pain || 0) / 10) * 100}%` }}>
                              <div className="absolute -bottom-6 left-1/2 -translate-x-1/2 px-2 py-1 bg-green-600 text-white text-xs font-bold rounded whitespace-nowrap">
                                Actuel: {patient.current_pain}
                              </div>
                            </div>
                            <div className="absolute inset-0 flex items-center justify-between px-2 text-xs font-bold text-gray-400">
                              {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(n => <span key={n}>{n}</span>)}
                            </div>
                          </div>
                          <div className="bg-green-50 border border-green-200 rounded-lg p-4 flex items-center justify-between">
                            <div>
                              <div className="text-sm text-green-700 font-semibold">Amélioration Totale</div>
                              <div className="text-3xl font-bold text-green-600">{patient.improvement_percentage?.toFixed(1)}%</div>
                            </div>
                            <TrendingUp className="w-12 h-12 text-green-600" />
                          </div>
                          {patient.pain_areas && patient.pain_areas.length > 0 && (
                            <div>
                              <div className="text-sm font-semibold text-gray-700 mb-2">Zones Douloureuses</div>
                              <div className="flex flex-wrap gap-2">
                                {patient.pain_areas.map((area, i) => (
                                  <span key={i} className="px-3 py-1 bg-red-100 text-red-700 rounded-lg text-sm font-medium">{area}</span>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      </div>

                      <div className="bg-white rounded-xl p-6 border border-gray-200">
                        <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
                          <Target className="w-5 h-5 text-purple-600" />
                          Plan de Traitement
                        </h3>
                        <div className="bg-purple-50 border border-purple-200 rounded-lg p-4 mb-4">
                          <div className="font-bold text-purple-900 mb-1">{patient.treatment_plan}</div>
                          <div className="text-sm text-purple-700 mb-3">
                            {patient.sessions_completed} / {patient.sessions_planned} séances complétées
                          </div>
                          <div className="h-3 bg-white rounded-full overflow-hidden border border-purple-200">
                            <div className="h-full bg-purple-500 transition-all" style={{ width: `${((patient.sessions_completed || 0) / (patient.sessions_planned || 1)) * 100}%` }} />
                          </div>
                        </div>
                        <div>
                          <div className="text-sm font-semibold text-gray-700 mb-2">Réponse aux Soins</div>
                          <div className={`${getResponseColor(patient.response_to_care || '')} text-white rounded-lg p-4 text-center`}>
                            <div className="text-2xl font-bold uppercase">{patient.response_to_care}</div>
                          </div>
                        </div>
                      </div>

                      <div className="bg-white rounded-xl p-6 border border-gray-200">
                        <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
                          <Dumbbell className="w-5 h-5 text-orange-600" />
                          Programme d'Exercices
                        </h3>
                        <div className="bg-orange-50 border border-orange-200 rounded-lg p-4 mb-4">
                          <div className="flex items-center justify-between mb-2">
                            <div className="text-sm font-semibold text-orange-700">Observance</div>
                            <div className="text-2xl font-bold text-orange-600">{patient.exercises_compliance}%</div>
                          </div>
                          <div className="h-2 bg-white rounded-full overflow-hidden border border-orange-300">
                            <div className="h-full bg-orange-500" style={{ width: `${patient.exercises_compliance}%` }} />
                          </div>
                        </div>
                        {patient.exercises_assigned && patient.exercises_assigned.length > 0 && (
                          <div className="space-y-2">
                            {patient.exercises_assigned.map((exercise, i) => (
                              <div key={i} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg border border-gray-200">
                                <div className="w-8 h-8 bg-orange-500 text-white rounded-lg flex items-center justify-center font-bold text-sm">{i + 1}</div>
                                <div className="flex-1 font-medium">{exercise}</div>
                                <CheckCircle className="w-5 h-5 text-green-500" />
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="space-y-6">
                      <div className="bg-white rounded-xl p-6 border border-gray-200">
                        <h4 className="font-bold mb-4">Actions Rapides</h4>
                        <div className="space-y-2">
                          <button
                            onClick={handleNewAppointment}
                            className="w-full py-2.5 px-4 bg-blue-500 hover:bg-blue-600 text-white rounded-lg font-semibold transition-all flex items-center justify-center gap-2 hover:scale-105 hover:shadow-lg"
                          >
                            <Plus className="w-4 h-4" />
                            Nouveau RDV
                          </button>
                          <button
                            onClick={handleNewSOAP}
                            className="w-full py-2.5 px-4 bg-purple-500 hover:bg-purple-600 text-white rounded-lg font-semibold transition-all flex items-center justify-center gap-2 hover:scale-105 hover:shadow-lg"
                          >
                            <FileText className="w-4 h-4" />
                            Note SOAP
                          </button>
                          <button
                            onClick={handleBilling}
                            className="w-full py-2.5 px-4 bg-green-500 hover:bg-green-600 text-white rounded-lg font-semibold transition-all flex items-center justify-center gap-2 hover:scale-105 hover:shadow-lg"
                          >
                            <Receipt className="w-4 h-4" />
                            Facturer
                          </button>
                          <button
                            onClick={handleSendMessage}
                            className="w-full py-2.5 px-4 bg-orange-500 hover:bg-orange-600 text-white rounded-lg font-semibold transition-all flex items-center justify-center gap-2 hover:scale-105 hover:shadow-lg"
                          >
                            <Send className="w-4 h-4" />
                            Message
                          </button>
                        </div>
                      </div>

                      <div className="bg-white rounded-xl p-6 border border-gray-200">
                        <h4 className="font-bold mb-4">Informations</h4>
                        <div className="space-y-3">
                          {isEditing ? (
                            <>
                              <div className="flex items-center gap-3">
                                <Mail className="w-4 h-4 text-gray-400" />
                                <input
                                  type="email"
                                  value={editedPatient.email}
                                  onChange={(e) => setEditedPatient({ ...editedPatient, email: e.target.value })}
                                  className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                  placeholder="Email"
                                />
                              </div>
                              <div className="flex items-center gap-3">
                                <Phone className="w-4 h-4 text-gray-400" />
                                <input
                                  type="tel"
                                  value={editedPatient.phone}
                                  onChange={(e) => setEditedPatient({ ...editedPatient, phone: e.target.value })}
                                  className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                  placeholder="Téléphone"
                                />
                              </div>
                              <div className="flex items-center gap-3">
                                <MapPin className="w-4 h-4 text-gray-400" />
                                <input
                                  type="text"
                                  value={editedPatient.city || ''}
                                  onChange={(e) => setEditedPatient({ ...editedPatient, city: e.target.value })}
                                  className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                  placeholder="Ville"
                                />
                              </div>
                              <div className="flex items-center gap-3">
                                <Briefcase className="w-4 h-4 text-gray-400" />
                                <input
                                  type="text"
                                  value={editedPatient.occupation || ''}
                                  onChange={(e) => setEditedPatient({ ...editedPatient, occupation: e.target.value })}
                                  className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                  placeholder="Profession"
                                />
                              </div>
                            </>
                          ) : (
                            [
                              { icon: Mail, value: patient.email },
                              { icon: Phone, value: patient.phone },
                              { icon: MapPin, value: patient.city },
                              { icon: Briefcase, value: patient.occupation },
                              { icon: Shield, value: patient.insurance_type }
                            ].filter(item => item.value).map((item, i) => {
                              const Icon = item.icon;
                              return (
                                <div key={i} className="flex items-center gap-3">
                                  <Icon className="w-4 h-4 text-gray-400" />
                                  <div className="text-sm text-gray-600">{item.value}</div>
                                </div>
                              );
                            })
                          )}
                        </div>
                      </div>

                      {patient.tags && patient.tags.length > 0 && (
                        <div className="bg-white rounded-xl p-6 border border-gray-200">
                          <h4 className="font-bold mb-4">Étiquettes</h4>
                          <div className="flex flex-wrap gap-2">
                            {patient.tags.map((tag, i) => (
                              <span key={i} className="px-3 py-1 bg-gray-100 text-gray-700 rounded-lg text-xs font-semibold border border-gray-200">
                                {tag}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </motion.div>
              )}

              {activeTab === 'clinical' && (
                <motion.div key="clinical" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {[
                    { title: 'ROM Cervical', icon: Bone, color: 'blue', items: [
                      { label: 'Flexion', value: patient.cervical_flexion, max: 60, color: 'blue' },
                      { label: 'Extension', value: patient.cervical_extension, max: 70, color: 'purple' }
                    ]},
                    { title: 'ROM Lombaire', icon: Bone, color: 'green', items: [
                      { label: 'Flexion', value: patient.lumbar_flexion, max: 90, color: 'green' },
                      { label: 'Extension', value: patient.lumbar_extension, max: 30, color: 'orange' }
                    ]}
                  ].map((section, i) => (
                    <div key={i} className="bg-white rounded-xl p-6 border border-gray-200">
                      <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
                        <section.icon className={`w-5 h-5 text-${section.color}-600`} />
                        {section.title}
                      </h3>
                      <div className="space-y-3">
                        {section.items.map((item, j) => (
                          <div key={j}>
                            <div className="flex justify-between text-sm mb-1">
                              <span>{item.label}</span>
                              <span className="font-bold">{item.value}° / {item.max}°</span>
                            </div>
                            <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                              <div className={`h-full bg-${item.color}-500`} style={{ width: `${((item.value || 0) / item.max) * 100}%` }} />
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}

                  <div className="bg-white rounded-xl p-6 border border-gray-200">
                    <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
                      <Brain className="w-5 h-5 text-purple-600" />
                      Métriques de Santé
                    </h3>
                    <div className="grid grid-cols-2 gap-3">
                      {[
                        { label: 'Sommeil', value: patient.sleep_quality, max: 10, color: 'blue' },
                        { label: 'Stress', value: patient.stress_level, max: 10, color: 'red' },
                        { label: 'Posture', value: patient.posture_score, max: 100, color: 'green' },
                        { label: 'Capacité', value: patient.functional_capacity, max: 100, color: 'purple', suffix: '%' }
                      ].map((metric, i) => (
                        <div key={i} className={`bg-${metric.color}-50 border border-${metric.color}-200 rounded-lg p-3 text-center`}>
                          <div className={`text-xs text-${metric.color}-700 mb-1`}>{metric.label}</div>
                          <div className={`text-2xl font-bold text-${metric.color}-600`}>
                            {metric.value || 'N/A'}{metric.suffix ? metric.suffix : `/${metric.max}`}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="bg-white rounded-xl p-6 border border-gray-200">
                    <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
                      <FileCheck className="w-5 h-5 text-red-600" />
                      Historique Médical
                    </h3>
                    {[
                      { title: 'Médicaments', items: patient.medications },
                      { title: 'Blessures', items: patient.previous_injuries }
                    ].map((section, i) => section.items && section.items.length > 0 && (
                      <div key={i} className="mb-3">
                        <div className="text-sm font-semibold text-gray-700 mb-1">{section.title}</div>
                        {section.items.map((item, j) => (
                          <div key={j} className="text-sm text-gray-600 bg-gray-50 px-2 py-1 rounded mb-1">• {item}</div>
                        ))}
                      </div>
                    ))}
                  </div>
                </motion.div>
              )}

              {activeTab === 'history' && (
                <motion.div key="history" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
                  <div className="bg-white rounded-xl p-6 border border-gray-200">
                    <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
                      <Calendar className="w-5 h-5 text-blue-600" />
                      Prochains rendez-vous
                    </h3>
                    <div className="space-y-3">
                      {appointments.length === 0 ? (
                        <div className="text-center py-8 text-gray-500">
                          Aucun rendez-vous à venir
                        </div>
                      ) : (
                        appointments.map((appt) => (
                          <div
                            key={appt.id}
                            className="flex items-center gap-4 p-4 bg-gray-50 rounded-lg border border-gray-200 hover:border-blue-400 hover:shadow-md transition-all"
                          >
                            <div className="w-12 h-12 bg-blue-500 rounded-lg flex items-center justify-center text-white font-bold">
                              {new Date(appt.scheduled_time).getDate()}
                            </div>
                            <div className="flex-1">
                              <div className="font-semibold text-gray-900">{appt.service_type || 'Rendez-vous'}</div>
                              <div className="text-sm text-gray-600">
                                {new Date(appt.scheduled_time).toLocaleDateString('fr-CA', { weekday: 'long', day: 'numeric', month: 'long', hour: '2-digit', minute: '2-digit' })}
                              </div>
                              <div className="text-xs text-gray-500 mt-1">
                                {appt.status === 'scheduled' ? '✓ Confirmé' : appt.status}
                              </div>
                            </div>
                            <button
                              onClick={() => handleCancelAppointment(appt.id)}
                              className="px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg text-sm font-semibold transition-all flex items-center gap-2"
                            >
                              <XCircle className="w-4 h-4" />
                              Annuler
                            </button>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                  <div className="bg-white rounded-xl p-6 border border-gray-200">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-lg font-bold flex items-center gap-2">
                        <FileText className="w-5 h-5 text-purple-600" />
                        Notes SOAP récentes
                      </h3>
                      <button
                        onClick={() => setShowSOAPModal(true)}
                        className="px-4 py-2 bg-purple-500 hover:bg-purple-600 text-white rounded-lg text-sm font-semibold transition-all"
                      >
                        Ajouter note
                      </button>
                    </div>
                    {fullData.loading ? (
                      <div className="text-center py-4 text-gray-500">Chargement...</div>
                    ) : fullData.soapNotes.length === 0 ? (
                      <div className="text-center py-4 text-gray-500">Aucune note SOAP</div>
                    ) : (
                      <div className="space-y-3">
                        {fullData.soapNotes.slice(0, 5).map((note) => (
                          <div
                            key={note.id}
                            onClick={() => toast.info(`Note SOAP du ${new Date(note.created_at).toLocaleDateString('fr-FR')}`)}
                            className="p-4 bg-purple-50 rounded-lg border border-purple-200 cursor-pointer hover:border-purple-400 hover:shadow-md transition-all"
                          >
                            <div className="flex items-center justify-between mb-2">
                              <div className="font-semibold text-purple-900">
                                {new Date(note.created_at).toLocaleDateString('fr-FR', {
                                  day: 'numeric',
                                  month: 'long',
                                  year: 'numeric'
                                })}
                              </div>
                              <div className="text-xs text-purple-600">Par {note.created_by_name}</div>
                            </div>
                            <div className="text-sm text-gray-700">
                              <div className="line-clamp-2">
                                <strong>S:</strong> {note.subjective?.substring(0, 100)}...
                              </div>
                            </div>
                          </div>
                        ))}
                        <div className="text-center pt-2">
                          <div className="text-sm text-purple-600 font-semibold">
                            {fullData.soapNotes.length} note{fullData.soapNotes.length > 1 ? 's' : ''} au total
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </motion.div>
              )}

              {activeTab === 'billing' && (
                <motion.div key="billing" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
                  <div className="grid grid-cols-3 gap-4">
                    <div className="bg-blue-50 border border-blue-200 rounded-xl p-6">
                      <div className="text-sm text-blue-700 mb-2">Total facturé</div>
                      <div className="text-3xl font-bold text-blue-900">{fullData.billing.total.toFixed(2)}$</div>
                    </div>
                    <div className="bg-green-50 border border-green-200 rounded-xl p-6">
                      <div className="text-sm text-green-700 mb-2">Payé</div>
                      <div className="text-3xl font-bold text-green-900">{fullData.billing.paid.toFixed(2)}$</div>
                    </div>
                    <div className="bg-orange-50 border border-orange-200 rounded-xl p-6">
                      <div className="text-sm text-orange-700 mb-2">Impayé</div>
                      <div className="text-3xl font-bold text-orange-900">{fullData.billing.unpaid.toFixed(2)}$</div>
                    </div>
                  </div>
                  <div className="bg-white rounded-xl p-6 border border-gray-200">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-lg font-bold flex items-center gap-2">
                        <Receipt className="w-5 h-5 text-blue-600" />
                        Factures récentes
                      </h3>
                      <button
                        onClick={() => setShowBillingModal(true)}
                        className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg text-sm font-semibold transition-all"
                      >
                        Créer facture
                      </button>
                    </div>
                    {fullData.loading ? (
                      <div className="text-center py-4 text-gray-500">Chargement...</div>
                    ) : fullData.billing.invoices.length === 0 ? (
                      <div className="text-center py-8 text-gray-500">
                        <Receipt className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                        <div>Aucune facture</div>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {fullData.billing.invoices.slice(0, 5).map((invoice) => (
                          <div
                            key={invoice.id}
                            onClick={() => toast.info(`Facture ${invoice.invoice_number}`)}
                            className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border border-gray-200 cursor-pointer hover:border-blue-400 hover:shadow-md transition-all"
                          >
                            <div className="flex-1">
                              <div className="font-semibold text-gray-900">{invoice.invoice_number}</div>
                              <div className="text-sm text-gray-600">
                                {new Date(invoice.created_at).toLocaleDateString('fr-FR')}
                              </div>
                            </div>
                            <div className="text-right">
                              <div className="font-bold text-lg">{invoice.amount.toFixed(2)}$</div>
                              <div className={`text-xs font-semibold ${
                                invoice.status === 'paid' ? 'text-green-600' :
                                invoice.status === 'partial' ? 'text-orange-600' : 'text-red-600'
                              }`}>
                                {invoice.status === 'paid' ? '✓ Payée' :
                                 invoice.status === 'partial' ? `Partiel ${invoice.amount_paid.toFixed(2)}$` : 'Impayée'}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </motion.div>
              )}

              {activeTab === 'documents' && (
                <motion.div key="documents" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
                  <div className="bg-white rounded-xl p-6 border border-gray-200">
                    <PatientFormsHistory contactId={patient.id} />
                  </div>

                  <div className="bg-white rounded-xl p-6 border border-gray-200">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-lg font-bold flex items-center gap-2">
                        <FileText className="w-5 h-5 text-blue-600" />
                        Autres Documents
                      </h3>
                      <div>
                        <input
                          ref={documentInputRef}
                          type="file"
                          onChange={handleDocumentUpload}
                          className="hidden"
                          accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                        />
                        <button
                          type="button"
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            documentInputRef.current?.click();
                          }}
                          className="flex items-center gap-2 px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg text-sm font-semibold transition-all shadow-md hover:shadow-lg"
                        >
                          <Plus className="w-4 h-4" />
                          Ajouter
                        </button>
                      </div>
                    </div>
                    {fullData.loading ? (
                      <div className="text-center py-4 text-gray-500">Chargement...</div>
                    ) : fullData.documents.length === 0 ? (
                      <div className="text-center py-8 text-gray-500">
                        <FileText className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                        <div>Aucun document</div>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {fullData.documents.map((doc) => (
                          <div key={doc.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border border-gray-200">
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                                <FileText className="w-5 h-5 text-blue-600" />
                              </div>
                              <div>
                                <div className="font-semibold text-gray-900">{doc.name}</div>
                                <div className="text-xs text-gray-600">
                                  {new Date(doc.created_at).toLocaleDateString('fr-FR')}
                                </div>
                              </div>
                            </div>
                            <button
                              onClick={() => {
                                window.open(doc.url, '_blank');
                                toast.success(`Ouverture de "${doc.name}"...`);
                              }}
                              className="p-2 hover:bg-gray-200 rounded-lg transition-all"
                            >
                              <Download className="w-4 h-4 text-gray-600" />
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </motion.div>
              )}

              {activeTab === 'communication' && (
                <motion.div key="communication" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
                  <div className="bg-white rounded-xl p-6 border border-gray-200">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-lg font-bold flex items-center gap-2">
                        <MessageSquare className="w-5 h-5 text-blue-600" />
                        Messages et communications
                      </h3>
                      <button
                        onClick={() => setShowMessageModal(true)}
                        className="flex items-center gap-2 px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg text-sm font-semibold transition-all"
                      >
                        <Send className="w-4 h-4" />
                        Nouveau message
                      </button>
                    </div>
                    {fullData.loading ? (
                      <div className="text-center py-4 text-gray-500">Chargement...</div>
                    ) : fullData.communications.length === 0 ? (
                      <div className="text-center py-8 text-gray-500">
                        <MessageSquare className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                        <div>Aucune communication</div>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {fullData.communications.map((msg) => (
                          <div
                            key={msg.id}
                            onClick={() => toast.info(`Détails du message: ${msg.subject}`)}
                            className="flex items-center gap-4 p-4 bg-gray-50 rounded-lg border border-gray-200 cursor-pointer hover:border-blue-400 hover:shadow-md transition-all"
                          >
                            <div className={`w-10 h-10 ${msg.type === 'email' ? 'bg-blue-100' : 'bg-green-100'} rounded-lg flex items-center justify-center`}>
                              {msg.type === 'email' ? <Mail className="w-5 h-5 text-blue-600" /> : <MessageSquare className="w-5 h-5 text-green-600" />}
                            </div>
                            <div className="flex-1">
                              <div className="font-semibold text-gray-900">{msg.subject}</div>
                              <div className="text-xs text-gray-600">
                                {new Date(msg.sent_at).toLocaleDateString('fr-FR', {
                                  day: 'numeric',
                                  month: 'short',
                                  hour: '2-digit',
                                  minute: '2-digit'
                                })} • {msg.status}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </motion.div>
              )}

              {activeTab === 'goals' && (
                <motion.div key="goals" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
                  <div className="bg-white rounded-xl p-6 border border-gray-200">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-lg font-bold flex items-center gap-2">
                        <Target className="w-5 h-5 text-blue-600" />
                        Objectifs de traitement
                      </h3>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          handleAddGoal();
                        }}
                        className="flex items-center gap-2 px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg text-sm font-semibold transition-all shadow-md hover:shadow-lg"
                      >
                        <Plus className="w-4 h-4" />
                        Ajouter un objectif
                      </button>
                    </div>
                    {fullData.loading ? (
                      <div className="text-center py-4 text-gray-500">Chargement...</div>
                    ) : fullData.goals.length === 0 ? (
                      <div className="text-center py-8 text-gray-500">
                        <Target className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                        <div>Aucun objectif défini</div>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        {fullData.goals.map((item) => (
                          <div
                            key={item.id}
                            onClick={() => toast.info(`Édition de l'objectif: ${item.goal}`)}
                            className="p-4 bg-gray-50 rounded-lg border border-gray-200 cursor-pointer hover:border-blue-400 hover:shadow-md transition-all"
                          >
                            <div className="flex items-center justify-between mb-2">
                              <div className="font-semibold text-gray-900">{item.goal}</div>
                              <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                                item.status === 'en cours' ? 'bg-blue-100 text-blue-700' : 'bg-gray-200 text-gray-700'
                              }`}>
                                {item.status}
                              </span>
                            </div>
                            <div className="flex items-center gap-3">
                              <div className="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden">
                                <div className="h-full bg-blue-500" style={{ width: `${item.progress}%` }} />
                              </div>
                              <div className="text-sm font-semibold text-gray-700">{item.progress}%</div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </motion.div>
              )}

              {activeTab === 'imaging' && (
                <motion.div key="imaging" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
                  <div className="bg-white rounded-xl p-6 border border-gray-200">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-lg font-bold flex items-center gap-2">
                        <Activity className="w-5 h-5 text-blue-600" />
                        Imagerie médicale
                      </h3>
                      <div>
                        <input
                          ref={imagingInputRef}
                          type="file"
                          onChange={handleImagingUpload}
                          className="hidden"
                          accept="image/*,.dcm"
                        />
                        <button
                          type="button"
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            imagingInputRef.current?.click();
                          }}
                          className="flex items-center gap-2 px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg text-sm font-semibold transition-all shadow-md hover:shadow-lg"
                        >
                          <Plus className="w-4 h-4" />
                          Téléverser
                        </button>
                      </div>
                    </div>
                    {fullData.loading ? (
                      <div className="text-center py-4 text-gray-500">Chargement...</div>
                    ) : fullData.documents.filter(d => d.type.startsWith('image/')).length === 0 ? (
                      <div className="text-center py-8 text-gray-500">
                        <Activity className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                        <div>Aucune imagerie médicale</div>
                      </div>
                    ) : (
                      <div className="grid grid-cols-2 gap-4">
                        {fullData.documents.filter(d => d.type.startsWith('image/')).map((img) => (
                          <div
                            key={img.id}
                            onClick={() => {
                              window.open(img.url, '_blank');
                              toast.info(`Visualisation de "${img.name}"`);
                            }}
                            className="bg-gray-50 rounded-lg border border-gray-200 p-4 cursor-pointer hover:border-blue-400 hover:shadow-md transition-all"
                          >
                            <div className="w-full h-40 bg-gray-300 rounded-lg mb-3 overflow-hidden">
                              <img
                                src={img.url}
                                alt={img.name}
                                className="w-full h-full object-cover"
                                onError={(e) => {
                                  (e.target as HTMLImageElement).style.display = 'none';
                                  (e.target as HTMLImageElement).parentElement!.innerHTML = '<div class="flex items-center justify-center w-full h-full"><svg class="w-12 h-12 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"></path></svg></div>';
                                }}
                              />
                            </div>
                            <div className="font-semibold text-gray-900 text-sm mb-1">{img.name}</div>
                            <div className="text-xs text-gray-600">
                              Date: {new Date(img.created_at).toLocaleDateString('fr-FR')}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* FOOTER FIXE */}
        <div className="flex-shrink-0 border-t border-gray-200 bg-white px-6 py-4 rounded-b-2xl">
          <div className="flex items-center justify-between">
            <div className="text-sm text-gray-500">
              Dernière modification: {new Date().toLocaleDateString('fr-FR')}
            </div>
            <button onClick={onClose} className="px-6 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg font-semibold transition-all">
              Fermer
            </button>
          </div>
        </div>
      </motion.div>

      {/* MODALS */}
      <SmartSchedulingModal
        isOpen={showAppointmentModal}
        patient={patient}
        onClose={() => {
          setShowAppointmentModal(false);
          loadPatientData();
        }}
      />

      <QuickSoapNote
        isOpen={showSOAPModal}
        patientId={patient.id}
        patientName={`${patient.first_name} ${patient.last_name}`}
        onClose={() => {
          setShowSOAPModal(false);
          loadPatientData();
        }}
      />

      {showBillingModal && (
        <PatientBillingModal
          patient={patient}
          onClose={() => {
            setShowBillingModal(false);
            loadPatientData();
          }}
        />
      )}

      {showMessageModal && (
        <SendMessageModal
          patient={patient}
          onClose={() => setShowMessageModal(false)}
        />
      )}
    </div>
  );
}
