import { useState, useEffect } from 'react';
import { ImprovedHeader } from './components/navigation/ImprovedHeader';
import { Breadcrumbs } from './components/navigation/Breadcrumbs';
import Hero from './components/Hero';
import Services from './components/Services';
import About from './components/About';
import Testimonials from './components/Testimonials';
import Contact from './components/Contact';
import Footer from './components/Footer';
import AppointmentModal from './components/AppointmentModal';
import StickyCTA from './components/StickyCTA';
import AdminLogin from './pages/AdminLogin';
import AdminDashboard from './pages/AdminDashboard';
import AdminSignup from './pages/AdminSignup';
import InvitationResponse from './pages/InvitationResponse';
import RebookResponse from './pages/RebookResponse';
import PatientPortalLogin from './pages/PatientPortalLogin';
import PatientPortal from './pages/PatientPortal';
import { OnlineBooking } from './pages/OnlineBooking';
import AppointmentManagement from './pages/AppointmentManagement';
import { supabase } from './lib/supabase';
import { router, getBreadcrumbs } from './lib/router';

function AppWithImprovedNavigation() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentPath, setCurrentPath] = useState(router.getCurrentPath());
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [_userRole, setUserRole] = useState<'admin' | 'patient' | null>(null);
  const isAgendaFull = true;

  useEffect(() => {
    // Subscribe to route changes
    const unsubscribe = router.subscribe((path) => {
      setCurrentPath(path);
    });

    // Check authentication
    supabase.auth.getSession().then(({ data: { session } }) => {
      setIsAuthenticated(!!session);
      if (session) {
        // Determine user role based on path or profile
        const path = router.getCurrentPath();
        if (path.startsWith('/admin')) {
          setUserRole('admin');
        } else if (path.startsWith('/patient-portal')) {
          setUserRole('patient');
        }
      }
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setIsAuthenticated(!!session);
      if (!session) {
        setUserRole(null);
        // Redirect to login if on protected route
        const path = router.getCurrentPath();
        if (path.startsWith('/admin') && path !== '/admin' && path !== '/admin/signup') {
          router.navigate('/admin', true);
        } else if (path.startsWith('/patient-portal') && path !== '/patient-portal/login') {
          router.navigate('/patient-portal/login', true);
        }
      }
    });

    return () => {
      unsubscribe();
      subscription.unsubscribe();
    };
  }, []);

  const handleOpenModal = () => {
    setIsModalOpen(true);
  };

  const handleAdminLogin = () => {
    setUserRole('admin');
    router.navigate('/admin/dashboard');
  };

  const handlePatientLogin = () => {
    setUserRole('patient');
    router.navigate('/patient-portal');
  };

  // Get matched route
  const { route } = router.getMatchedRoute();

  // Render based on current route
  const renderContent = () => {
    // Special routes (no header/footer)
    if (route?.component === 'InvitationResponse') {
      return <InvitationResponse />;
    }
    if (route?.component === 'RebookResponse') {
      return <RebookResponse />;
    }
    if (route?.component === 'AppointmentManagement') {
      return <AppointmentManagement />;
    }

    // Admin routes
    if (route?.role === 'admin') {
      if (route.component === 'AdminSignup') {
        return <AdminSignup />;
      }
      if (route.component === 'AdminLogin') {
        return <AdminLogin onLogin={handleAdminLogin} />;
      }
      if (route.component === 'AdminDashboard' && isAuthenticated) {
        return <AdminDashboard />;
      }
      // Redirect to login if not authenticated
      if (route.requiresAuth && !isAuthenticated) {
        router.navigate('/admin', true);
        return <AdminLogin onLogin={handleAdminLogin} />;
      }
    }

    // Patient portal routes
    if (route?.role === 'patient') {
      if (route.component === 'PatientPortalLogin') {
        return <PatientPortalLogin onLogin={handlePatientLogin} />;
      }
      if (route.component === 'PatientPortal' && isAuthenticated) {
        return <PatientPortal />;
      }
      // Redirect to login if not authenticated
      if (route.requiresAuth && !isAuthenticated) {
        router.navigate('/patient-portal/login', true);
        return <PatientPortalLogin onLogin={handlePatientLogin} />;
      }
    }

    // Online booking
    if (route?.component === 'OnlineBooking') {
      return <OnlineBooking />;
    }

    // Public site (default)
    const breadcrumbs = getBreadcrumbs(currentPath);

    return (
      <div className="min-h-screen bg-white">
        <ImprovedHeader
          onOpenAppointment={handleOpenModal}
          isAgendaFull={isAgendaFull}
          showAdminLink={true}
        />

        {breadcrumbs.length > 1 && (
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-24">
            <Breadcrumbs items={breadcrumbs} />
          </div>
        )}

        <main>
          <Hero
            onOpenAppointment={handleOpenModal}
            isAgendaFull={isAgendaFull}
          />
          <Services />
          <About />
          <Testimonials />
          <Contact />
        </main>

        <Footer />

        <StickyCTA
          onOpenAppointment={handleOpenModal}
          isAgendaFull={isAgendaFull}
        />

        <AppointmentModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          isAgendaFull={isAgendaFull}
        />
      </div>
    );
  };

  return renderContent();
}

export default AppWithImprovedNavigation;
