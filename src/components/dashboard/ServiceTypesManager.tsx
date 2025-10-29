import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '../../lib/supabase';
import { useToastContext } from '../../contexts/ToastContext';
import {
  Calendar,
  DollarSign,
  Plus,
  Edit2,
  Trash2,
  Save,
  X,
  Clock,
  ToggleLeft,
  ToggleRight,
  Sparkles,
} from 'lucide-react';

interface ServiceType {
  id?: string;
  name: string;
  description: string;
  duration_minutes: number;
  price: number;
  color: string;
  is_active: boolean;
  requires_deposit: boolean;
  deposit_amount: number;
  allow_online_booking: boolean;
  category: string;
}

const SERVICE_CATEGORIES = [
  'Consultation',
  'Traitement',
  'Suivi',
  'Évaluation',
  'Thérapie',
  'Prévention',
  'Autre',
];

const DEFAULT_COLORS = [
  '#C9A55C', '#4299e1', '#48bb78', '#ed8936', '#9f7aea',
  '#f56565', '#38b2ac', '#ec4899', '#8b5cf6', '#10b981',
];

export function ServiceTypesManager() {
  const toast = useToastContext();
  const [services, setServices] = useState<ServiceType[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingService, setEditingService] = useState<ServiceType | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState<ServiceType>({
    name: '',
    description: '',
    duration_minutes: 30,
    price: 0,
    color: DEFAULT_COLORS[0],
    is_active: true,
    requires_deposit: false,
    deposit_amount: 0,
    allow_online_booking: true,
    category: 'Traitement',
  });

  useEffect(() => {
    loadServices();
  }, []);

  async function loadServices() {
    try {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from('service_types')
        .select('*')
        .eq('owner_id', user.id)
        .order('name');

      if (error) throw error;
      setServices(data || []);
    } catch (error) {
      console.error('Error loading services:', error);
      toast.error('Erreur lors du chargement');
    } finally {
      setLoading(false);
    }
  }

  function openCreateForm() {
    setEditingService(null);
    setFormData({
      name: '',
      description: '',
      duration_minutes: 30,
      price: 0,
      color: DEFAULT_COLORS[services.length % DEFAULT_COLORS.length],
      is_active: true,
      requires_deposit: false,
      deposit_amount: 0,
      allow_online_booking: true,
      category: 'Traitement',
    });
    setShowForm(true);
  }

  function openEditForm(service: ServiceType) {
    setEditingService(service);
    setFormData({
      name: service.name,
      description: service.description,
      duration_minutes: service.duration_minutes,
      price: service.price,
      color: service.color,
      is_active: service.is_active,
      requires_deposit: service.requires_deposit,
      deposit_amount: service.deposit_amount,
      allow_online_booking: service.allow_online_booking,
      category: service.category,
    });
    setShowForm(true);
  }

  function closeForm() {
    setShowForm(false);
    setEditingService(null);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (!formData.name.trim()) {
      toast.error('Le nom du service est requis');
      return;
    }

    if (formData.price < 0) {
      toast.error('Le prix ne peut pas être négatif');
      return;
    }

    if (formData.duration_minutes <= 0) {
      toast.error('La durée doit être supérieure à 0');
      return;
    }

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const serviceData = {
        ...formData,
        owner_id: user.id,
      };

      if (editingService?.id) {
        const { error } = await supabase
          .from('service_types')
          .update(serviceData)
          .eq('id', editingService.id);

        if (error) throw error;
        toast.success('Service modifié!');
      } else {
        const { error } = await supabase
          .from('service_types')
          .insert([serviceData]);

        if (error) throw error;
        toast.success('Service créé!');
      }

      await loadServices();
      closeForm();
    } catch (error) {
      console.error('Error saving service:', error);
      toast.error('Erreur lors de la sauvegarde');
    }
  }

  async function handleDelete(service: ServiceType) {
    if (!service.id) return;

    const confirmed = window.confirm(
      `Êtes-vous sûr de vouloir supprimer "${service.name}"?\nCette action est irréversible.`
    );

    if (!confirmed) return;

    try {
      const { error } = await supabase
        .from('service_types')
        .delete()
        .eq('id', service.id);

      if (error) throw error;

      toast.success('Service supprimé');
      await loadServices();
    } catch (error) {
      console.error('Error deleting service:', error);
      toast.error('Erreur lors de la suppression');
    }
  }

  async function toggleActive(service: ServiceType) {
    if (!service.id) return;

    try {
      const { error } = await supabase
        .from('service_types')
        .update({ is_active: !service.is_active })
        .eq('id', service.id);

      if (error) throw error;

      toast.success(service.is_active ? 'Service désactivé' : 'Service activé');
      await loadServices();
    } catch (error) {
      console.error('Error toggling service:', error);
      toast.error('Erreur lors de la mise à jour');
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gold-500"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-heading text-foreground flex items-center gap-2">
            <Calendar className="w-5 h-5 text-gold-500" />
            Gestion des Types de Services
          </h3>
          <p className="text-sm text-neutral-600 mt-1">
            Configurez vos services, tarifs et durées
          </p>
        </div>
        <button
          onClick={openCreateForm}
          className="flex items-center gap-2 px-6 py-2 bg-gold-500 text-white rounded-lg hover:bg-gold-600 transition-colors"
        >
          <Plus className="w-4 h-4" />
          Nouveau service
        </button>
      </div>

      {/* Stats Summary */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg p-4">
          <div className="text-sm text-blue-700 mb-1">Total services</div>
          <div className="text-2xl font-bold text-blue-900">{services.length}</div>
        </div>
        <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-lg p-4">
          <div className="text-sm text-green-700 mb-1">Actifs</div>
          <div className="text-2xl font-bold text-green-900">
            {services.filter(s => s.is_active).length}
          </div>
        </div>
        <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-lg p-4">
          <div className="text-sm text-purple-700 mb-1">Réservation en ligne</div>
          <div className="text-2xl font-bold text-purple-900">
            {services.filter(s => s.allow_online_booking).length}
          </div>
        </div>
        <div className="bg-gradient-to-br from-gold-50 to-gold-100 rounded-lg p-4">
          <div className="text-sm text-gold-700 mb-1">Prix moyen</div>
          <div className="text-2xl font-bold text-gold-900">
            {services.length > 0
              ? `${(services.reduce((sum, s) => sum + s.price, 0) / services.length).toFixed(0)} $`
              : '0 $'}
          </div>
        </div>
      </div>

      {/* Services List */}
      {services.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-lg border border-neutral-200">
          <Calendar className="w-16 h-16 text-neutral-300 mx-auto mb-4" />
          <h3 className="text-lg font-heading text-foreground mb-2">Aucun service</h3>
          <p className="text-neutral-600 mb-4">
            Créez votre premier type de service pour commencer
          </p>
          <button
            onClick={openCreateForm}
            className="inline-flex items-center gap-2 px-6 py-2 bg-gold-500 text-white rounded-lg hover:bg-gold-600 transition-colors"
          >
            <Plus className="w-4 h-4" />
            Créer un service
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {services.map((service) => (
            <motion.div
              key={service.id}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className={`bg-white rounded-lg border-2 p-6 transition-all ${
                service.is_active
                  ? 'border-neutral-200 hover:border-gold-300'
                  : 'border-neutral-200 opacity-60'
              }`}
            >
              {/* Header */}
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div
                    className="w-4 h-4 rounded-full"
                    style={{ backgroundColor: service.color }}
                  ></div>
                  <div>
                    <h4 className="font-semibold text-foreground">{service.name}</h4>
                    <span className="text-xs text-neutral-600">{service.category}</span>
                  </div>
                </div>
                <button
                  onClick={() => toggleActive(service)}
                  className="text-neutral-400 hover:text-neutral-600"
                >
                  {service.is_active ? (
                    <ToggleRight className="w-6 h-6 text-green-500" />
                  ) : (
                    <ToggleLeft className="w-6 h-6" />
                  )}
                </button>
              </div>

              {/* Description */}
              {service.description && (
                <p className="text-sm text-neutral-600 mb-4">{service.description}</p>
              )}

              {/* Info */}
              <div className="space-y-2 mb-4">
                <div className="flex items-center gap-2 text-sm">
                  <Clock className="w-4 h-4 text-neutral-400" />
                  <span className="text-neutral-700">{service.duration_minutes} minutes</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <DollarSign className="w-4 h-4 text-neutral-400" />
                  <span className="text-neutral-700 font-semibold">{service.price.toFixed(2)} $</span>
                </div>
                {service.requires_deposit && (
                  <div className="flex items-center gap-2 text-sm text-orange-600">
                    <Sparkles className="w-4 h-4" />
                    <span>Dépôt: {service.deposit_amount.toFixed(2)} $</span>
                  </div>
                )}
              </div>

              {/* Badges */}
              <div className="flex flex-wrap gap-2 mb-4">
                {service.allow_online_booking && (
                  <span className="px-2 py-1 bg-blue-100 text-blue-700 text-xs rounded-full">
                    Réservation en ligne
                  </span>
                )}
                {!service.is_active && (
                  <span className="px-2 py-1 bg-neutral-200 text-neutral-600 text-xs rounded-full">
                    Inactif
                  </span>
                )}
              </div>

              {/* Actions */}
              <div className="flex gap-2 pt-4 border-t border-neutral-200">
                <button
                  onClick={() => openEditForm(service)}
                  className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition-colors"
                >
                  <Edit2 className="w-4 h-4" />
                  Modifier
                </button>
                <button
                  onClick={() => handleDelete(service)}
                  className="flex items-center justify-center gap-2 px-3 py-2 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {/* Form Modal */}
      <AnimatePresence>
        {showForm && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
            onClick={closeForm}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >
              <form onSubmit={handleSubmit} className="p-6 space-y-6">
                {/* Header */}
                <div className="flex items-center justify-between pb-4 border-b">
                  <h3 className="text-xl font-heading text-foreground">
                    {editingService ? 'Modifier le service' : 'Nouveau service'}
                  </h3>
                  <button
                    type="button"
                    onClick={closeForm}
                    className="p-2 hover:bg-neutral-100 rounded-lg transition-colors"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                {/* Form Fields */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Name */}
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-neutral-700 mb-2">
                      Nom du service *
                    </label>
                    <input
                      type="text"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-gold-500 focus:border-transparent"
                      placeholder="Ex: Consultation initiale"
                      required
                    />
                  </div>

                  {/* Category */}
                  <div>
                    <label className="block text-sm font-medium text-neutral-700 mb-2">
                      Catégorie
                    </label>
                    <select
                      value={formData.category}
                      onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                      className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-gold-500"
                    >
                      {SERVICE_CATEGORIES.map((cat) => (
                        <option key={cat} value={cat}>{cat}</option>
                      ))}
                    </select>
                  </div>

                  {/* Color */}
                  <div>
                    <label className="block text-sm font-medium text-neutral-700 mb-2">
                      Couleur (calendrier)
                    </label>
                    <div className="flex gap-2">
                      <input
                        type="color"
                        value={formData.color}
                        onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                        className="w-16 h-10 rounded border border-neutral-300 cursor-pointer"
                      />
                      <input
                        type="text"
                        value={formData.color}
                        readOnly
                        className="flex-1 px-3 py-2 border border-neutral-300 rounded-lg bg-neutral-50 font-mono text-sm"
                      />
                    </div>
                  </div>

                  {/* Duration */}
                  <div>
                    <label className="block text-sm font-medium text-neutral-700 mb-2">
                      Durée (minutes) *
                    </label>
                    <input
                      type="number"
                      value={formData.duration_minutes}
                      onChange={(e) => setFormData({ ...formData, duration_minutes: parseInt(e.target.value) })}
                      className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-gold-500"
                      min="5"
                      step="5"
                      required
                    />
                  </div>

                  {/* Price */}
                  <div>
                    <label className="block text-sm font-medium text-neutral-700 mb-2">
                      Prix ($) *
                    </label>
                    <input
                      type="number"
                      value={formData.price}
                      onChange={(e) => setFormData({ ...formData, price: parseFloat(e.target.value) })}
                      className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-gold-500"
                      min="0"
                      step="0.01"
                      required
                    />
                  </div>

                  {/* Description */}
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-neutral-700 mb-2">
                      Description
                    </label>
                    <textarea
                      value={formData.description}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      rows={3}
                      className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-gold-500"
                      placeholder="Description du service..."
                    />
                  </div>

                  {/* Checkboxes */}
                  <div className="md:col-span-2 space-y-3 bg-neutral-50 p-4 rounded-lg">
                    <label className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={formData.is_active}
                        onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                        className="w-4 h-4 rounded border-neutral-300 text-gold-500 focus:ring-gold-500"
                      />
                      <span className="text-sm text-neutral-700">Service actif</span>
                    </label>
                    <label className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={formData.allow_online_booking}
                        onChange={(e) => setFormData({ ...formData, allow_online_booking: e.target.checked })}
                        className="w-4 h-4 rounded border-neutral-300 text-gold-500 focus:ring-gold-500"
                      />
                      <span className="text-sm text-neutral-700">Autoriser la réservation en ligne</span>
                    </label>
                    <label className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={formData.requires_deposit}
                        onChange={(e) => setFormData({ ...formData, requires_deposit: e.target.checked })}
                        className="w-4 h-4 rounded border-neutral-300 text-gold-500 focus:ring-gold-500"
                      />
                      <span className="text-sm text-neutral-700">Dépôt requis</span>
                    </label>
                  </div>

                  {/* Deposit Amount */}
                  {formData.requires_deposit && (
                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-neutral-700 mb-2">
                        Montant du dépôt ($)
                      </label>
                      <input
                        type="number"
                        value={formData.deposit_amount}
                        onChange={(e) => setFormData({ ...formData, deposit_amount: parseFloat(e.target.value) })}
                        className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-gold-500"
                        min="0"
                        step="0.01"
                      />
                    </div>
                  )}
                </div>

                {/* Actions */}
                <div className="flex gap-3 pt-4 border-t">
                  <button
                    type="button"
                    onClick={closeForm}
                    className="flex-1 px-6 py-2 border border-neutral-300 rounded-lg hover:bg-neutral-50 transition-colors"
                  >
                    Annuler
                  </button>
                  <button
                    type="submit"
                    className="flex-1 flex items-center justify-center gap-2 px-6 py-2 bg-gold-500 text-white rounded-lg hover:bg-gold-600 transition-colors"
                  >
                    <Save className="w-4 h-4" />
                    {editingService ? 'Sauvegarder' : 'Créer'}
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
