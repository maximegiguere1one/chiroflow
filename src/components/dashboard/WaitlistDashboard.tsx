import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Users, Clock, CheckCircle, AlertCircle, Send, Loader, Calendar } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useToastContext } from '../../contexts/ToastContext';
import EmailConfigWizard from './EmailConfigWizard';

interface WaitlistEntry {
  id: string;
  name: string;
  email: string;
  phone: string;
  reason: string;
  status: string;
  invitation_count: number;
  last_invitation_sent_at: string | null;
  created_at: string;
  consent_automated_notifications: boolean;
}

interface SlotOffer {
  id: string;
  slot_date: string;
  slot_time: string;
  slot_datetime: string;
  duration_minutes: number;
  status: string;
  invitation_count: number;
  max_invitations: number;
  expires_at: string;
  created_at: string;
}

interface Invitation {
  id: string;
  slot_offer_id: string;
  waitlist_entry: {
    name: string;
    email: string;
  };
  status: string;
  sent_at: string;
  expires_at: string;
  responded_at: string | null;
}

export default function WaitlistDashboard() {
  const [waitlistEntries, setWaitlistEntries] = useState<WaitlistEntry[]>([]);
  const [slotOffers, setSlotOffers] = useState<SlotOffer[]>([]);
  const [invitations, setInvitations] = useState<Invitation[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'active' | 'contacted' | 'scheduled'>('all');
  const [stats, setStats] = useState({
    total: 0,
    active: 0,
    contacted: 0,
    scheduled: 0,
    activeSlots: 0,
    pendingInvitations: 0,
  });
  const toast = useToastContext();

  useEffect(() => {
    loadData();
    const interval = setInterval(loadData, 10000);
    return () => clearInterval(interval);
  }, []);

  async function loadData() {
    try {
      const [waitlistRes, slotsRes, invitationsRes] = await Promise.all([
        supabase.from('waitlist').select('*').order('created_at', { ascending: false }),
        supabase.from('appointment_slot_offers').select('*').order('created_at', { ascending: false }).limit(10),
        supabase
          .from('slot_offer_invitations')
          .select('*, waitlist_entry:waitlist(name, email)')
          .order('sent_at', { ascending: false })
          .limit(20),
      ]);

      if (waitlistRes.data) {
        setWaitlistEntries(waitlistRes.data);
        setStats({
          total: waitlistRes.data.length,
          active: waitlistRes.data.filter((w) => w.status === 'active').length,
          contacted: waitlistRes.data.filter((w) => w.status === 'contacted').length,
          scheduled: waitlistRes.data.filter((w) => w.status === 'scheduled').length,
          activeSlots: slotsRes.data?.filter((s) => s.status === 'pending' || s.status === 'available').length || 0,
          pendingInvitations: invitationsRes.data?.filter((i) => i.status === 'pending').length || 0,
        });
      }

      if (slotsRes.data) setSlotOffers(slotsRes.data);
      if (invitationsRes.data) setInvitations(invitationsRes.data);

      setLoading(false);
    } catch (error) {
      console.error('Error loading waitlist data:', error);
      toast.error('Erreur lors du chargement des données');
      setLoading(false);
    }
  }

  async function testCancellation() {
    try {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      tomorrow.setHours(10, 0, 0, 0);

      const { data: testAppointment, error: createError } = await supabase
        .from('appointments')
        .insert({
          name: 'Test Patient',
          email: 'test@example.com',
          phone: '555-0123',
          reason: 'Test',
          scheduled_date: tomorrow.toISOString().split('T')[0],
          scheduled_time: '10:00',
          duration_minutes: 30,
          status: 'confirmed',
        })
        .select()
        .single();

      if (createError) throw createError;

      await new Promise((resolve) => setTimeout(resolve, 1000));

      const { error: cancelError } = await supabase
        .from('appointments')
        .update({ status: 'cancelled' })
        .eq('id', testAppointment.id);

      if (cancelError) throw cancelError;

      toast.success('Test d\'annulation lancé! Vérifiez les invitations dans quelques secondes.');

      setTimeout(loadData, 3000);
    } catch (error: any) {
      console.error('Test error:', error);
      toast.error('Erreur lors du test: ' + error.message);
    }
  }

  async function runDiagnostics() {
    try {
      toast.info('Exécution du diagnostic système...');

      const functionUrl = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/diagnose-email-system`;

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 30000);

      const response = await fetch(functionUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
        },
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      const responseText = await response.text();

      if (!responseText || responseText.trim().length === 0) {
        console.error('❌ Empty response from diagnostic function');
        toast.error('Erreur: Réponse vide du serveur. Vérifiez les logs Supabase.');
        return;
      }

      let data;
      try {
        data = JSON.parse(responseText);
      } catch (parseError) {
        console.error('❌ Failed to parse diagnostic response:', responseText.substring(0, 500));
        toast.error('Erreur: Réponse invalide du serveur. Consultez la console.');
        return;
      }

      if (import.meta.env.DEV) {
        console.log('📊 Diagnostic Results:', data);
      }

      if (data.error) {
        console.error('❌ Diagnostic function error:', data);
        toast.error(`Erreur: ${data.message || data.error}`);
        return;
      }

      if (data.overall_status === 'healthy') {
        toast.success(`✅ Configuration email validée! ${data.results?.successes || 0} vérifications réussies.`);
      } else if (data.overall_status === 'degraded') {
        toast.error(`⚠️ ${data.results?.warnings || 0} avertissements détectés. Consultez la console.`);
      } else {
        const domainIssue = data.diagnostics?.find(
          (d: any) => d.category === 'Configuration Domaine' && d.status === 'error'
        );
        if (domainIssue) {
          toast.error(`🚨 CRITIQUE: Domaine non vérifié! Les emails vont à delivered@resend.dev`);
        } else {
          toast.error(`❌ ${data.results?.errors || 0} erreurs critiques! Consultez la console.`);
        }
      }

      if (data.recommendations && data.recommendations.length > 0) {
        console.log('📋 ACTIONS REQUISES:');
        data.recommendations.forEach((rec: string) => console.log(`  ${rec}`));

        const mainIssue = data.recommendations[0];
        if (mainIssue.includes('domaine') || mainIssue.includes('delivered@resend.dev')) {
          alert('⚠️ IMPORTANT:\n\nVos emails vont actuellement à delivered@resend.dev au lieu de vos patients!\n\nAction requise: Allez sur resend.com/domains et vérifiez votre domaine.\n\nConsultez la console pour plus de détails.');
        }
      }

      if (data.request_id) {
        console.log(`🔍 Request ID: ${data.request_id}`);
      }
    } catch (error: any) {
      if (error.name === 'AbortError') {
        console.error('❌ Diagnostic timeout after 30 seconds');
        toast.error('Erreur: Le diagnostic a pris trop de temps. Réessayez.');
      } else {
        console.error('❌ Diagnostic error:', error);
        toast.error(`Erreur lors du diagnostic: ${error.message || 'Erreur inconnue'}`);
      }
    }
  }

  async function testEmailConfiguration() {
    try {
      const email = prompt('Entrez votre email pour recevoir le test:');
      if (!email) return;

      toast.info('Envoi de l\'email de test en cours...');

      const functionUrl = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/test-email`;

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 30000);

      const response = await fetch(functionUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
        },
        body: JSON.stringify({
          to: email,
          subject: 'Test Configuration Resend - ChiroFlow',
          name: 'Administrateur',
        }),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      const responseText = await response.text();

      if (!responseText || responseText.trim().length === 0) {
        console.error('❌ Empty response from test-email function');
        toast.error('Erreur: Réponse vide du serveur.');
        return;
      }

      let data;
      try {
        data = JSON.parse(responseText);
      } catch (parseError) {
        console.error('❌ Failed to parse test-email response:', responseText.substring(0, 500));
        toast.error('Erreur: Réponse invalide du serveur.');
        return;
      }

      if (!response.ok) {
        console.error('Test email error:', data);
        toast.error(`Erreur: ${data.error || data.message || 'Configuration Resend incomplète'}`);

        if (data.hint && import.meta.env.DEV) {
          console.log('💡 Hint:', data.hint);
        }

        if (data.troubleshooting && import.meta.env.DEV) {
          console.log('🔧 Troubleshooting:', data.troubleshooting);
        }

        if (data.diagnosis && import.meta.env.DEV) {
          console.log('🔍 Diagnosis:', data.diagnosis);
        }

        return;
      }

      if (data.warning) {
        console.warn('⚠️ Email Warning:', data.warning);
        toast.error(data.warning);

        if (data.next_steps) {
          console.log('📋 Actions recommandées:');
          data.next_steps.forEach((step: string) => console.log(`  - ${step}`));
        }
      } else if (data.domain_verified) {
        toast.success(`✅ Email envoyé avec succès à ${email}! Vérifiez votre boîte mail.`);
      } else {
        toast.error(`⚠️ Email envoyé mais domaine non vérifié! Consultez delivered@resend.dev`);
        console.warn('⚠️ Le domaine n\'est pas vérifié - l\'email a été envoyé à l\'inbox de test Resend');
        if (data.next_steps) {
          console.log('📋 Actions requises:');
          data.next_steps.forEach((step: string) => console.log(`  - ${step}`));
        }
      }

      if (data.resend_id) {
        console.log('📧 Resend Email ID:', data.resend_id);
        console.log('📧 Domaine:', data.domain);
        console.log('📧 Domaine vérifié:', data.domain_verified);
      }
    } catch (error: any) {
      if (error.name === 'AbortError') {
        console.error('❌ Test email timeout after 30 seconds');
        toast.error('Erreur: L\'envoi a pris trop de temps. Réessayez.');
      } else {
        console.error('❌ Test email error:', error);
        toast.error(`Erreur lors du test: ${error.message || 'Erreur inconnue'}`);
      }
    }
  }

  function formatDate(dateStr: string): string {
    return new Date(dateStr).toLocaleDateString('fr-CA', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  }

  function formatDateTime(dateStr: string): string {
    return new Date(dateStr).toLocaleString('fr-CA', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  }

  function getTimeAgo(dateStr: string): string {
    const now = new Date();
    const past = new Date(dateStr);
    const diffMs = now.getTime() - past.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return 'Aujourd\'hui';
    if (diffDays === 1) return 'Hier';
    if (diffDays < 7) return `Il y a ${diffDays} jours`;
    if (diffDays < 30) return `Il y a ${Math.floor(diffDays / 7)} semaines`;
    return `Il y a ${Math.floor(diffDays / 30)} mois`;
  }

  function getStatusColor(status: string): string {
    switch (status) {
      case 'active':
        return 'bg-blue-100 text-blue-700';
      case 'contacted':
        return 'bg-yellow-100 text-yellow-700';
      case 'scheduled':
        return 'bg-green-100 text-green-700';
      case 'cancelled':
        return 'bg-gray-100 text-gray-700';
      case 'pending':
        return 'bg-orange-100 text-orange-700';
      case 'accepted':
        return 'bg-green-100 text-green-700';
      case 'declined':
        return 'bg-red-100 text-red-700';
      case 'expired':
        return 'bg-gray-100 text-gray-700';
      case 'claimed':
        return 'bg-emerald-100 text-emerald-700';
      default:
        return 'bg-neutral-100 text-neutral-700';
    }
  }

  const filteredEntries =
    filter === 'all' ? waitlistEntries : waitlistEntries.filter((e) => e.status === filter);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader className="w-8 h-8 text-gold-500 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6 relative">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-heading text-foreground">Liste de rappel intelligente</h2>
          <p className="text-sm text-foreground/60 mt-1">
            Système automatisé d'invitations pour créneaux annulés
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={runDiagnostics}
            className="px-4 py-2 bg-gradient-to-r from-purple-500 to-purple-600 text-white rounded-lg hover:from-purple-600 hover:to-purple-700 transition-all text-sm flex items-center gap-2"
            title="Vérifier la configuration complète du système d'emails"
          >
            🔍 Diagnostic
          </button>
          <button
            onClick={testEmailConfiguration}
            className="px-4 py-2 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-lg hover:from-blue-600 hover:to-blue-700 transition-all text-sm"
          >
            📧 Tester email
          </button>
          <button
            onClick={testCancellation}
            className="px-4 py-2 bg-gradient-to-r from-gold-500 to-gold-600 text-white rounded-lg hover:from-gold-600 hover:to-gold-700 transition-all text-sm"
          >
            🧪 Tester annulation
          </button>
        </div>
      </div>

      <EmailConfigWizard />

      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4">
        <StatCard
          icon={Users}
          label="Total"
          value={stats.total}
          color="blue"
          onClick={() => setFilter('all')}
          active={filter === 'all'}
        />
        <StatCard
          icon={Clock}
          label="En attente"
          value={stats.active}
          color="gold"
          onClick={() => setFilter('active')}
          active={filter === 'active'}
        />
        <StatCard
          icon={Send}
          label="Contactés"
          value={stats.contacted}
          color="yellow"
          onClick={() => setFilter('contacted')}
          active={filter === 'contacted'}
        />
        <StatCard
          icon={CheckCircle}
          label="Planifiés"
          value={stats.scheduled}
          color="green"
          onClick={() => setFilter('scheduled')}
          active={filter === 'scheduled'}
        />
        <StatCard
          icon={Calendar}
          label="Créneaux actifs"
          value={stats.activeSlots}
          color="purple"
        />
        <StatCard
          icon={AlertCircle}
          label="Invitations en cours"
          value={stats.pendingInvitations}
          color="orange"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white border border-neutral-200 shadow-soft-lg rounded-lg">
          <div className="p-6 border-b border-neutral-200">
            <h3 className="text-lg font-semibold text-foreground flex items-center gap-2">
              <Users className="w-5 h-5 text-gold-500" />
              Personnes en attente ({filteredEntries.length})
            </h3>
          </div>
          <div className="divide-y divide-neutral-200 max-h-[600px] overflow-y-auto">
            {filteredEntries.length === 0 ? (
              <div className="p-8 text-center">
                <Users className="w-12 h-12 text-foreground/20 mx-auto mb-3" />
                <p className="text-foreground/60">Aucune personne en attente</p>
              </div>
            ) : (
              filteredEntries.map((entry) => (
                <motion.div
                  key={entry.id}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="p-4 hover:bg-neutral-50 transition-colors"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h4 className="font-medium text-foreground truncate">{entry.name}</h4>
                        <span
                          className={`text-xs px-2 py-1 rounded-full ${getStatusColor(entry.status)}`}
                        >
                          {entry.status}
                        </span>
                      </div>
                      <p className="text-sm text-foreground/60 truncate">{entry.email}</p>
                      <p className="text-sm text-foreground/60">{entry.phone}</p>
                      <p className="text-xs text-foreground/50 mt-2">
                        Inscrit {getTimeAgo(entry.created_at)} • {entry.invitation_count} invitations
                      </p>
                    </div>
                    {!entry.consent_automated_notifications && (
                      <AlertCircle className="w-5 h-5 text-yellow-500 flex-shrink-0 ml-2" />
                    )}
                  </div>
                </motion.div>
              ))
            )}
          </div>
        </div>

        <div className="space-y-6">
          <div className="bg-white border border-neutral-200 shadow-soft-lg rounded-lg">
            <div className="p-6 border-b border-neutral-200">
              <h3 className="text-lg font-semibold text-foreground flex items-center gap-2">
                <Calendar className="w-5 h-5 text-gold-500" />
                Créneaux disponibles ({slotOffers.filter((s) => s.status !== 'claimed').length})
              </h3>
            </div>
            <div className="divide-y divide-neutral-200 max-h-[250px] overflow-y-auto">
              {slotOffers.filter((s) => s.status !== 'claimed').length === 0 ? (
                <div className="p-8 text-center">
                  <Calendar className="w-12 h-12 text-foreground/20 mx-auto mb-3" />
                  <p className="text-foreground/60">Aucun créneau disponible</p>
                </div>
              ) : (
                slotOffers
                  .filter((s) => s.status !== 'claimed')
                  .map((slot) => (
                    <div key={slot.id} className="p-4 hover:bg-neutral-50 transition-colors">
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="font-medium text-foreground">
                              {formatDate(slot.slot_date)} à {slot.slot_time}
                            </span>
                            <span className={`text-xs px-2 py-1 rounded-full ${getStatusColor(slot.status)}`}>
                              {slot.status}
                            </span>
                          </div>
                          <p className="text-sm text-foreground/60">{slot.duration_minutes} min</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-4 text-xs text-foreground/60">
                        <span>
                          {slot.invitation_count}/{slot.max_invitations} invitations
                        </span>
                        <span>Expire: {formatDateTime(slot.expires_at)}</span>
                      </div>
                    </div>
                  ))
              )}
            </div>
          </div>

          <div className="bg-white border border-neutral-200 shadow-soft-lg rounded-lg">
            <div className="p-6 border-b border-neutral-200">
              <h3 className="text-lg font-semibold text-foreground flex items-center gap-2">
                <Send className="w-5 h-5 text-gold-500" />
                Invitations récentes
              </h3>
            </div>
            <div className="divide-y divide-neutral-200 max-h-[250px] overflow-y-auto">
              {invitations.length === 0 ? (
                <div className="p-8 text-center">
                  <Send className="w-12 h-12 text-foreground/20 mx-auto mb-3" />
                  <p className="text-foreground/60">Aucune invitation</p>
                </div>
              ) : (
                invitations.map((inv) => (
                  <div key={inv.id} className="p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-foreground truncate">
                          {inv.waitlist_entry.name}
                        </p>
                        <p className="text-sm text-foreground/60 truncate">{inv.waitlist_entry.email}</p>
                        <p className="text-xs text-foreground/50 mt-1">
                          Envoyée {getTimeAgo(inv.sent_at)}
                        </p>
                      </div>
                      <span className={`text-xs px-2 py-1 rounded-full ${getStatusColor(inv.status)}`}>
                        {inv.status}
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

interface StatCardProps {
  icon: any;
  label: string;
  value: number;
  color: 'blue' | 'gold' | 'green' | 'yellow' | 'purple' | 'orange';
  onClick?: () => void;
  active?: boolean;
}

function StatCard({ icon: Icon, label, value, color, onClick, active }: StatCardProps) {
  const colorClasses = {
    blue: 'from-blue-500 to-blue-600',
    gold: 'from-gold-500 to-gold-600',
    green: 'from-green-500 to-green-600',
    yellow: 'from-yellow-500 to-yellow-600',
    purple: 'from-purple-500 to-purple-600',
    orange: 'from-orange-500 to-orange-600',
  };

  return (
    <motion.div
      whileHover={onClick ? { scale: 1.02 } : {}}
      onClick={onClick}
      className={`p-4 bg-white border-2 rounded-lg shadow-soft transition-all ${
        onClick ? 'cursor-pointer hover:shadow-lg' : ''
      } ${active ? 'border-gold-400 bg-gold-50' : 'border-neutral-200'}`}
    >
      <div className={`w-10 h-10 rounded-lg bg-gradient-to-br ${colorClasses[color]} flex items-center justify-center mb-3`}>
        <Icon className="w-5 h-5 text-white" />
      </div>
      <div className="text-2xl font-light text-foreground">{value}</div>
      <div className="text-sm text-foreground/60">{label}</div>
    </motion.div>
  );
}
