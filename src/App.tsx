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
import { WaitlistSignup } from './components/WaitlistSignup';
import { supabase } from './lib/supabase';
import { router, getBreadcrumbs } from './lib/router';

function App() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentPath, setCurrentPath] = useState(router.getCurrentPath());
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const isAgendaFull = true;

  const handleOpenModal = () => {
    setIsModalOpen(true);
  };

  useEffect(() => {
    // Rediriger la page d'accueil vers /admin par défaut
    if (router.getCurrentPath() === '/') {
      router.navigate('/admin', true);
    }

    const unsubscribeRouter = router.subscribe((path) => {
      setCurrentPath(path);
      // Rediriger / vers /admin si on arrive sur la racine
      if (path === '/') {
        router.navigate('/admin', true);
      }
    });

    supabase.auth.getSession().then(({ data: { session } }) => {
      setIsAuthenticated(!!session);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setIsAuthenticated(!!session);
      if (!session) {
        const path = router.getCurrentPath();
        if (path.startsWith('/admin') && path !== '/admin' && path !== '/admin/signup') {
          router.navigate('/admin', true);
        } else if (path.startsWith('/patient-portal') && path !== '/patient-portal/login') {
          router.navigate('/patient-portal/login', true);
        }
      }
    });

    return () => {
      unsubscribeRouter();
      subscription.unsubscribe();
    };
  }, []);

  function handleAdminLogin() {
    router.navigate('/admin/dashboard');
  }

  function handlePatientLogin() {
    router.navigate('/patient-portal');
  }

  const { route } = router.getMatchedRoute();

  if (route?.component === 'InvitationResponse') {
    return <InvitationResponse />;
  }

  if (route?.component === 'RebookResponse') {
    return <RebookResponse />;
  }

  if (route?.component === 'AppointmentManagement') {
    return <AppointmentManagement />;
  }

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
    if (route.requiresAuth && !isAuthenticated) {
      router.navigate('/admin', true);
      return <AdminLogin onLogin={handleAdminLogin} />;
    }
  }

  if (route?.role === 'patient') {
    if (route.component === 'PatientPortalLogin') {
      return <PatientPortalLogin onLogin={handlePatientLogin} />;
    }
    if (route.component === 'PatientPortal' && isAuthenticated) {
      return <PatientPortal />;
    }
    if (route.requiresAuth && !isAuthenticated) {
      router.navigate('/patient-portal/login', true);
      return <PatientPortalLogin onLogin={handlePatientLogin} />;
    }
  }

  if (route?.component === 'OnlineBooking') {
    return <OnlineBooking />;
  }

  if (route?.component === 'WaitlistSignup') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gold-50 via-white to-neutral-50 py-12 px-4">
        <WaitlistSignup />
      </div>
    );
  }

  const breadcrumbs = getBreadcrumbs(currentPath);

  return (
    <div className="min-h-screen bg-white">
      <ImprovedHeader
        onOpenAppointment={handleOpenModal}
        isAgendaFull={isAgendaFull}
        showAdminLink={true}
      />

      {breadcrumbs.length > 1 && (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-24 pb-4">
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
}

export default App;
