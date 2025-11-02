import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { supabase } from '../../lib/supabase';
import { useToastContext } from '../../contexts/ToastContext';
import { buttonHover, buttonTap } from '../../lib/animations';
import {
  Users,
  UserPlus,
  Clock,
  Calendar,
  Mail,
  Phone,
  Plus,
  Trash2,
  Send,
  CheckCircle,
  XCircle,
  AlertCircle,
  Star,
  ArrowUp,
  Filter,
  Search,
} from 'lucide-react';

interface NewClientWaitlist {
  id: string;
  full_name: string;
  email: string;
  phone: string;
  preferred_days: string[];
  preferred_times: string[];
  service_type_id?: string;
  status: string;
  priority: number;
  notes?: string;
  added_at: string;
  invited_at?: string;
}

interface RecallWaitlist {
  id: string;
  patient_id: string;
  patient_name: string;
  patient_email: string;
  patient_phone?: string;
  current_appointment_date?: string;
  preferred_days: string[];
  preferred_times: string[];
  willing_to_move_forward_by_days: number;
  status: string;
  priority: number;
  notes?: string;
  added_at: string;
  last_notified_at?: string;
}

interface WaitlistInvitation {
  id: string;
  invitation_type: string;
  recipient_name: string;
  recipient_email: string;
  opportunity_type: string;
  available_slot_date?: string;
  status: string;
  sent_at: string;
  responded_at?: string;
}

const DAYS = ['Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi', 'Dimanche'];
const TIMES = ['Matin', 'Après-midi', 'Soir'];

export function DualWaitlistManager() {
  const toast = useToastContext();
  const [activeTab, setActiveTab] = useState<'new' | 'recall' | 'history'>('new');
  const [loading, setLoading] = useState(true);

  // New clients waitlist
  const [newClients, setNewClients] = useState<NewClientWaitlist[]>([]);
  const [showNewClientForm, setShowNewClientForm] = useState(false);

  // Recall clients waitlist
  const [recallClients, setRecallClients] = useState<RecallWaitlist[]>([]);
  const [showRecallForm, setShowRecallForm] = useState(false);

  // Invitations history
  const [invitations, setInvitations] = useState<WaitlistInvitation[]>([]);

  // Search & filters
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    try {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Load new clients waitlist
      const { data: newData, error: newError } = await supabase
        .from('new_client_waitlist')
        .select('*')
        .eq('owner_id', user.id)
        .order('priority', { ascending: false })
        .order('added_at');

      if (newError) throw newError;
      setNewClients(newData || []);

      // Load recall waitlist
      const { data: recallData, error: recallError } = await supabase
        .from('recall_waitlist')
        .select('*')
        .eq('owner_id', user.id)
        .order('priority', { ascending: false })
        .order('added_at');

      if (recallError) throw recallError;
      setRecallClients(recallData || []);

      // Load invitations history
      const { data: invData, error: invError } = await supabase
        .from('waitlist_invitations')
        .select('*')
        .eq('owner_id', user.id)
        .order('sent_at', { ascending: false })
        .limit(50);

      if (invError) throw invError;
      setInvitations(invData || []);
    } catch (error: any) {
      console.error('Error loading waitlists:', error);
      toast.error('Erreur lors du chargement');
    } finally {
      setLoading(false);
    }
  }

  async function addNewClient(formData: FormData) {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { error } = await supabase
        .from('new_client_waitlist')
        .insert({
          owner_id: user.id,
          full_name: formData.get('full_name') as string,
          email: formData.get('email') as string,
          phone: formData.get('phone') as string,
          reason: formData.get('notes') as string || '',
          priority: 0,
          status: 'waiting',
        });

      if (error) throw error;

      toast.success('Nouveau client ajouté à la liste d\'attente');
      setShowNewClientForm(false);
      loadData();
    } catch (error: any) {
      console.error('Error adding new client:', error);
      toast.error('Erreur lors de l\'ajout');
    }
  }

  async function syncRecallClients() {
    try {
      setLoading(true);
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        toast.error('Session expirée');
        return;
      }

      const apiUrl = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/sync-recall-waitlist`;
      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json',
        },
      });

      const result = await response.json();

      if (result.error) {
        throw new Error(result.error);
      }

      toast.success(result.message);
      await loadData();
    } catch (error: any) {
      console.error('Error syncing recall clients:', error);
      toast.error(error.message || 'Erreur lors de la synchronisation');
    } finally {
      setLoading(false);
    }
  }

  async function removeFromWaitlist(id: string, type: 'new' | 'recall') {
    if (!confirm('Retirer cette personne de la liste d\'attente?')) return;

    try {
      const table = type === 'new' ? 'new_client_waitlist' : 'recall_waitlist';
      const { error } = await supabase
        .from(table)
        .delete()
        .eq('id', id);

      if (error) throw error;

      toast.success('Retiré de la liste d\'attente');
      loadData();
    } catch (error: any) {
      console.error('Error removing from waitlist:', error);
      toast.error('Erreur lors de la suppression');
    }
  }

  async function increasePriority(id: string, type: 'new' | 'recall', currentPriority: number) {
    try {
      const table = type === 'new' ? 'new_client_waitlist' : 'recall_waitlist';
      const { error } = await supabase
        .from(table)
        .update({ priority: currentPriority + 1 })
        .eq('id', id);

      if (error) throw error;

      toast.success('Priorité augmentée');
      loadData();
    } catch (error: any) {
      console.error('Error updating priority:', error);
      toast.error('Erreur');
    }
  }

  const filteredNewClients = newClients.filter((client) => {
    const matchesSearch = client.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         client.email.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || client.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const filteredRecallClients = recallClients.filter((client) => {
    const matchesSearch = client.patient_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         client.patient_email.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || client.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gold-500"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-heading text-foreground">Listes d'Attente</h2>
          <p className="text-sm text-neutral-600 mt-1">
            Gérez vos nouveaux clients et les rappels de clients actuels
          </p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b border-neutral-200">
        <button
          onClick={() => setActiveTab('new')}
          className={`flex items-center gap-2 px-4 py-2 border-b-2 transition-colors ${
            activeTab === 'new'
              ? 'border-gold-500 text-gold-600'
              : 'border-transparent text-neutral-600 hover:text-neutral-900'
          }`}
        >
          <UserPlus className="w-4 h-4" />
          Clients Liste d'Attente
          <span className="px-2 py-0.5 bg-gold-100 text-gold-700 rounded-full text-xs font-medium">
            {newClients.filter((c) => c.status === 'waiting').length}
          </span>
        </button>
        <button
          onClick={() => setActiveTab('recall')}
          className={`flex items-center gap-2 px-4 py-2 border-b-2 transition-colors ${
            activeTab === 'recall'
              ? 'border-gold-500 text-gold-600'
              : 'border-transparent text-neutral-600 hover:text-neutral-900'
          }`}
        >
          <Clock className="w-4 h-4" />
          Patients Actuels
          <span className="px-2 py-0.5 bg-blue-100 text-blue-700 rounded-full text-xs font-medium">
            {recallClients.filter((c) => c.status === 'active').length}
          </span>
        </button>
        <button
          onClick={() => setActiveTab('history')}
          className={`flex items-center gap-2 px-4 py-2 border-b-2 transition-colors ${
            activeTab === 'history'
              ? 'border-gold-500 text-gold-600'
              : 'border-transparent text-neutral-600 hover:text-neutral-900'
          }`}
        >
          <Mail className="w-4 h-4" />
          Historique Invitations
          <span className="px-2 py-0.5 bg-neutral-100 text-neutral-700 rounded-full text-xs font-medium">
            {invitations.length}
          </span>
        </button>
      </div>

      {/* Search & Filters */}
      <div className="flex gap-3">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
          <input
            type="text"
            placeholder="Rechercher..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-gold-500"
          />
        </div>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="px-4 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-gold-500"
        >
          <option value="all">Tous les statuts</option>
          <option value="waiting">En attente</option>
          <option value="active">Actif</option>
          <option value="invited">Invité</option>
          <option value="notified">Notifié</option>
          <option value="accepted">Accepté</option>
          <option value="declined">Refusé</option>
        </select>
      </div>

      {/* New Clients Tab */}
      {activeTab === 'new' && (
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <div className="text-sm text-neutral-600">
              {filteredNewClients.length} client(s) en liste d'attente
            </div>
            <button
              onClick={() => setShowNewClientForm(true)}
              className="flex items-center gap-2 px-4 py-2 bg-gold-500 text-white rounded-lg hover:bg-gold-600"
            >
              <Plus className="w-4 h-4" />
              Ajouter un client
            </button>
          </div>

          {showNewClientForm && (
            <div className="bg-white border border-neutral-200 rounded-lg p-6">
              <h3 className="font-medium mb-4">Ajouter à la liste d'attente</h3>
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  addNewClient(new FormData(e.currentTarget));
                }}
                className="space-y-4"
              >
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-neutral-700 mb-1">
                      Nom complet *
                    </label>
                    <input
                      type="text"
                      name="full_name"
                      required
                      className="w-full px-3 py-2 border border-neutral-300 rounded-lg"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-neutral-700 mb-1">
                      Email *
                    </label>
                    <input
                      type="email"
                      name="email"
                      required
                      className="w-full px-3 py-2 border border-neutral-300 rounded-lg"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-neutral-700 mb-1">
                      Téléphone *
                    </label>
                    <input
                      type="tel"
                      name="phone"
                      required
                      className="w-full px-3 py-2 border border-neutral-300 rounded-lg"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-1">
                    Notes
                  </label>
                  <textarea
                    name="notes"
                    rows={2}
                    className="w-full px-3 py-2 border border-neutral-300 rounded-lg"
                  />
                </div>
                <div className="flex gap-3">
                  <button
                    type="submit"
                    className="px-4 py-2 bg-gold-500 text-white rounded-lg hover:bg-gold-600"
                  >
                    Ajouter
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowNewClientForm(false)}
                    className="px-4 py-2 border border-neutral-300 rounded-lg hover:bg-neutral-50"
                  >
                    Annuler
                  </button>
                </div>
              </form>
            </div>
          )}

          <div className="space-y-3">
            {filteredNewClients.map((client) => (
              <div
                key={client.id}
                className="bg-white border border-neutral-200 rounded-lg p-4 hover:shadow-md transition-shadow"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="font-medium text-foreground">{client.full_name}</h3>
                      {client.priority > 0 && (
                        <span className="flex items-center gap-1 px-2 py-0.5 bg-gold-100 text-gold-700 rounded text-xs">
                          <Star className="w-3 h-3" />
                          Priorité {client.priority}
                        </span>
                      )}
                      <span
                        className={`px-2 py-0.5 rounded text-xs ${
                          client.status === 'waiting'
                            ? 'bg-blue-100 text-blue-700'
                            : client.status === 'invited'
                            ? 'bg-gold-100 text-gold-700'
                            : client.status === 'accepted'
                            ? 'bg-green-100 text-green-700'
                            : 'bg-neutral-100 text-neutral-700'
                        }`}
                      >
                        {client.status}
                      </span>
                    </div>
                    <div className="grid grid-cols-2 gap-2 text-sm text-neutral-600">
                      <div className="flex items-center gap-2">
                        <Mail className="w-4 h-4" />
                        {client.email}
                      </div>
                      <div className="flex items-center gap-2">
                        <Phone className="w-4 h-4" />
                        {client.phone}
                      </div>
                      <div className="flex items-center gap-2">
                        <Calendar className="w-4 h-4" />
                        Ajouté le {new Date(client.added_at).toLocaleDateString('fr-CA')}
                      </div>
                    </div>
                    {client.notes && (
                      <p className="text-sm text-neutral-600 mt-2">{client.notes}</p>
                    )}
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => increasePriority(client.id, 'new', client.priority)}
                      className="p-2 text-gold-600 hover:bg-gold-50 rounded-lg"
                      title="Augmenter la priorité"
                    >
                      <ArrowUp className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => removeFromWaitlist(client.id, 'new')}
                      className="p-2 text-red-600 hover:bg-red-50 rounded-lg"
                      title="Retirer"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
            {filteredNewClients.length === 0 && (
              <div className="text-center py-12 text-neutral-500">
                Aucun client en liste d'attente
              </div>
            )}
          </div>
        </div>
      )}

      {/* Recall Clients Tab */}
      {activeTab === 'recall' && (
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <div className="text-sm text-neutral-600">
              {filteredRecallClients.length} patient(s) actuel(s) en attente de rappel
            </div>
            <button
              onClick={syncRecallClients}
              className="flex items-center gap-2 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
            >
              <Users className="w-4 h-4" />
              Synchroniser les clients
            </button>
          </div>

          <div className="space-y-3">
            {filteredRecallClients.map((client) => (
              <div
                key={client.id}
                className="bg-white border border-neutral-200 rounded-lg p-4 hover:shadow-md transition-shadow"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="font-medium text-foreground">{client.patient_name}</h3>
                      {client.priority > 0 && (
                        <span className="flex items-center gap-1 px-2 py-0.5 bg-gold-100 text-gold-700 rounded text-xs">
                          <Star className="w-3 h-3" />
                          Priorité {client.priority}
                        </span>
                      )}
                      <span
                        className={`px-2 py-0.5 rounded text-xs ${
                          client.status === 'active'
                            ? 'bg-blue-100 text-blue-700'
                            : client.status === 'notified'
                            ? 'bg-gold-100 text-gold-700'
                            : client.status === 'accepted'
                            ? 'bg-green-100 text-green-700'
                            : 'bg-neutral-100 text-neutral-700'
                        }`}
                      >
                        {client.status}
                      </span>
                    </div>
                    <div className="grid grid-cols-2 gap-2 text-sm text-neutral-600">
                      <div className="flex items-center gap-2">
                        <Mail className="w-4 h-4" />
                        {client.patient_email}
                      </div>
                      {client.patient_phone && (
                        <div className="flex items-center gap-2">
                          <Phone className="w-4 h-4" />
                          {client.patient_phone}
                        </div>
                      )}
                      {client.current_appointment_date && (
                        <div className="flex items-center gap-2">
                          <Calendar className="w-4 h-4" />
                          Prochain RDV: {new Date(client.current_appointment_date).toLocaleDateString('fr-CA')}
                        </div>
                      )}
                      <div className="flex items-center gap-2">
                        <Clock className="w-4 h-4" />
                        Peut avancer de {client.willing_to_move_forward_by_days} jour(s)
                      </div>
                    </div>
                    {client.notes && (
                      <p className="text-sm text-neutral-600 mt-2">{client.notes}</p>
                    )}
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => increasePriority(client.id, 'recall', client.priority)}
                      className="p-2 text-gold-600 hover:bg-gold-50 rounded-lg"
                      title="Augmenter la priorité"
                    >
                      <ArrowUp className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => removeFromWaitlist(client.id, 'recall')}
                      className="p-2 text-red-600 hover:bg-red-50 rounded-lg"
                      title="Retirer"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
            {filteredRecallClients.length === 0 && (
              <div className="text-center py-12 text-neutral-500">
                Aucun patient actuel en attente de rappel
              </div>
            )}
          </div>
        </div>
      )}

      {/* History Tab */}
      {activeTab === 'history' && (
        <div className="space-y-3">
          {invitations.map((inv) => (
            <div
              key={inv.id}
              className="bg-white border border-neutral-200 rounded-lg p-4"
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="font-medium text-foreground">{inv.recipient_name}</h3>
                    <span
                      className={`px-2 py-0.5 rounded text-xs ${
                        inv.invitation_type === 'new_client'
                          ? 'bg-gold-100 text-gold-700'
                          : 'bg-blue-100 text-blue-700'
                      }`}
                    >
                      {inv.invitation_type === 'new_client' ? 'Nouveau client' : 'Client actuel'}
                    </span>
                    <span
                      className={`flex items-center gap-1 px-2 py-0.5 rounded text-xs ${
                        inv.status === 'accepted'
                          ? 'bg-green-100 text-green-700'
                          : inv.status === 'declined'
                          ? 'bg-red-100 text-red-700'
                          : inv.status === 'sent'
                          ? 'bg-blue-100 text-blue-700'
                          : 'bg-neutral-100 text-neutral-700'
                      }`}
                    >
                      {inv.status === 'accepted' && <CheckCircle className="w-3 h-3" />}
                      {inv.status === 'declined' && <XCircle className="w-3 h-3" />}
                      {inv.status === 'sent' && <Send className="w-3 h-3" />}
                      {inv.status}
                    </span>
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-sm text-neutral-600">
                    <div className="flex items-center gap-2">
                      <Mail className="w-4 h-4" />
                      {inv.recipient_email}
                    </div>
                    <div className="flex items-center gap-2">
                      <Calendar className="w-4 h-4" />
                      Envoyé le {new Date(inv.sent_at).toLocaleDateString('fr-CA')}
                    </div>
                    <div>
                      Type: {inv.opportunity_type === 'client_left' ? 'Client parti' : 'Annulation'}
                    </div>
                    {inv.available_slot_date && (
                      <div>
                        Créneau: {new Date(inv.available_slot_date).toLocaleDateString('fr-CA')}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))}
          {invitations.length === 0 && (
            <div className="text-center py-12 text-neutral-500">
              Aucune invitation envoyée
            </div>
          )}
        </div>
      )}
    </div>
  );
}
