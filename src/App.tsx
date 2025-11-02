import { useState, useEffect, lazy, Suspense } from 'react';
import { Breadcrumbs } from './components/navigation/Breadcrumbs';
import { supabase } from './lib/supabase';
import { router, getBreadcrumbs } from './lib/router';
import { OrganizationProvider } from './contexts/OrganizationContext';

const AdminLogin = lazy(() => import('./pages/AdminLogin'));
const AdminDashboard = lazy(() => import('./pages/AdminDashboard'));
const AdminSignup = lazy(() => import('./pages/AdminSignup'));
const TestSignup = lazy(() => import('./pages/TestSignup'));
const DiagnosticPage = lazy(() => import('./pages/DiagnosticPage'));
const InvitationResponse = lazy(() => import('./pages/InvitationResponse'));
const RebookResponse = lazy(() => import('./pages/RebookResponse'));
const PatientPortalLogin = lazy(() => import('./pages/PatientPortalLogin'));
const PatientPortal = lazy(() => import('./pages/PatientPortal'));
const OnlineBooking = lazy(() => import('./pages/OnlineBooking').then(m => ({ default: m.OnlineBooking })));
const AppointmentManagement = lazy(() => import('./pages/AppointmentManagement'));
const WaitlistSignup = lazy(() => import('./components/WaitlistSignup').then(m => ({ default: m.WaitlistSignup })));
const OnboardingFlow = lazy(() => import('./pages/OnboardingFlow'));
const OrganizationSettings = lazy(() => import('./pages/OrganizationSettings'));
const SaaSAdminDashboard = lazy(() => import('./pages/SaaSAdminDashboard'));
const SaaSLandingPage = lazy(() => import('./pages/SaaSLandingPage'));
const ChiroflowPremiumLanding = lazy(() => import('./pages/ChiroflowPremiumLanding'));

function LoadingFallback() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-neutral-50">
      <div className="text-center">
        <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600"></div>
        <p className="mt-4 text-neutral-600">Chargement...</p>
      </div>
    </div>
  );
}

function App() {
  const [currentPath, setCurrentPath] = useState(router.getCurrentPath());
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    const unsubscribeRouter = router.subscribe((path) => {
      setCurrentPath(path);
    });

    return () => {
      unsubscribeRouter();
    };
  }, []);

  useEffect(() => {
    const checkAuth = async () => {
      const { data } = await supabase.auth.getSession();
      setIsAuthenticated(!!data?.session);
    };
    checkAuth();

    const { data: authListener } = supabase.auth.onAuthStateChange((event, session) => {
      setIsAuthenticated(!!session);
    });

    return () => {
      authListener.subscription.unsubscribe();
    };
  }, []);

  const handleAdminLogin = () => {
    router.navigate('/admin/dashboard', false);
  };

  const handlePatientLogin = () => {
    router.navigate('/patient/portal', false);
  };

  const renderPage = () => {
    const suspenseWrapper = (Component: React.ComponentType, props?: any) => (
      <Suspense fallback={<LoadingFallback />}>
        <Component {...props} />
      </Suspense>
    );

    if (currentPath === '/') return suspenseWrapper(ChiroflowPremiumLanding);
    if (currentPath === '/saas') return suspenseWrapper(SaaSLandingPage);
    if (currentPath === '/admin') return suspenseWrapper(AdminLogin, { onLogin: handleAdminLogin });
    if (currentPath === '/admin/dashboard') return suspenseWrapper(AdminDashboard);
    if (currentPath === '/admin/signup') return suspenseWrapper(AdminSignup);
    if (currentPath === '/admin/diagnostic') return suspenseWrapper(DiagnosticPage);
    if (currentPath === '/admin/test-signup') return suspenseWrapper(TestSignup);
    if (currentPath === '/invitation') return suspenseWrapper(InvitationResponse);
    if (currentPath === '/rebook') return suspenseWrapper(RebookResponse);
    if (currentPath === '/patient/login') return suspenseWrapper(PatientPortalLogin, { onLogin: handlePatientLogin });
    if (currentPath === '/patient/portal') return suspenseWrapper(PatientPortal);
    if (currentPath === '/booking') return suspenseWrapper(OnlineBooking);
    if (currentPath === '/waitlist') return suspenseWrapper(WaitlistSignup);
    if (currentPath === '/appointments') return suspenseWrapper(AppointmentManagement);
    if (currentPath === '/onboarding') return suspenseWrapper(OnboardingFlow);
    if (currentPath === '/organization/settings') return suspenseWrapper(OrganizationSettings);
    if (currentPath === '/saas/admin') return suspenseWrapper(SaaSAdminDashboard);

    return suspenseWrapper(ChiroflowPremiumLanding);
  };

  const showBreadcrumbs = [
    '/admin/dashboard',
    '/patient/portal',
    '/organization/settings',
    '/saas/admin',
  ].includes(currentPath);

  return (
    <OrganizationProvider>
      <div className="min-h-screen bg-white">
        {showBreadcrumbs && <Breadcrumbs items={getBreadcrumbs(currentPath)} />}
        <main>{renderPage()}</main>
      </div>
    </OrganizationProvider>
  );
}

export default App;
