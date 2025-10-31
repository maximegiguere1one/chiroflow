# 🚀 Intégration Rapide SaaS - 15 Minutes

## Étape 1: Ajouter le Context (2 min)

```tsx
// src/main.tsx ou src/App.tsx
import { OrganizationProvider } from './contexts/OrganizationContext';

function App() {
  return (
    <OrganizationProvider>
      {/* Votre app existante */}
      <YourApp />
    </OrganizationProvider>
  );
}
```

## Étape 2: Modifier le Login (3 min)

```tsx
// Dans votre composant de login
import { OrganizationService } from './lib/saas/organizationService';

async function handleLogin(email, password) {
  // Connexion normale
  const { data } = await supabase.auth.signInWithPassword({ email, password });

  // NOUVEAU: Vérifier l'organisation
  const org = await OrganizationService.getCurrentOrganization();

  if (!org) {
    navigate('/onboarding');  // Première connexion
  } else {
    navigate('/admin/dashboard');  // Connexion normale
  }
}
```

## Étape 3: Ajouter les Routes (2 min)

```tsx
// Dans votre Router
import OnboardingFlow from './pages/OnboardingFlow';
import OrganizationSettings from './pages/OrganizationSettings';

<Route path="/onboarding" element={<OnboardingFlow />} />
<Route path="/admin/organization/settings" element={<OrganizationSettings />} />
```

## Étape 4: Utiliser le Context (3 min)

```tsx
// Dans n'importe quel composant
import { useOrganization } from './contexts/OrganizationContext';

function MyComponent() {
  const { organization, hasFeature } = useOrganization();

  return (
    <div>
      <h1>{organization.name}</h1>
      <p>Plan: {organization.subscription_tier}</p>

      {/* Afficher selon le plan */}
      {hasFeature('analytics') && <AnalyticsSection />}
    </div>
  );
}
```

## Étape 5: Vérifier les Quotas (3 min)

```tsx
// Avant d'ajouter un patient
async function addPatient(patientData) {
  const { organization } = useOrganization();

  // Vérifier le quota
  if (patientsCount >= organization.max_patients) {
    alert('Limite atteinte! Passez au plan supérieur.');
    return;
  }

  // Créer le patient
  const patient = await createPatient(patientData);

  // Tracker l'utilisation
  await OrganizationService.trackUsage(
    organization.id,
    'patients_added',
    1
  );
}
```

## Étape 6: Ajouter une Bannière d'Essai (2 min)

```tsx
// Dans votre Dashboard
function Dashboard() {
  const { organization } = useOrganization();

  return (
    <div>
      {organization.subscription_status === 'trialing' && (
        <div className="trial-banner">
          ⏰ Essai gratuit - {calculateDaysLeft()} jours restants
          <button>Choisir un Plan</button>
        </div>
      )}

      {/* Reste du dashboard */}
    </div>
  );
}
```

---

## ✅ C'est Tout!

Votre application est maintenant SaaS! Les données sont automatiquement isolées par organisation grâce aux politiques RLS.

## 📚 Pour Aller Plus Loin

- **Guide Complet**: Voir `GUIDE_INTEGRATION_SAAS.md`
- **Exemples de Code**: Voir `EXEMPLE_INTEGRATION_COMPLETE.tsx`
- **Documentation API**: Voir `API_DOCUMENTATION.md`

## 🎯 Fonctionnalités Disponibles

✅ Multi-tenant avec isolation des données
✅ 3 plans d'abonnement (Starter, Professional, Enterprise)
✅ Gestion d'équipe avec rôles
✅ Quotas et limites par plan
✅ Tracking d'utilisation
✅ Génération de clés API (Enterprise)
✅ Dashboard admin SaaS
✅ Onboarding automatique

---

**Besoin d'aide?** Les services sont dans `src/lib/saas/` 🚀
