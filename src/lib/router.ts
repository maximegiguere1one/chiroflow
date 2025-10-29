// Simple but robust routing system

export type Route = {
  path: string;
  name: string;
  component: string;
  requiresAuth?: boolean;
  role?: 'admin' | 'patient' | 'public';
  parent?: string;
  icon?: string;
  hidden?: boolean;
};

export const routes: Route[] = [
  // Public routes
  { path: '/', name: 'Accueil', component: 'Home', role: 'public' },
  { path: '/booking', name: 'Réservation en ligne', component: 'OnlineBooking', role: 'public' },
  { path: '/waitlist', name: 'Liste d\'attente', component: 'WaitlistSignup', role: 'public' },
  { path: '/invitation/:token', name: 'Réponse invitation', component: 'InvitationResponse', role: 'public', hidden: true },
  { path: '/rebook/:token', name: 'Re-réservation', component: 'RebookResponse', role: 'public', hidden: true },
  { path: '/appointment/manage/:id', name: 'Gérer RDV', component: 'AppointmentManagement', role: 'public', hidden: true },
  { path: '/appointment/confirm/:id', name: 'Confirmer RDV', component: 'AppointmentManagement', role: 'public', hidden: true },

  // Admin routes
  { path: '/admin', name: 'Connexion Admin', component: 'AdminLogin', role: 'admin' },
  { path: '/admin/signup', name: 'Inscription Admin', component: 'AdminSignup', role: 'admin' },
  { path: '/admin/dashboard', name: 'Tableau de bord', component: 'AdminDashboard', requiresAuth: true, role: 'admin', icon: 'LayoutDashboard' },

  // Patient portal routes
  { path: '/patient-portal/login', name: 'Connexion Patient', component: 'PatientPortalLogin', role: 'patient' },
  { path: '/patient-portal', name: 'Portail Patient', component: 'PatientPortal', requiresAuth: true, role: 'patient', icon: 'User' },
];

export class Router {
  private currentPath: string = '/';
  private listeners: Array<(path: string) => void> = [];

  constructor() {
    this.currentPath = window.location.pathname;
    window.addEventListener('popstate', () => {
      this.currentPath = window.location.pathname;
      this.notify();
    });
  }

  navigate(path: string, replace: boolean = false) {
    if (path === this.currentPath) return;

    this.currentPath = path;

    if (replace) {
      window.history.replaceState({}, '', path);
    } else {
      window.history.pushState({}, '', path);
    }

    this.notify();
  }

  back() {
    window.history.back();
  }

  forward() {
    window.history.forward();
  }

  getCurrentPath(): string {
    return this.currentPath;
  }

  matchRoute(pattern: string, path: string): { match: boolean; params: Record<string, string> } {
    const patternParts = pattern.split('/').filter(Boolean);
    const pathParts = path.split('/').filter(Boolean);

    if (patternParts.length !== pathParts.length) {
      return { match: false, params: {} };
    }

    const params: Record<string, string> = {};

    for (let i = 0; i < patternParts.length; i++) {
      const patternPart = patternParts[i];
      const pathPart = pathParts[i];

      if (patternPart.startsWith(':')) {
        params[patternPart.slice(1)] = pathPart;
      } else if (patternPart !== pathPart) {
        return { match: false, params: {} };
      }
    }

    return { match: true, params };
  }

  getMatchedRoute(): { route: Route | null; params: Record<string, string> } {
    for (const route of routes) {
      const result = this.matchRoute(route.path, this.currentPath);
      if (result.match) {
        return { route, params: result.params };
      }
    }
    return { route: null, params: {} };
  }

  subscribe(listener: (path: string) => void): () => void {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter(l => l !== listener);
    };
  }

  private notify() {
    this.listeners.forEach(listener => listener(this.currentPath));
  }
}

export const router = new Router();

// Helper to get breadcrumbs from current path
export function getBreadcrumbs(path: string): Array<{ name: string; path: string }> {
  const parts = path.split('/').filter(Boolean);
  const breadcrumbs: Array<{ name: string; path: string }> = [
    { name: 'Accueil', path: '/' }
  ];

  let currentPath = '';
  for (let i = 0; i < parts.length; i++) {
    currentPath += '/' + parts[i];
    const route = routes.find(r => {
      const result = new Router().matchRoute(r.path, currentPath);
      return result.match;
    });

    if (route && !route.hidden) {
      breadcrumbs.push({
        name: route.name,
        path: currentPath
      });
    }
  }

  return breadcrumbs;
}
