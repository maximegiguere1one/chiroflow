# Guide d'Intégration des Fonctionnalités SaaS

## 🎯 Vue d'Ensemble

ChiroFlow est maintenant une plateforme SaaS multi-tenant complète. Ce guide vous explique comment intégrer et utiliser toutes les nouvelles fonctionnalités.

---

## 📋 Table des Matières

1. [Configuration Initiale](#1-configuration-initiale)
2. [Création d'une Organisation](#2-création-dune-organisation)
3. [Gestion des Utilisateurs](#3-gestion-des-utilisateurs)
4. [Utilisation du Context Organisation](#4-utilisation-du-context-organisation)
5. [Vérification des Permissions](#5-vérification-des-permissions)
6. [Gestion des Abonnements](#6-gestion-des-abonnements)
7. [Tracking d'Utilisation](#7-tracking-dutilisation)
8. [Génération de Clés API](#8-génération-de-clés-api)
9. [Intégration dans les Composants](#9-intégration-dans-les-composants)
10. [Migration des Utilisateurs Existants](#10-migration-des-utilisateurs-existants)

---

## 1. Configuration Initiale

### Étape 1.1: Ajouter le Provider d'Organisation

Dans votre fichier `src/main.tsx` ou `src/App.tsx`, enveloppez votre application avec le `OrganizationProvider`:

```tsx
import { OrganizationProvider } from './contexts/OrganizationContext';

function App() {
  return (
    <OrganizationProvider>
      {/* Votre application existante */}
      <YourExistingApp />
    </OrganizationProvider>
  );
}
```

### Étape 1.2: Modifier le Flow d'Authentification

Après la connexion d'un utilisateur, redirigez-le vers l'onboarding s'il n'a pas d'organisation:

```tsx
import { OrganizationService } from './lib/saas/organizationService';
import { useNavigate } from 'react-router-dom';

async function handleLogin(email: string, password: string) {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password
  });

  if (error) {
    console.error('Login error:', error);
    return;
  }

  // Vérifier si l'utilisateur a une organisation
  const org = await OrganizationService.getCurrentOrganization();

  if (!org) {
    // Rediriger vers l'onboarding
    navigate('/onboarding');
  } else {
    // Rediriger vers le dashboard
    navigate('/admin/dashboard');
  }
}
```

---

## 2. Création d'une Organisation

### Option A: Via le Flow d'Onboarding (Recommandé)

Ajoutez cette route dans votre application:

```tsx
// Dans votre fichier de routes
import OnboardingFlow from './pages/OnboardingFlow';

<Route path="/onboarding" element={<OnboardingFlow />} />
```

Le composant `OnboardingFlow` gère automatiquement:
- ✅ Création de l'organisation
- ✅ Configuration du compte
- ✅ Invitation des membres d'équipe
- ✅ Sélection du plan d'abonnement

### Option B: Création Programmatique

```tsx
import { OrganizationService } from './lib/saas/organizationService';

async function createOrganization() {
  try {
    const org = await OrganizationService.createOrganization({
      name: 'Ma Clinique Chiropratique',
      slug: 'ma-clinique-chiro',
      email: 'contact@maclinique.com',
      phone: '+1 514 123-4567',
      timezone: 'America/Toronto'
    });

    console.log('Organisation créée:', org);
    // L'utilisateur est automatiquement ajouté comme "owner"

  } catch (error) {
    console.error('Erreur:', error);
  }
}
```

---

## 3. Gestion des Utilisateurs

### 3.1: Inviter un Membre d'Équipe

```tsx
import { OrganizationService } from './lib/saas/organizationService';
import { useOrganization } from './contexts/OrganizationContext';

function InviteTeamMember() {
  const { organization } = useOrganization();

  async function inviteMember() {
    if (!organization) return;

    try {
      await OrganizationService.inviteMember(
        organization.id,
        'collegue@example.com',
        'practitioner' // ou 'admin', 'staff', 'billing'
      );

      alert('Invitation envoyée!');
    } catch (error) {
      console.error('Erreur:', error);
    }
  }

  return (
    <button onClick={inviteMember}>
      Inviter un Membre
    </button>
  );
}
```

### 3.2: Lister les Membres

```tsx
import { OrganizationService } from './lib/saas/organizationService';

function TeamList() {
  const [members, setMembers] = useState([]);
  const { organization } = useOrganization();

  useEffect(() => {
    loadMembers();
  }, [organization]);

  async function loadMembers() {
    if (!organization) return;

    const teamMembers = await OrganizationService.getOrganizationMembers(
      organization.id
    );
    setMembers(teamMembers);
  }

  return (
    <div>
      {members.map(member => (
        <div key={member.id}>
          <span>{member.user_id}</span>
          <span>{member.role}</span>
          <span>{member.status}</span>
        </div>
      ))}
    </div>
  );
}
```

### 3.3: Modifier le Rôle d'un Membre

```tsx
async function updateMemberRole(memberId: string, newRole: string) {
  try {
    await OrganizationService.updateMemberRole(memberId, newRole);
    alert('Rôle mis à jour!');
  } catch (error) {
    console.error('Erreur:', error);
  }
}
```

---

## 4. Utilisation du Context Organisation

Le `OrganizationContext` donne accès à l'organisation courante partout dans votre app:

```tsx
import { useOrganization } from './contexts/OrganizationContext';

function MyComponent() {
  const {
    organization,      // Organisation courante
    loading,          // État de chargement
    refreshOrganization, // Fonction pour recharger
    hasFeature,       // Vérifier une fonctionnalité
    canPerformAction  // Vérifier une permission
  } = useOrganization();

  if (loading) {
    return <div>Chargement...</div>;
  }

  if (!organization) {
    return <div>Aucune organisation</div>;
  }

  return (
    <div>
      <h1>{organization.name}</h1>
      <p>Plan: {organization.subscription_tier}</p>
      <p>Statut: {organization.subscription_status}</p>

      {/* Afficher selon les fonctionnalités */}
      {hasFeature('analytics') && (
        <AnalyticsDashboard />
      )}

      {hasFeature('api_access') && (
        <APIKeysSection />
      )}
    </div>
  );
}
```

---

## 5. Vérification des Permissions

### 5.1: Vérifier l'Accès à une Fonctionnalité

```tsx
import { useOrganization } from './contexts/OrganizationContext';

function AdvancedFeature() {
  const { hasFeature, organization } = useOrganization();

  if (!hasFeature('analytics')) {
    return (
      <div className="upgrade-prompt">
        <h3>Fonctionnalité Premium</h3>
        <p>Passez au plan Professional pour accéder aux analytiques avancées.</p>
        <button>Mettre à Niveau</button>
      </div>
    );
  }

  return <AnalyticsDashboard />;
}
```

### 5.2: Vérifier les Quotas d'Utilisation

```tsx
import { OrganizationService } from './lib/saas/organizationService';

function PatientsList() {
  const { organization } = useOrganization();
  const [patients, setPatients] = useState([]);

  async function addPatient(patientData) {
    // Vérifier le quota avant d'ajouter
    if (patients.length >= organization.max_patients) {
      alert(`Limite atteinte: ${organization.max_patients} patients maximum`);
      alert('Mettez à niveau votre plan pour ajouter plus de patients.');
      return;
    }

    // Ajouter le patient...
    const newPatient = await createPatient(patientData);

    // Tracker l'utilisation
    await OrganizationService.trackUsage(
      organization.id,
      'patients_added',
      1
    );
  }

  return (
    <div>
      <p>Patients: {patients.length} / {organization.max_patients}</p>
      <button onClick={() => addPatient(...)}>Ajouter Patient</button>
    </div>
  );
}
```

---

## 6. Gestion des Abonnements

### 6.1: Afficher le Plan Actuel

```tsx
import { OrganizationService } from './lib/saas/organizationService';

function SubscriptionInfo() {
  const [subscription, setSubscription] = useState(null);
  const { organization } = useOrganization();

  useEffect(() => {
    loadSubscription();
  }, [organization]);

  async function loadSubscription() {
    if (!organization) return;

    const sub = await OrganizationService.getCurrentSubscription(
      organization.id
    );
    setSubscription(sub);
  }

  return (
    <div className="subscription-card">
      <h3>Plan {organization.subscription_tier}</h3>
      <p>Statut: {organization.subscription_status}</p>

      {organization.subscription_status === 'trialing' && (
        <p>Essai gratuit jusqu'au {organization.trial_ends_at}</p>
      )}

      <button>Mettre à Niveau</button>
    </div>
  );
}
```

### 6.2: Lister les Plans Disponibles

```tsx
import { OrganizationService } from './lib/saas/organizationService';

function PricingPage() {
  const [plans, setPlans] = useState([]);

  useEffect(() => {
    loadPlans();
  }, []);

  async function loadPlans() {
    const availablePlans = await OrganizationService.getSubscriptionPlans();
    setPlans(availablePlans);
  }

  return (
    <div className="pricing-grid">
      {plans.map(plan => (
        <div key={plan.id} className="pricing-card">
          <h3>{plan.name}</h3>
          <p>{plan.description}</p>
          <p className="price">${plan.price_monthly}/mois</p>

          <ul>
            {plan.features.map(feature => (
              <li key={feature}>✓ {feature}</li>
            ))}
          </ul>

          <button>Choisir ce plan</button>
        </div>
      ))}
    </div>
  );
}
```

### 6.3: Afficher les Métriques d'Utilisation

```tsx
import { OrganizationService } from './lib/saas/organizationService';

function UsageMetrics() {
  const [metrics, setMetrics] = useState([]);
  const { organization } = useOrganization();

  useEffect(() => {
    loadMetrics();
  }, [organization]);

  async function loadMetrics() {
    if (!organization) return;

    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);

    const data = await OrganizationService.getUsageMetrics(
      organization.id,
      startOfMonth,
      endOfMonth
    );

    setMetrics(data);
  }

  return (
    <div className="usage-dashboard">
      <h3>Utilisation ce mois-ci</h3>
      {metrics.map(metric => (
        <div key={metric.metric_name}>
          <span>{metric.metric_name}</span>
          <span>{metric.metric_value}</span>
        </div>
      ))}
    </div>
  );
}
```

---

## 7. Tracking d'Utilisation

### 7.1: Tracker Automatiquement les Actions

Ajoutez le tracking dans vos fonctions existantes:

```tsx
import { OrganizationService } from './lib/saas/organizationService';
import { useOrganization } from './contexts/OrganizationContext';

function AppointmentCreator() {
  const { organization } = useOrganization();

  async function createAppointment(appointmentData) {
    // Créer le rendez-vous
    const appointment = await supabase
      .from('appointments')
      .insert(appointmentData)
      .select()
      .single();

    // Tracker l'utilisation
    if (organization) {
      await OrganizationService.trackUsage(
        organization.id,
        'appointments_created',
        1
      );
    }

    return appointment;
  }

  return (
    <form onSubmit={createAppointment}>
      {/* Formulaire de rendez-vous */}
    </form>
  );
}
```

### 7.2: Métriques Personnalisées

```tsx
// Tracker l'envoi d'emails
await OrganizationService.trackUsage(
  organization.id,
  'emails_sent',
  10 // Nombre d'emails envoyés
);

// Tracker les factures créées
await OrganizationService.trackUsage(
  organization.id,
  'invoices_created',
  1
);

// Tracker le stockage utilisé (en MB)
await OrganizationService.trackUsage(
  organization.id,
  'storage_used',
  150
);
```

---

## 8. Génération de Clés API

### 8.1: Page de Gestion des Clés API

Ajoutez la page de paramètres d'organisation:

```tsx
// Dans votre router
import OrganizationSettings from './pages/OrganizationSettings';

<Route path="/admin/organization/settings" element={<OrganizationSettings />} />
```

### 8.2: Créer une Clé API Programmatiquement

```tsx
import { APIKeyService } from './lib/saas/apiKeyService';

async function generateAPIKey() {
  const { organization } = useOrganization();

  if (!hasFeature('api_access')) {
    alert('Passez au plan Enterprise pour accéder aux API');
    return;
  }

  try {
    const { apiKey, plainKey } = await APIKeyService.createAPIKey(
      organization.id,
      'Clé pour Integration XYZ',
      ['read', 'write'], // Scopes
      365 // Expire dans 365 jours
    );

    // IMPORTANT: Afficher la clé UNE SEULE FOIS
    alert(`Votre clé API: ${plainKey}`);
    alert('Sauvegardez-la maintenant, elle ne sera plus visible!');

  } catch (error) {
    console.error('Erreur:', error);
  }
}
```

### 8.3: Lister les Clés API

```tsx
import { APIKeyService } from './lib/saas/apiKeyService';

function APIKeysList() {
  const [keys, setKeys] = useState([]);
  const { organization } = useOrganization();

  useEffect(() => {
    loadKeys();
  }, [organization]);

  async function loadKeys() {
    if (!organization) return;

    const apiKeys = await APIKeyService.listAPIKeys(organization.id);
    setKeys(apiKeys);
  }

  async function revokeKey(keyId) {
    await APIKeyService.revokeAPIKey(keyId);
    loadKeys(); // Recharger la liste
  }

  return (
    <div>
      {keys.map(key => (
        <div key={key.id}>
          <span>{key.name}</span>
          <code>{key.key_prefix}...{key.last_four}</code>
          <span>Dernière utilisation: {key.last_used_at || 'Jamais'}</span>
          <button onClick={() => revokeKey(key.id)}>Révoquer</button>
        </div>
      ))}
    </div>
  );
}
```

---

## 9. Intégration dans les Composants

### 9.1: Protéger une Route par Abonnement

```tsx
import { Navigate } from 'react-router-dom';
import { useOrganization } from './contexts/OrganizationContext';

function ProtectedRoute({ children, requiredFeature }) {
  const { hasFeature, loading } = useOrganization();

  if (loading) {
    return <div>Chargement...</div>;
  }

  if (!hasFeature(requiredFeature)) {
    return <Navigate to="/upgrade" />;
  }

  return children;
}

// Utilisation:
<Route
  path="/analytics"
  element={
    <ProtectedRoute requiredFeature="analytics">
      <AnalyticsPage />
    </ProtectedRoute>
  }
/>
```

### 9.2: Badge de Plan

```tsx
function PlanBadge() {
  const { organization } = useOrganization();

  const planColors = {
    trial: 'bg-blue-100 text-blue-800',
    starter: 'bg-green-100 text-green-800',
    professional: 'bg-purple-100 text-purple-800',
    enterprise: 'bg-gold-100 text-gold-800',
  };

  return (
    <span className={`px-3 py-1 rounded-full text-sm font-medium ${
      planColors[organization.subscription_tier]
    }`}>
      {organization.subscription_tier.toUpperCase()}
    </span>
  );
}
```

### 9.3: Bannière d'Essai

```tsx
function TrialBanner() {
  const { organization } = useOrganization();

  if (organization.subscription_status !== 'trialing') {
    return null;
  }

  const trialEnds = new Date(organization.trial_ends_at);
  const daysLeft = Math.ceil((trialEnds - new Date()) / (1000 * 60 * 60 * 24));

  return (
    <div className="bg-yellow-50 border-b border-yellow-200 p-4">
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        <div>
          <p className="font-medium text-yellow-900">
            Essai gratuit - {daysLeft} jours restants
          </p>
          <p className="text-sm text-yellow-700">
            Choisissez un plan pour continuer après l'essai
          </p>
        </div>
        <button className="bg-yellow-600 text-white px-6 py-2 rounded-lg">
          Choisir un Plan
        </button>
      </div>
    </div>
  );
}
```

### 9.4: Menu de Navigation avec Restrictions

```tsx
function NavigationMenu() {
  const { hasFeature } = useOrganization();

  const menuItems = [
    { label: 'Dashboard', path: '/dashboard', feature: null },
    { label: 'Patients', path: '/patients', feature: null },
    { label: 'Rendez-vous', path: '/appointments', feature: 'appointments' },
    { label: 'Facturation', path: '/billing', feature: 'billing' },
    { label: 'Analytiques', path: '/analytics', feature: 'analytics' },
    { label: 'API', path: '/api', feature: 'api_access' },
  ];

  return (
    <nav>
      {menuItems.map(item => {
        const isLocked = item.feature && !hasFeature(item.feature);

        return (
          <Link
            key={item.path}
            to={isLocked ? '/upgrade' : item.path}
            className={isLocked ? 'opacity-50' : ''}
          >
            {item.label}
            {isLocked && ' 🔒'}
          </Link>
        );
      })}
    </nav>
  );
}
```

---

## 10. Migration des Utilisateurs Existants

Si vous avez déjà des utilisateurs, voici comment les migrer:

### 10.1: Script de Migration

```tsx
async function migrateExistingUsers() {
  // 1. Récupérer tous les utilisateurs existants
  const { data: users } = await supabase.auth.admin.listUsers();

  for (const user of users) {
    // 2. Créer une organisation pour chaque utilisateur
    const org = await OrganizationService.createOrganization({
      name: `Clinique de ${user.email}`,
      slug: `clinic-${user.id.substring(0, 8)}`,
      email: user.email,
      timezone: 'America/Toronto'
    });

    console.log(`Organisation créée pour ${user.email}`);

    // 3. Mettre à jour tous les enregistrements existants
    await supabase
      .from('appointments')
      .update({ organization_id: org.id })
      .eq('owner_id', user.id);

    await supabase
      .from('contacts')
      .update({ organization_id: org.id })
      .eq('owner_id', user.id);

    // Répéter pour toutes les tables...
  }
}
```

### 10.2: Offrir une Période d'Essai Étendue

```tsx
async function giveExtendedTrial(organizationId) {
  const extendedTrialEnd = new Date();
  extendedTrialEnd.setDate(extendedTrialEnd.getDate() + 30); // 30 jours

  await OrganizationService.updateOrganization(organizationId, {
    trial_ends_at: extendedTrialEnd.toISOString()
  });
}
```

---

## 🎯 Checklist d'Intégration

### Phase 1: Configuration de Base
- [ ] Ajouter `OrganizationProvider` dans App.tsx
- [ ] Créer la route `/onboarding`
- [ ] Modifier le flow de connexion pour vérifier l'organisation
- [ ] Tester la création d'une nouvelle organisation

### Phase 2: Gestion des Utilisateurs
- [ ] Implémenter l'invitation de membres
- [ ] Créer la page de gestion d'équipe
- [ ] Tester les différents rôles
- [ ] Vérifier les permissions

### Phase 3: Abonnements
- [ ] Afficher le plan actuel dans le dashboard
- [ ] Créer la page de pricing
- [ ] Implémenter les restrictions par plan
- [ ] Ajouter la bannière d'essai

### Phase 4: Tracking et Métriques
- [ ] Ajouter le tracking dans les actions principales
- [ ] Créer le dashboard de métriques
- [ ] Vérifier les quotas avant les actions
- [ ] Afficher les alertes de limite

### Phase 5: Fonctionnalités Avancées
- [ ] Implémenter la gestion des clés API
- [ ] Créer le dashboard admin SaaS
- [ ] Ajouter la page de paramètres d'organisation
- [ ] Tester l'isolation des données

---

## 🆘 Dépannage

### Problème: "organization is null"
**Solution**: L'utilisateur n'a pas d'organisation. Redirigez-le vers `/onboarding`.

### Problème: Données d'autres organisations visibles
**Solution**: Vérifiez que les politiques RLS sont activées et que `organization_id` est bien filtré.

### Problème: Quota dépassé mais l'action fonctionne quand même
**Solution**: Ajoutez les vérifications de quota avant chaque action importante.

### Problème: Les clés API ne fonctionnent pas
**Solution**: Vérifiez que l'organisation a accès à la fonctionnalité `api_access`.

---

## 📚 Ressources Supplémentaires

- **Documentation API**: Voir `API_DOCUMENTATION.md`
- **Guide Complet**: Voir `SAAS_IMPLEMENTATION_COMPLETE.md`
- **Quick Start**: Voir `QUICK_START_SAAS.md`

---

## 💡 Bonnes Pratiques

1. **Toujours vérifier l'organisation**: Ne jamais supposer qu'elle existe
2. **Tracker l'utilisation**: À chaque action importante
3. **Vérifier les quotas**: Avant d'autoriser une action
4. **Afficher des messages clairs**: Quand une fonctionnalité n'est pas disponible
5. **Offrir des upgrades**: Proposer de passer au plan supérieur
6. **Tester l'isolation**: Vérifier qu'un utilisateur ne voit pas les données d'une autre organisation

---

Besoin d'aide? Les services dans `src/lib/saas/` contiennent toutes les fonctions nécessaires! 🚀
