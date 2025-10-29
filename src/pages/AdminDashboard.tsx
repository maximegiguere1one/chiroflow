import { motion } from 'framer-motion';
import {
  Users, Calendar, DollarSign, TrendingUp, Clock, Activity, Menu
} from 'lucide-react';
import { useEffect, useState, lazy, Suspense } from 'react';
import { supabase } from '../lib/supabase';
import { useKeyboardShortcuts } from '../hooks/useKeyboardShortcuts';
import { ShortcutsHelp } from '../components/common/ShortcutsHelp';
import { QuickSoapNote } from '../components/dashboard/QuickSoapNote';
import { AdminSidebar, type AdminView } from '../components/navigation/AdminSidebar';
import { Breadcrumbs } from '../components/navigation/Breadcrumbs';
import { GlobalSearch } from '../components/common/GlobalSearch';
import { TodayDashboard } from '../components/dashboard/TodayDashboard';

const PatientManager = lazy(() => import('../components/dashboard/PatientListUltraClean'));
const AppointmentsPage = lazy(() => import('../components/dashboard/AppointmentsPageEnhanced').then(m => ({ default: m.AppointmentsPageEnhanced })));
const BillingPage = lazy(() => import('../components/dashboard/BillingPage').then(m => ({ default: m.BillingPage })));
const SettingsPage = lazy(() => import('../components/dashboard/SettingsPage').then(m => ({ default: m.SettingsPage })));
const QuickActions = lazy(() => import('../components/dashboard/QuickActions').then(m => ({ default: m.QuickActions })));
const EnhancedCalendar = lazy(() => import('../components/dashboard/EnhancedCalendar').then(m => ({ default: m.EnhancedCalendar })));
const PatientProgressTracking = lazy(() => import('../components/dashboard/PatientProgressTracking').then(m => ({ default: m.PatientProgressTracking })));
const BatchOperations = lazy(() => import('../components/dashboard/BatchOperations').then(m => ({ default: m.BatchOperations })));
const AnalyticsDashboard = lazy(() => import('../components/dashboard/AnalyticsDashboard').then(m => ({ default: m.AnalyticsDashboard })));
const InsuranceClaimsManager = lazy(() => import('../components/dashboard/InsuranceClaimsManager').then(m => ({ default: m.InsuranceClaimsManager })));
const DualWaitlistManager = lazy(() => import('../components/dashboard/DualWaitlistManager').then(m => ({ default: m.DualWaitlistManager })));
const RebookingManager = lazy(() => import('../components/dashboard/RebookingManager'));
const AdminPaymentManagement = lazy(() => import('../components/dashboard/AdminPaymentManagement').then(m => ({ default: m.AdminPaymentManagement })));
const SystemMonitoring = lazy(() => import('../components/dashboard/SystemMonitoring'));
const AdvancedSettings = lazy(() => import('../components/dashboard/AdvancedSettings').then(m => ({ default: m.AdvancedSettings })));
const AutomationDashboard = lazy(() => import('../components/dashboard/AutomationDashboard'));
const ActionableAnalytics = lazy(() => import('../components/dashboard/ActionableAnalytics').then(m => ({ default: m.ActionableAnalytics })));
const OneClickBatchOps = lazy(() => import('../components/dashboard/OneClickBatchOps').then(m => ({ default: m.OneClickBatchOps })));
const CancellationAutomationMonitor = lazy(() => import('../components/dashboard/CancellationAutomationMonitor').then(m => ({ default: m.CancellationAutomationMonitor })));
const AutomationHealthDashboard = lazy(() => import('../components/dashboard/AutomationHealthDashboard').then(m => ({ default: m.AutomationHealthDashboard })));

interface DashboardStats {
  totalPatients: number;
  activePatients: number;
  appointmentsToday: number;
  pendingAppointments: number;
  monthlyRevenue: number;
  avgVisitDuration: number;
  patientSatisfaction: number;
}

export default function AdminDashboard() {
  const [currentView, setCurrentView] = useState<AdminView>('dashboard');
  const [stats, setStats] = useState<DashboardStats>({
    totalPatients: 0,
    activePatients: 0,
    appointmentsToday: 0,
    pendingAppointments: 0,
    monthlyRevenue: 0,
    avgVisitDuration: 30,
    patientSatisfaction: 4.9
  });
  const [loading, setLoading] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [userProfile, setUserProfile] = useState<any>(null);
  const [showQuickSoap, setShowQuickSoap] = useState(false);
  const [showShortcuts, setShowShortcuts] = useState(false);
  const [showGlobalSearch, setShowGlobalSearch] = useState(false);

  useEffect(() => {
    loadDashboardData();
    loadUserProfile();
  }, []);

  // Keyboard shortcuts
  useKeyboardShortcuts([
    {
      key: 'k',
      ctrlKey: true,
      action: () => setShowGlobalSearch(true),
      description: 'Recherche globale'
    },
    {
      key: 'n',
      ctrlKey: true,
      action: () => setCurrentView('patients'),
      description: 'Nouveau patient'
    },
    {
      key: 'r',
      ctrlKey: true,
      action: () => setCurrentView('appointments'),
      description: 'Rendez-vous'
    },
    {
      key: 's',
      ctrlKey: true,
      action: () => setShowQuickSoap(true),
      description: 'Note SOAP rapide'
    },
    {
      key: 't',
      ctrlKey: true,
      action: () => setCurrentView('dashboard'),
      description: 'Vue Today'
    },
    {
      key: 'b',
      ctrlKey: true,
      action: () => setCurrentView('billing'),
      description: 'Facturation'
    },
    {
      key: '?',
      action: () => setShowShortcuts(true),
      description: 'Afficher l\'aide'
    }
  ]);

  async function loadUserProfile() {
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .maybeSingle();

      setUserProfile(profile || { email: user.email, full_name: user.email?.split('@')[0] });
    }
  }

  async function loadDashboardData() {
    try {
      const today = new Date().toISOString().split('T')[0];

      const [patientsRes, appointmentsRes, analyticsRes] = await Promise.all([
        supabase.from('patients_full').select('*'),
        supabase.from('appointments_api').select('*'),
        supabase.from('analytics_dashboard').select('*')
      ]);

      if (!patientsRes.error && patientsRes.data) {
        const active = patientsRes.data.filter(p => p.status === 'active').length;
        setStats(prev => ({
          ...prev,
          totalPatients: patientsRes.data.length,
          activePatients: active
        }));
      }

      if (!appointmentsRes.error && appointmentsRes.data) {
        const todayAppts = appointmentsRes.data.filter(a =>
          a.created_at?.startsWith(today)
        ).length;
        const pending = appointmentsRes.data.filter(a =>
          a.status === 'pending'
        ).length;

        setStats(prev => ({
          ...prev,
          appointmentsToday: todayAppts,
          pendingAppointments: pending
        }));
      }

      if (!analyticsRes.error && analyticsRes.data) {
        analyticsRes.data.forEach(metric => {
          if (metric.metric_name === 'total_revenue_month') {
            setStats(prev => ({ ...prev, monthlyRevenue: parseFloat(metric.metric_value) }));
          }
          if (metric.metric_name === 'avg_visit_duration') {
            setStats(prev => ({ ...prev, avgVisitDuration: parseFloat(metric.metric_value) }));
          }
          if (metric.metric_name === 'patient_satisfaction') {
            setStats(prev => ({ ...prev, patientSatisfaction: parseFloat(metric.metric_value) }));
          }
        });
      }

      setLoading(false);
    } catch (error) {
      console.error('Error loading dashboard:', error);
      setLoading(false);
    }
  }

  async function handleLogout() {
    await supabase.auth.signOut();
    window.location.href = '/';
  }

  const viewBreadcrumbs: Record<AdminView, Array<{ name: string; path: string }>> = {
    'dashboard': [
      { name: 'Accueil', path: '/' },
      { name: 'Admin', path: '/admin' },
      { name: 'Tableau de bord', path: '/admin/dashboard' }
    ],
    'patients': [
      { name: 'Accueil', path: '/' },
      { name: 'Admin', path: '/admin' },
      { name: 'Patients', path: '/admin/patients' }
    ],
    'appointments': [
      { name: 'Accueil', path: '/' },
      { name: 'Admin', path: '/admin' },
      { name: 'Rendez-vous', path: '/admin/appointments' }
    ],
    'calendar': [
      { name: 'Accueil', path: '/' },
      { name: 'Admin', path: '/admin' },
      { name: 'Calendrier', path: '/admin/calendar' }
    ],
    'billing': [
      { name: 'Accueil', path: '/' },
      { name: 'Admin', path: '/admin' },
      { name: 'Facturation', path: '/admin/billing' }
    ],
    'payments': [
      { name: 'Accueil', path: '/' },
      { name: 'Admin', path: '/admin' },
      { name: 'Paiements', path: '/admin/payments' }
    ],
    'settings': [
      { name: 'Accueil', path: '/' },
      { name: 'Admin', path: '/admin' },
      { name: 'Paramètres', path: '/admin/settings' }
    ],
    'quick-actions': [
      { name: 'Accueil', path: '/' },
      { name: 'Admin', path: '/admin' },
      { name: 'Actions rapides', path: '/admin/quick-actions' }
    ],
    'analytics': [
      { name: 'Accueil', path: '/' },
      { name: 'Admin', path: '/admin' },
      { name: 'Analytiques', path: '/admin/analytics' }
    ],
    'batch': [
      { name: 'Accueil', path: '/' },
      { name: 'Admin', path: '/admin' },
      { name: 'Opérations groupées', path: '/admin/batch' }
    ],
    'progress': [
      { name: 'Accueil', path: '/' },
      { name: 'Admin', path: '/admin' },
      { name: 'Progrès patients', path: '/admin/progress' }
    ],
    'insurance': [
      { name: 'Accueil', path: '/' },
      { name: 'Admin', path: '/admin' },
      { name: 'Assurances', path: '/admin/insurance' }
    ],
    'waitlist': [
      { name: 'Accueil', path: '/' },
      { name: 'Admin', path: '/admin' },
      { name: 'Liste d\'attente', path: '/admin/waitlist' }
    ],
    'rebooking': [
      { name: 'Accueil', path: '/' },
      { name: 'Admin', path: '/admin' },
      { name: 'Re-réservations', path: '/admin/rebooking' }
    ],
    'monitoring': [
      { name: 'Accueil', path: '/' },
      { name: 'Admin', path: '/admin' },
      { name: 'Surveillance', path: '/admin/monitoring' }
    ],
    'advanced-settings': [
      { name: 'Accueil', path: '/' },
      { name: 'Admin', path: '/admin' },
      { name: 'Paramètres avancés', path: '/admin/advanced-settings' }
    ],
    'automation': [
      { name: 'Accueil', path: '/' },
      { name: 'Admin', path: '/admin' },
      { name: 'Automatisation', path: '/admin/automation' }
    ],
    'actionable-analytics': [
      { name: 'Accueil', path: '/' },
      { name: 'Admin', path: '/admin' },
      { name: 'Analytics Actionables', path: '/admin/actionable-analytics' }
    ],
    'one-click-batch': [
      { name: 'Accueil', path: '/' },
      { name: 'Admin', path: '/admin' },
      { name: 'Batch 1-Clic', path: '/admin/one-click-batch' }
    ],
    'cancellation-automation': [
      { name: 'Accueil', path: '/' },
      { name: 'Admin', path: '/admin' },
      { name: 'Automatisation Annulations', path: '/admin/cancellation-automation' }
    ],
    'automation-health': [
      { name: 'Accueil', path: '/' },
      { name: 'Admin', path: '/admin' },
      { name: 'Santé Automatisations', path: '/admin/automation-health' }
    ]
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-neutral-50 via-background to-neutral-50 flex">
      <AdminSidebar
        currentView={currentView}
        onViewChange={setCurrentView}
        onLogout={handleLogout}
        userProfile={userProfile}
        isOpen={sidebarOpen}
        onToggle={() => setSidebarOpen(!sidebarOpen)}
      />

      {/* Main Content */}
      <div
        className="flex-1 overflow-y-auto transition-all duration-300 w-full lg:w-auto"
        style={{
          marginLeft: window.innerWidth >= 1024 ? (sidebarOpen ? '280px' : '80px') : '0',
          width: window.innerWidth >= 1024 ? (sidebarOpen ? 'calc(100% - 280px)' : 'calc(100% - 80px)') : '100%'
        }}
      >
        {/* Header with Breadcrumbs */}
        <div className="bg-white/80 backdrop-blur-xl border-b border-neutral-200/50 sticky top-0 z-30">
          <div className="px-4 lg:px-8 py-6">
            <div className="flex items-center gap-4 mb-4">
              <button
                onClick={() => setSidebarOpen(!sidebarOpen)}
                className="lg:hidden p-2 hover:bg-neutral-100 rounded-lg transition-colors"
              >
                <Menu className="w-6 h-6" />
              </button>
              <Breadcrumbs items={viewBreadcrumbs[currentView] || []} className="flex-1" />
            </div>
            <h1 className="text-2xl font-heading text-foreground">
              {viewBreadcrumbs[currentView]?.[viewBreadcrumbs[currentView].length - 1]?.name || 'Admin'}
            </h1>
            <p className="text-sm text-foreground/60 mt-1">
              {new Date().toLocaleDateString('fr-CA', {
                weekday: 'long',
                year: 'numeric',
                month: 'long',
                day: 'numeric'
              })}
            </p>
          </div>
        </div>

        {/* Content */}
        <div className="p-8">
          {loading && currentView === 'dashboard' ? (
            <div className="flex items-center justify-center py-20">
              <div className="text-center">
                <div className="w-12 h-12 border-4 border-gold-400 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
                <p className="text-foreground/60 font-light">Chargement...</p>
              </div>
            </div>
          ) : (
            <Suspense fallback={<LoadingSpinner />}>
              {currentView === 'dashboard' && <TodayDashboard />}
              {currentView === 'quick-actions' && (
                <QuickActions
                  onNewPatient={() => setCurrentView('patients')}
                  onNewAppointment={() => setCurrentView('appointments')}
                  onNewNote={() => setShowQuickSoap(true)}
                  onViewCalendar={() => setCurrentView('calendar')}
                  onBilling={() => setCurrentView('billing')}
                  onReminders={() => setCurrentView('batch')}
                  onReports={() => setCurrentView('analytics')}
                  onBatchActions={() => setCurrentView('batch')}
                />
              )}
              {currentView === 'patients' && <PatientManager />}
              {currentView === 'analytics' && <AnalyticsDashboard />}
              {currentView === 'calendar' && <EnhancedCalendar onAppointmentClick={(_id) => {}} />}
              {currentView === 'appointments' && <AppointmentsPage />}
              {currentView === 'progress' && <PatientProgressTracking />}
              {currentView === 'batch' && <BatchOperations />}
              {currentView === 'billing' && <BillingPage />}
              {currentView === 'payments' && <AdminPaymentManagement />}
              {currentView === 'insurance' && <InsuranceClaimsManager />}
              {currentView === 'waitlist' && <DualWaitlistManager />}
              {currentView === 'rebooking' && <RebookingManager />}
              {currentView === 'monitoring' && <SystemMonitoring />}
              {currentView === 'advanced-settings' && <AdvancedSettings />}
              {currentView === 'automation' && <AutomationDashboard />}
              {currentView === 'actionable-analytics' && <ActionableAnalytics />}
              {currentView === 'one-click-batch' && <OneClickBatchOps />}
              {currentView === 'cancellation-automation' && <CancellationAutomationMonitor />}
              {currentView === 'automation-health' && <AutomationHealthDashboard />}
              {currentView === 'settings' && <SettingsPage />}
            </Suspense>
          )}
        </div>
      </div>

      <QuickSoapNote
        isOpen={showQuickSoap}
        onClose={() => setShowQuickSoap(false)}
      />

      <ShortcutsHelp
        isOpen={showShortcuts}
        onClose={() => setShowShortcuts(false)}
        shortcuts={[
          { key: 'k', ctrlKey: true, action: () => {}, description: 'Recherche globale' },
          { key: 't', ctrlKey: true, action: () => {}, description: 'Vue Today' },
          { key: 'n', ctrlKey: true, action: () => {}, description: 'Nouveau patient' },
          { key: 'r', ctrlKey: true, action: () => {}, description: 'Rendez-vous' },
          { key: 's', ctrlKey: true, action: () => {}, description: 'Note SOAP rapide' },
          { key: 'b', ctrlKey: true, action: () => {}, description: 'Facturation' },
          { key: '?', action: () => {}, description: 'Afficher l\'aide' },
        ]}
      />

      <GlobalSearch
        isOpen={showGlobalSearch}
        onClose={() => setShowGlobalSearch(false)}
        onNavigate={(view, id) => {
          setCurrentView(view as AdminView);
          setShowGlobalSearch(false);
        }}
      />

    </div>
  );
}

function LoadingSpinner() {
  return (
    <div className="flex items-center justify-center py-20">
      <div className="text-center">
        <div className="w-12 h-12 border-4 border-gold-400 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
        <p className="text-foreground/60 font-light">Chargement...</p>
      </div>
    </div>
  );
}

function DashboardView({ stats }: { stats: DashboardStats }) {
  const statCards = [
    {
      title: 'Patients totaux',
      value: stats.totalPatients,
      change: '+12%',
      icon: Users,
      color: 'from-gold-400 to-gold-600',
      bgColor: 'from-gold-50 to-gold-100'
    },
    {
      title: 'Patients actifs',
      value: stats.activePatients,
      change: '+8%',
      icon: Activity,
      color: 'from-neutral-600 to-foreground',
      bgColor: 'from-neutral-50 to-neutral-100'
    },
    {
      title: 'RDV en attente',
      value: stats.pendingAppointments,
      change: '',
      icon: Calendar,
      color: 'from-gold-500 to-neutral-700',
      bgColor: 'from-gold-50 to-neutral-50'
    },
    {
      title: 'Revenus du mois',
      value: `${stats.monthlyRevenue.toLocaleString('fr-CA', { style: 'currency', currency: 'CAD' })}`,
      change: '+15%',
      icon: DollarSign,
      color: 'from-gold-600 to-gold-400',
      bgColor: 'from-gold-100 to-gold-50'
    }
  ];

  return (
    <div className="space-y-8">
      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {statCards.map((stat, index) => (
          <motion.div
            key={index}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1, duration: 0.5 }}
            className="relative group"
          >
            <div className={`bg-gradient-to-br ${stat.bgColor} border border-white/40 p-6 shadow-soft hover:shadow-soft-lg transition-all duration-300`}>
              <div className="flex items-start justify-between mb-4">
                <div className={`w-12 h-12 rounded-2xl bg-gradient-to-br ${stat.color} flex items-center justify-center shadow-soft`}>
                  <stat.icon className="w-6 h-6 text-white" />
                </div>
                {stat.change && (
                  <span className="text-xs font-medium text-green-600 bg-green-50 px-2 py-1 rounded-full">
                    {stat.change}
                  </span>
                )}
              </div>
              <div>
                <div className="text-3xl font-light text-foreground tracking-tight mb-1">
                  {stat.value}
                </div>
                <div className="text-sm text-foreground/60 font-light">{stat.title}</div>
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Performance Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-gradient-to-br from-gold-50 to-gold-100 border border-gold-200/40 p-6">
          <div className="flex items-center justify-between mb-4">
            <Clock className="w-6 h-6 text-gold-600" />
            <span className="text-xs text-gold-700 bg-gold-200/50 px-2 py-1 rounded-full">Moyenne</span>
          </div>
          <div className="text-3xl font-light text-foreground mb-1">{stats.avgVisitDuration} min</div>
          <div className="text-sm text-foreground/60 font-light">Durée moyenne visite</div>
        </div>

        <div className="bg-gradient-to-br from-neutral-50 to-neutral-100 border border-neutral-200/40 p-6">
          <div className="flex items-center justify-between mb-4">
            <Activity className="w-6 h-6 text-neutral-700" />
            <span className="text-xs text-green-700 bg-green-100 px-2 py-1 rounded-full">↑ 12%</span>
          </div>
          <div className="text-3xl font-light text-foreground mb-1">92%</div>
          <div className="text-sm text-foreground/60 font-light">Taux de présence</div>
        </div>

        <div className="bg-gradient-to-br from-gold-100 to-neutral-100 border border-gold-200/40 p-6">
          <div className="flex items-center justify-between mb-4">
            <TrendingUp className="w-6 h-6 text-gold-600" />
            <span className="text-xs text-gold-700 bg-gold-200/50 px-2 py-1 rounded-full">★ {stats.patientSatisfaction}</span>
          </div>
          <div className="text-3xl font-light text-foreground mb-1">{stats.patientSatisfaction}/5</div>
          <div className="text-sm text-foreground/60 font-light">Satisfaction patients</div>
        </div>
      </div>
    </div>
  );
}

