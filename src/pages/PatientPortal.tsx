import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  CreditCard,
  Calendar,
  FileText,
  User,
  LogOut,
  Menu,
  X,
  AlertCircle,
  RefreshCw,
  CalendarPlus,
} from 'lucide-react';
import { supabase } from '../lib/supabase';
import { env } from '../lib/env';
import PatientPaymentDashboard from '../components/patient-portal/PatientPaymentDashboard';
import PatientAppointments from '../components/patient-portal/PatientAppointments';
import PatientDocuments from '../components/patient-portal/PatientDocuments';
import PatientProfile from '../components/patient-portal/PatientProfile';
import PatientBooking from '../components/patient-portal/PatientBooking';

type View = 'booking' | 'appointments' | 'payments' | 'documents' | 'profile';

type LoadingState = 'loading' | 'success' | 'error' | 'not-found';

export default function PatientPortal() {
  const [currentView, setCurrentView] = useState<View>('booking');
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [userInfo, setUserInfo] = useState<any>(null);
  const [patientData, setPatientData] = useState<any>(null);
  const [loadingState, setLoadingState] = useState<LoadingState>('loading');
  const [errorMessage, setErrorMessage] = useState<string>('');
  const [retryCount, setRetryCount] = useState(0);

  const syncAndLoadUserInfo = useCallback(async () => {
    const startTime = performance.now();
    try {
      setLoadingState('loading');
      setErrorMessage('');

      const [authResult, sessionResult] = await Promise.all([
        supabase.auth.getUser(),
        supabase.auth.getSession()
      ]);

      const { data: { user }, error: userError } = authResult;

      if (userError || !user) {
        setLoadingState('error');
        setErrorMessage('Session expirée. Veuillez vous reconnecter.');
        setTimeout(() => {
          window.location.href = '/patient-portal/login';
        }, 2000);
        return;
      }

      setUserInfo(user);

      const syncPromise = sessionResult.data?.session?.access_token
        ? fetch(`${env.supabaseUrl}/functions/v1/sync-patient-portal-user`, {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${sessionResult.data.session.access_token}`,
              'Content-Type': 'application/json',
            },
          }).catch(() => null)
        : Promise.resolve(null);

      const patientPromise = supabase
        .from('patients_full')
        .select('*')
        .eq('email', user.email)
        .maybeSingle();

      const [syncResponse, patientResult] = await Promise.all([syncPromise, patientPromise]);

      if (syncResponse) {
        try {
          const syncResult = await syncResponse.json();
          if (!syncResult.success && syncResult.needsRegistration) {
            setLoadingState('not-found');
            setErrorMessage(
              `Aucun dossier patient trouvé pour ${user.email}. Veuillez contacter votre clinique.`
            );
            return;
          }
        } catch (e) {
          if (import.meta.env.DEV) {
            console.warn(JSON.stringify({
              timestamp: new Date().toISOString(),
              level: 'WARN',
              message: 'Sync error but continuing',
              metadata: { component: 'PatientPortal' }
            }));
          }
        }
      }

      const { data: patient, error: patientError } = patientResult;

      if (patientError) {
        setLoadingState('error');
        setErrorMessage('Erreur lors du chargement de vos informations. Veuillez réessayer.');
        console.error(JSON.stringify({
          timestamp: new Date().toISOString(),
          level: 'ERROR',
          message: 'Error loading patient data',
          error: patientError.message,
          metadata: { component: 'PatientPortal', email: user.email }
        }));
        return;
      }

      if (!patient) {
        setLoadingState('not-found');
        setErrorMessage(
          `Aucun dossier patient trouvé pour ${user.email}. Veuillez contacter votre clinique.`
        );
        return;
      }

      setPatientData(patient);
      setLoadingState('success');

      const duration = performance.now() - startTime;
      if (import.meta.env.DEV) {
        console.log(JSON.stringify({
          timestamp: new Date().toISOString(),
          level: 'INFO',
          message: 'Patient portal authentication complete',
          duration,
          metadata: { component: 'PatientPortal', userId: user.id }
        }));
      }
    } catch (error) {
      const duration = performance.now() - startTime;
      console.error(JSON.stringify({
        timestamp: new Date().toISOString(),
        level: 'ERROR',
        message: 'Unexpected error in patient portal',
        error: error instanceof Error ? error.message : String(error),
        duration,
        metadata: { component: 'PatientPortal' }
      }));
      setLoadingState('error');
      setErrorMessage('Une erreur inattendue est survenue. Veuillez réessayer.');
    }
  }, [retryCount]);

  useEffect(() => {
    syncAndLoadUserInfo();
  }, [syncAndLoadUserInfo]);

  function handleRetry() {
    setRetryCount(prev => prev + 1);
  }

  async function handleLogout() {
    await supabase.auth.signOut();
    window.location.href = '/patient-portal/login';
  }

  const navigation = [
    { id: 'booking', label: 'Réserver', icon: CalendarPlus },
    { id: 'appointments', label: 'Mes rendez-vous', icon: Calendar },
    { id: 'payments', label: 'Paiements', icon: CreditCard },
    { id: 'documents', label: 'Documents', icon: FileText },
    { id: 'profile', label: 'Mon profil', icon: User },
  ];

  // Affichage du loader pendant le chargement
  if (loadingState === 'loading') {
    return (
      <div className="min-h-screen bg-gradient-to-b from-neutral-50 via-background to-neutral-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-gold-400 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-lg font-medium text-foreground">Chargement de votre portail...</p>
          <p className="text-sm text-foreground/60 mt-2">Veuillez patienter</p>
        </div>
      </div>
    );
  }

  // Affichage d'erreur
  if (loadingState === 'error') {
    return (
      <div className="min-h-screen bg-gradient-to-b from-neutral-50 via-background to-neutral-50 flex items-center justify-center p-6">
        <div className="max-w-md w-full bg-white border border-red-200 shadow-lifted rounded-lg p-8 text-center">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <AlertCircle className="w-8 h-8 text-red-600" />
          </div>
          <h2 className="text-2xl font-heading text-foreground mb-3">Erreur de chargement</h2>
          <p className="text-foreground/70 mb-6">{errorMessage}</p>
          <div className="flex gap-3 justify-center">
            <button
              onClick={handleRetry}
              className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-gold-500 to-gold-600 text-white hover:from-gold-600 hover:to-gold-700 transition-all rounded-lg shadow-soft"
            >
              <RefreshCw className="w-4 h-4" />
              Réessayer
            </button>
            <button
              onClick={handleLogout}
              className="px-6 py-3 border border-neutral-300 text-foreground hover:bg-neutral-50 transition-all rounded-lg"
            >
              Déconnexion
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Affichage si patient non trouvé
  if (loadingState === 'not-found') {
    return (
      <div className="min-h-screen bg-gradient-to-b from-neutral-50 via-background to-neutral-50 flex items-center justify-center p-6">
        <div className="max-w-md w-full bg-white border border-orange-200 shadow-lifted rounded-lg p-8 text-center">
          <div className="w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <User className="w-8 h-8 text-orange-600" />
          </div>
          <h2 className="text-2xl font-heading text-foreground mb-3">Dossier patient non trouvé</h2>
          <p className="text-foreground/70 mb-6">{errorMessage}</p>
          <div className="flex gap-3 justify-center">
            <button
              onClick={() => window.location.href = '/'}
              className="px-6 py-3 bg-gradient-to-r from-gold-500 to-gold-600 text-white hover:from-gold-600 hover:to-gold-700 transition-all rounded-lg shadow-soft"
            >
              Retour à l'accueil
            </button>
            <button
              onClick={handleLogout}
              className="px-6 py-3 border border-neutral-300 text-foreground hover:bg-neutral-50 transition-all rounded-lg"
            >
              Déconnexion
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-neutral-50 via-background to-neutral-50 flex">
      {/* Mobile overlay backdrop */}
      {mobileMenuOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 md:hidden"
          onClick={() => setMobileMenuOpen(false)}
        />
      )}

      {/* Desktop sidebar */}
      <motion.div
        initial={false}
        animate={{ width: sidebarOpen ? 280 : 80 }}
        className="hidden md:flex bg-white border-r border-neutral-200 flex-col relative z-20"
      >
        <div className="p-6 border-b border-neutral-200">
          <div className="flex items-center justify-between">
            {sidebarOpen ? (
              <div>
                <h2 className="font-heading text-xl tracking-tight text-foreground">
                  ChiroFlow AI
                </h2>
                <p className="text-xs text-foreground/60 mt-1">Portail Patient</p>
              </div>
            ) : (
              <div className="w-10 h-10 bg-gradient-to-br from-gold-400 to-gold-600 rounded-xl flex items-center justify-center">
                <span className="text-white font-bold text-lg">C</span>
              </div>
            )}
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="p-2 hover:bg-neutral-100 rounded-lg transition-colors"
            >
              {sidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>

        <nav className="flex-1 p-4 space-y-2">
          {navigation.map((item) => (
            <button
              key={item.id}
              onClick={() => setCurrentView(item.id as View)}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${
                currentView === item.id
                  ? 'bg-gradient-to-r from-gold-500 to-gold-600 text-white shadow-gold'
                  : 'text-foreground/70 hover:bg-neutral-100 hover:text-foreground'
              }`}
            >
              <item.icon className="w-5 h-5" />
              {sidebarOpen && <span className="font-light">{item.label}</span>}
            </button>
          ))}
        </nav>

        <div className="p-4 border-t border-neutral-200">
          <div className={`flex items-center gap-3 ${!sidebarOpen && 'justify-center'}`}>
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-gold-400 to-gold-600 flex items-center justify-center text-white font-semibold text-sm">
              {patientData?.first_name?.charAt(0) || userInfo?.email?.charAt(0) || 'P'}
            </div>
            {sidebarOpen && (
              <div className="flex-1 min-w-0">
                <div className="text-sm font-medium text-foreground truncate">
                  {patientData?.first_name} {patientData?.last_name}
                </div>
                <div className="text-xs text-foreground/60 truncate">{userInfo?.email}</div>
              </div>
            )}
          </div>
          {sidebarOpen && (
            <button
              onClick={handleLogout}
              className="w-full mt-3 flex items-center justify-center gap-2 px-4 py-2 text-sm text-red-600 hover:bg-red-50 rounded-lg transition-colors"
            >
              <LogOut className="w-4 h-4" />
              <span>Déconnexion</span>
            </button>
          )}
        </div>
      </motion.div>

      {/* Mobile sidebar */}
      <motion.div
        initial={{ x: -280 }}
        animate={{ x: mobileMenuOpen ? 0 : -280 }}
        transition={{ type: 'spring', damping: 25, stiffness: 200 }}
        className="fixed top-0 left-0 h-full w-72 bg-white border-r border-neutral-200 flex flex-col z-50 md:hidden"
      >
        <div className="p-6 border-b border-neutral-200">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="font-heading text-xl tracking-tight text-foreground">
                ChiroFlow AI
              </h2>
              <p className="text-xs text-foreground/60 mt-1">Portail Patient</p>
            </div>
            <button
              onClick={() => setMobileMenuOpen(false)}
              className="p-2 hover:bg-neutral-100 rounded-lg transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
          {navigation.map((item) => (
            <button
              key={item.id}
              onClick={() => {
                setCurrentView(item.id as View);
                setMobileMenuOpen(false);
              }}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${
                currentView === item.id
                  ? 'bg-gradient-to-r from-gold-500 to-gold-600 text-white shadow-gold'
                  : 'text-foreground/70 hover:bg-neutral-100 hover:text-foreground'
              }`}
            >
              <item.icon className="w-5 h-5" />
              <span className="font-light">{item.label}</span>
            </button>
          ))}
        </nav>

        <div className="p-4 border-t border-neutral-200">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-gold-400 to-gold-600 flex items-center justify-center text-white font-semibold text-sm">
              {patientData?.first_name?.charAt(0) || userInfo?.email?.charAt(0) || 'P'}
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-sm font-medium text-foreground truncate">
                {patientData?.first_name} {patientData?.last_name}
              </div>
              <div className="text-xs text-foreground/60 truncate">{userInfo?.email}</div>
            </div>
          </div>
          <button
            onClick={() => {
              handleLogout();
              setMobileMenuOpen(false);
            }}
            className="w-full mt-3 flex items-center justify-center gap-2 px-4 py-2 text-sm text-red-600 hover:bg-red-50 rounded-lg transition-colors"
          >
            <LogOut className="w-4 h-4" />
            <span>Déconnexion</span>
          </button>
        </div>
      </motion.div>

      <div className="flex-1 overflow-y-auto">
        {/* Mobile header */}
        <div className="md:hidden bg-white border-b border-neutral-200 px-4 py-3 sticky top-0 z-30 flex items-center justify-between">
          <button
            onClick={() => setMobileMenuOpen(true)}
            className="p-2 hover:bg-neutral-100 rounded-lg transition-colors"
          >
            <Menu className="w-6 h-6" />
          </button>
          <h1 className="text-lg font-heading text-foreground">
            {navigation.find((n) => n.id === currentView)?.label}
          </h1>
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-gold-400 to-gold-600 flex items-center justify-center text-white font-semibold text-sm">
            {patientData?.first_name?.charAt(0) || userInfo?.email?.charAt(0) || 'P'}
          </div>
        </div>

        {/* Desktop header */}
        <div className="hidden md:block bg-white/80 backdrop-blur-xl border-b border-neutral-200/50 sticky top-0 z-30">
          <div className="px-8 py-6">
            <h1 className="text-2xl font-heading text-foreground">
              {navigation.find((n) => n.id === currentView)?.label}
            </h1>
            <p className="text-sm text-foreground/60 mt-1">
              Bienvenue, {patientData?.first_name || 'Patient'}
            </p>
          </div>
        </div>

        <div className="p-8">
          <AnimatePresence mode="wait">
            <motion.div
              key={currentView}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
            >
          {currentView === 'booking' && patientData && (
            <PatientBooking
              patientId={patientData.id}
              patientEmail={patientData.email}
              patientName={`${patientData.first_name} ${patientData.last_name}`}
            />
          )}
          {currentView === 'appointments' && patientData && userInfo && (
            <PatientAppointments patientId={patientData.id} patientUserId={userInfo.id} />
          )}
          {currentView === 'payments' && patientData && (
            <PatientPaymentDashboard patientId={patientData.id} />
          )}
          {currentView === 'documents' && patientData && (
            <PatientDocuments patientId={patientData.id} />
          )}
          {currentView === 'profile' && patientData && (
            <PatientProfile patient={patientData} onUpdate={syncAndLoadUserInfo} />
          )}
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
