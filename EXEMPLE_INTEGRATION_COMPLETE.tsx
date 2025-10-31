/**
 * EXEMPLE COMPLET D'INTÉGRATION SAAS
 *
 * Ce fichier montre comment intégrer toutes les fonctionnalités SaaS
 * dans votre application ChiroFlow existante.
 */

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from './lib/supabase';
import { OrganizationService } from './lib/saas/organizationService';
import { APIKeyService } from './lib/saas/apiKeyService';
import { useOrganization } from './contexts/OrganizationContext';

// ============================================================================
// EXEMPLE 1: Modifier votre App.tsx pour ajouter le Context
// ============================================================================

function App() {
  return (
    <OrganizationProvider>
      <Router>
        <Routes>
          {/* Nouvelles routes SaaS */}
          <Route path="/onboarding" element={<OnboardingFlow />} />
          <Route path="/saas/admin" element={<SaaSAdminDashboard />} />
          <Route
            path="/admin/organization/settings"
            element={<OrganizationSettings />}
          />

          {/* Vos routes existantes */}
          <Route path="/admin/dashboard" element={<AdminDashboard />} />
          {/* ... autres routes ... */}
        </Routes>
      </Router>
    </OrganizationProvider>
  );
}

// ============================================================================
// EXEMPLE 2: Modifier votre Login Component
// ============================================================================

function LoginComponent() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const navigate = useNavigate();

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();

    // 1. Connexion normale
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password
    });

    if (error) {
      alert('Erreur de connexion: ' + error.message);
      return;
    }

    // 2. NOUVEAU: Vérifier si l'utilisateur a une organisation
    const org = await OrganizationService.getCurrentOrganization();

    if (!org) {
      // Pas d'organisation = premier login
      navigate('/onboarding');
    } else if (org.subscription_status === 'trialing') {
      // En période d'essai
      const trialEnd = new Date(org.trial_ends_at);
      const daysLeft = Math.ceil((trialEnd.getTime() - Date.now()) / (1000 * 60 * 60 * 24));

      if (daysLeft < 0) {
        // Essai expiré
        navigate('/choose-plan');
      } else {
        navigate('/admin/dashboard');
      }
    } else {
      // Tout est OK
      navigate('/admin/dashboard');
    }
  }

  return (
    <form onSubmit={handleLogin}>
      <input
        type="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="Email"
      />
      <input
        type="password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        placeholder="Mot de passe"
      />
      <button type="submit">Se connecter</button>
    </form>
  );
}

// ============================================================================
// EXEMPLE 3: Dashboard avec Info d'Organisation
// ============================================================================

function EnhancedDashboard() {
  const { organization, hasFeature, loading } = useOrganization();
  const [stats, setStats] = useState({
    patientsCount: 0,
    appointmentsThisMonth: 0,
    revenueThisMonth: 0
  });

  if (loading) {
    return <div>Chargement...</div>;
  }

  if (!organization) {
    return <div>Erreur: Aucune organisation trouvée</div>;
  }

  return (
    <div className="dashboard">
      {/* Header avec info d'organisation */}
      <header className="dashboard-header">
        <div>
          <h1>{organization.name}</h1>
          <div className="plan-badge">
            Plan {organization.subscription_tier}
          </div>
        </div>

        {/* Bannière d'essai si applicable */}
        {organization.subscription_status === 'trialing' && (
          <TrialBanner organization={organization} />
        )}
      </header>

      {/* Stats avec quotas */}
      <div className="stats-grid">
        <StatCard
          title="Patients"
          value={stats.patientsCount}
          max={organization.max_patients}
          icon="👥"
        />
        <StatCard
          title="Rendez-vous ce mois"
          value={stats.appointmentsThisMonth}
          max={organization.max_appointments_per_month}
          icon="📅"
        />
        <StatCard
          title="Revenus"
          value={`${stats.revenueThisMonth}$`}
          icon="💰"
        />
      </div>

      {/* Sections conditionnelles basées sur le plan */}
      <div className="dashboard-sections">
        {/* Toujours visible */}
        <PatientsSection />
        <AppointmentsSection />

        {/* Seulement si la fonctionnalité est activée */}
        {hasFeature('analytics') ? (
          <AnalyticsSection />
        ) : (
          <UpgradePrompt
            feature="Analytics"
            requiredPlan="Professional"
          />
        )}

        {hasFeature('api_access') && (
          <APIAccessSection />
        )}
      </div>
    </div>
  );
}

// ============================================================================
// EXEMPLE 4: Composant avec Vérification de Quota
// ============================================================================

function AddPatientButton() {
  const { organization } = useOrganization();
  const [patientsCount, setPatientsCount] = useState(0);

  async function handleAddPatient() {
    // 1. Vérifier le quota AVANT d'ouvrir le formulaire
    if (patientsCount >= organization.max_patients) {
      // Afficher un modal d'upgrade
      showUpgradeModal({
        title: 'Limite de patients atteinte',
        message: `Vous avez atteint la limite de ${organization.max_patients} patients de votre plan ${organization.subscription_tier}.`,
        action: 'Passer au plan supérieur pour ajouter plus de patients'
      });
      return;
    }

    // 2. Ouvrir le formulaire d'ajout
    openAddPatientModal();
  }

  async function createPatient(patientData: any) {
    try {
      // Créer le patient
      const { data: patient, error } = await supabase
        .from('contacts')
        .insert({
          ...patientData,
          organization_id: organization.id
        })
        .select()
        .single();

      if (error) throw error;

      // 3. Tracker l'utilisation
      await OrganizationService.trackUsage(
        organization.id,
        'patients_added',
        1
      );

      // Rafraîchir la liste
      setPatientsCount(patientsCount + 1);

      alert('Patient ajouté avec succès!');
    } catch (error) {
      console.error('Erreur:', error);
      alert('Erreur lors de l\'ajout du patient');
    }
  }

  return (
    <div>
      <button onClick={handleAddPatient}>
        Ajouter un Patient
      </button>
      <span className="quota-indicator">
        {patientsCount} / {organization.max_patients}
      </span>
    </div>
  );
}

// ============================================================================
// EXEMPLE 5: Liste de Patients avec Organisation Context
// ============================================================================

function PatientsListWithOrganization() {
  const { organization } = useOrganization();
  const [patients, setPatients] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadPatients();
  }, [organization]);

  async function loadPatients() {
    if (!organization) return;

    try {
      // Les données sont automatiquement filtrées par organization_id
      // grâce aux politiques RLS!
      const { data, error } = await supabase
        .from('contacts')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;

      setPatients(data || []);
    } catch (error) {
      console.error('Erreur:', error);
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return <div>Chargement des patients...</div>;
  }

  return (
    <div>
      <div className="header">
        <h2>Patients</h2>
        <div className="quota">
          {patients.length} / {organization.max_patients}
        </div>
      </div>

      {patients.length === 0 ? (
        <div>Aucun patient</div>
      ) : (
        <table>
          <thead>
            <tr>
              <th>Nom</th>
              <th>Email</th>
              <th>Téléphone</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {patients.map(patient => (
              <tr key={patient.id}>
                <td>{patient.first_name} {patient.last_name}</td>
                <td>{patient.email}</td>
                <td>{patient.phone}</td>
                <td>
                  <button>Voir</button>
                  <button>Modifier</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}

// ============================================================================
// EXEMPLE 6: Gestion d'Équipe
// ============================================================================

function TeamManagement() {
  const { organization } = useOrganization();
  const [members, setMembers] = useState([]);
  const [showInviteModal, setShowInviteModal] = useState(false);

  useEffect(() => {
    loadTeamMembers();
  }, [organization]);

  async function loadTeamMembers() {
    if (!organization) return;

    const teamMembers = await OrganizationService.getOrganizationMembers(
      organization.id
    );
    setMembers(teamMembers);
  }

  async function inviteTeamMember(email: string, role: string) {
    try {
      await OrganizationService.inviteMember(
        organization.id,
        email,
        role
      );

      alert('Invitation envoyée!');
      loadTeamMembers();
      setShowInviteModal(false);
    } catch (error) {
      console.error('Erreur:', error);
      alert('Erreur lors de l\'invitation');
    }
  }

  async function updateMemberRole(memberId: string, newRole: string) {
    try {
      await OrganizationService.updateMemberRole(memberId, newRole);
      alert('Rôle mis à jour!');
      loadTeamMembers();
    } catch (error) {
      console.error('Erreur:', error);
    }
  }

  async function removeMember(memberId: string) {
    if (!confirm('Êtes-vous sûr de vouloir retirer ce membre?')) return;

    try {
      await OrganizationService.removeMember(memberId);
      alert('Membre retiré');
      loadTeamMembers();
    } catch (error) {
      console.error('Erreur:', error);
    }
  }

  return (
    <div className="team-management">
      <div className="header">
        <h2>Gestion d'Équipe</h2>
        <button onClick={() => setShowInviteModal(true)}>
          Inviter un Membre
        </button>
      </div>

      <div className="quota-info">
        {members.length} / {organization.max_users} utilisateurs
      </div>

      <table>
        <thead>
          <tr>
            <th>Utilisateur</th>
            <th>Rôle</th>
            <th>Statut</th>
            <th>Invité le</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {members.map(member => (
            <tr key={member.id}>
              <td>{member.user_id}</td>
              <td>
                <select
                  value={member.role}
                  onChange={(e) => updateMemberRole(member.id, e.target.value)}
                  disabled={member.role === 'owner'}
                >
                  <option value="owner">Propriétaire</option>
                  <option value="admin">Administrateur</option>
                  <option value="practitioner">Praticien</option>
                  <option value="staff">Personnel</option>
                  <option value="billing">Facturation</option>
                </select>
              </td>
              <td>
                <span className={`status ${member.status}`}>
                  {member.status}
                </span>
              </td>
              <td>{new Date(member.invited_at).toLocaleDateString()}</td>
              <td>
                {member.role !== 'owner' && (
                  <button onClick={() => removeMember(member.id)}>
                    Retirer
                  </button>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {showInviteModal && (
        <InviteModal
          onInvite={inviteTeamMember}
          onClose={() => setShowInviteModal(false)}
        />
      )}
    </div>
  );
}

// ============================================================================
// EXEMPLE 7: Gestion des Clés API (Plan Enterprise)
// ============================================================================

function APIKeysManagement() {
  const { organization, hasFeature } = useOrganization();
  const [keys, setKeys] = useState([]);
  const [newKeyVisible, setNewKeyVisible] = useState(false);
  const [newKey, setNewKey] = useState('');

  useEffect(() => {
    loadAPIKeys();
  }, [organization]);

  async function loadAPIKeys() {
    if (!organization) return;

    const apiKeys = await APIKeyService.listAPIKeys(organization.id);
    setKeys(apiKeys);
  }

  async function generateNewKey() {
    try {
      const { apiKey, plainKey } = await APIKeyService.createAPIKey(
        organization.id,
        'Nouvelle clé API',
        ['read', 'write'],
        365 // Expire dans 1 an
      );

      setNewKey(plainKey);
      setNewKeyVisible(true);
      loadAPIKeys();
    } catch (error) {
      console.error('Erreur:', error);
      alert('Erreur lors de la génération de la clé');
    }
  }

  async function revokeKey(keyId: string) {
    if (!confirm('Êtes-vous sûr de vouloir révoquer cette clé?')) return;

    try {
      await APIKeyService.revokeAPIKey(keyId);
      alert('Clé révoquée');
      loadAPIKeys();
    } catch (error) {
      console.error('Erreur:', error);
    }
  }

  if (!hasFeature('api_access')) {
    return (
      <div className="upgrade-prompt">
        <h3>🔒 Accès API Réservé au Plan Enterprise</h3>
        <p>Passez au plan Enterprise pour générer des clés API et intégrer ChiroFlow avec vos systèmes.</p>
        <button>Passer à Enterprise</button>
      </div>
    );
  }

  return (
    <div className="api-keys-management">
      <div className="header">
        <h2>Clés API</h2>
        <button onClick={generateNewKey}>
          Générer une Nouvelle Clé
        </button>
      </div>

      {newKeyVisible && (
        <div className="new-key-alert">
          <h4>⚠️ Sauvegardez cette clé maintenant!</h4>
          <p>Elle ne sera plus visible après fermeture.</p>
          <code className="api-key">{newKey}</code>
          <button onClick={() => {
            navigator.clipboard.writeText(newKey);
            alert('Clé copiée!');
          }}>
            Copier
          </button>
          <button onClick={() => setNewKeyVisible(false)}>
            J'ai sauvegardé la clé
          </button>
        </div>
      )}

      <table>
        <thead>
          <tr>
            <th>Nom</th>
            <th>Clé</th>
            <th>Dernière utilisation</th>
            <th>Créée le</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {keys.map(key => (
            <tr key={key.id}>
              <td>{key.name}</td>
              <td>
                <code>{key.key_prefix}...{key.last_four}</code>
              </td>
              <td>
                {key.last_used_at
                  ? new Date(key.last_used_at).toLocaleDateString()
                  : 'Jamais'
                }
              </td>
              <td>{new Date(key.created_at).toLocaleDateString()}</td>
              <td>
                {key.is_active ? (
                  <button onClick={() => revokeKey(key.id)}>
                    Révoquer
                  </button>
                ) : (
                  <span className="revoked">Révoquée</span>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// ============================================================================
// EXEMPLE 8: Composants Utilitaires
// ============================================================================

// Bannière d'essai
function TrialBanner({ organization }) {
  const trialEnd = new Date(organization.trial_ends_at);
  const daysLeft = Math.ceil((trialEnd.getTime() - Date.now()) / (1000 * 60 * 60 * 24));

  return (
    <div className="trial-banner">
      <span>⏰ Essai gratuit - {daysLeft} jours restants</span>
      <button>Choisir un Plan</button>
    </div>
  );
}

// Carte de statistique avec quota
function StatCard({ title, value, max, icon }) {
  const percentage = max ? (value / max) * 100 : 0;
  const isNearLimit = percentage > 80;

  return (
    <div className={`stat-card ${isNearLimit ? 'warning' : ''}`}>
      <div className="icon">{icon}</div>
      <div className="content">
        <h3>{title}</h3>
        <div className="value">
          {value}
          {max && <span className="max"> / {max}</span>}
        </div>
        {max && (
          <div className="progress-bar">
            <div
              className="progress"
              style={{ width: `${percentage}%` }}
            />
          </div>
        )}
      </div>
    </div>
  );
}

// Prompt d'upgrade
function UpgradePrompt({ feature, requiredPlan }) {
  return (
    <div className="upgrade-prompt-card">
      <div className="icon">🔒</div>
      <h3>{feature}</h3>
      <p>Fonctionnalité disponible avec le plan {requiredPlan}</p>
      <button className="upgrade-button">
        Passer à {requiredPlan}
      </button>
    </div>
  );
}

// ============================================================================
// EXEMPLE 9: Hook Personnalisé pour Faciliter l'Utilisation
// ============================================================================

function useQuotaCheck(metricName: string) {
  const { organization } = useOrganization();
  const [current, setCurrent] = useState(0);
  const [max, setMax] = useState(0);

  useEffect(() => {
    if (!organization) return;

    // Déterminer la limite basée sur le metric
    const limits = {
      patients: organization.max_patients,
      appointments: organization.max_appointments_per_month,
      users: organization.max_users
    };

    setMax(limits[metricName] || Infinity);

    // Charger l'utilisation courante
    loadCurrentUsage();
  }, [organization, metricName]);

  async function loadCurrentUsage() {
    // Implémenter le chargement de l'utilisation courante
    // depuis la base de données
  }

  const isAtLimit = current >= max;
  const isNearLimit = current >= max * 0.8;
  const remaining = max - current;

  return {
    current,
    max,
    isAtLimit,
    isNearLimit,
    remaining,
    percentage: (current / max) * 100
  };
}

// Utilisation:
function MyComponentWithQuota() {
  const patientsQuota = useQuotaCheck('patients');

  return (
    <div>
      <button disabled={patientsQuota.isAtLimit}>
        Ajouter Patient
      </button>
      {patientsQuota.isNearLimit && (
        <div className="warning">
          Attention: {patientsQuota.remaining} patients restants
        </div>
      )}
    </div>
  );
}

export {
  App,
  LoginComponent,
  EnhancedDashboard,
  AddPatientButton,
  PatientsListWithOrganization,
  TeamManagement,
  APIKeysManagement,
  useQuotaCheck
};
