import { motion } from 'framer-motion';
import { X, User, Mail, Phone, Calendar, MapPin, Edit, Save, FileText, Eye, FolderOpen } from 'lucide-react';
import { useState } from 'react';
import { supabase } from '../../lib/supabase';
import { useToastContext } from '../../contexts/ToastContext';
import { MegaPatientFile } from './MegaPatientFile';

interface Contact {
  id: string;
  full_name: string;
  email: string;
  phone: string;
  date_of_birth: string;
  status: string;
  address?: string;
  notes?: string;
  created_at: string;
  updated_at?: string;
}

interface ContactDetailsModalProps {
  contact: Contact;
  onClose: () => void;
  onUpdate?: () => void;
}

export function ContactDetailsModal({ contact, onClose, onUpdate }: ContactDetailsModalProps) {
  const toast = useToastContext();
  const isNewContact = !contact.id || contact.id === '';
  const [isEditing, setIsEditing] = useState(isNewContact);
  const [formData, setFormData] = useState(contact);
  const [saving, setSaving] = useState(false);
  const [showFullFile, setShowFullFile] = useState(false);

  async function handleSave() {
    setSaving(true);
    try {
      if (isNewContact) {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
          toast.error('Utilisateur non authentifié');
          setSaving(false);
          return;
        }

        const { error } = await supabase
          .from('contacts')
          .insert({
            full_name: formData.full_name,
            email: formData.email,
            phone: formData.phone,
            date_of_birth: formData.date_of_birth,
            status: formData.status || 'active',
            address: formData.address,
            notes: formData.notes,
            owner_id: user.id,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          });

        if (error) throw error;
        toast.success('Patient créé avec succès');
      } else {
        const { error } = await supabase
          .from('contacts')
          .update({
            full_name: formData.full_name,
            email: formData.email,
            phone: formData.phone,
            date_of_birth: formData.date_of_birth,
            status: formData.status,
            address: formData.address,
            notes: formData.notes,
            updated_at: new Date().toISOString()
          })
          .eq('id', contact.id);

        if (error) throw error;
        toast.success('Contact mis à jour avec succès');
      }

      setIsEditing(false);
      if (onUpdate) onUpdate();
    } catch (error) {
      console.error('Error updating contact:', error);
      toast.error('Erreur lors de la mise à jour');
    } finally {
      setSaving(false);
    }
  }

  const formatDate = (dateString?: string) => {
    if (!dateString) return 'Non spécifié';
    return new Date(dateString).toLocaleDateString('fr-FR');
  };

  const getStatusBadge = () => {
    const badges = {
      active: 'bg-green-100 text-green-700',
      inactive: 'bg-gray-100 text-gray-700',
      archived: 'bg-red-100 text-red-700'
    };
    return badges[formData.status as keyof typeof badges] || badges.active;
  };

  if (showFullFile) {
    return (
      <MegaPatientFile
        patient={{
          ...contact,
          first_name: contact.full_name.split(' ')[0] || '',
          last_name: contact.full_name.split(' ').slice(1).join(' ') || '',
          total_visits: 0,
          status: contact.status || 'active'
        } as any}
        onClose={() => setShowFullFile(false)}
      />
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.95, opacity: 0 }}
        className="bg-white rounded-2xl shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="bg-gradient-to-r from-blue-600 to-blue-700 px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-white bg-opacity-20 rounded-full flex items-center justify-center">
              <User className="w-6 h-6 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white">
                {isEditing ? 'Modifier le contact' : contact.full_name}
              </h2>
              <p className="text-blue-100 text-sm">
                Ajouté le {formatDate(contact.created_at)}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-white hover:bg-opacity-20 rounded-lg transition-all"
          >
            <X className="w-5 h-5 text-white" />
          </button>
        </div>

        <div className="p-6 overflow-y-auto max-h-[calc(90vh-80px)]">
          {!isNewContact && (
            <div className="mb-6 p-4 bg-gradient-to-r from-blue-50 to-blue-100 border-2 border-blue-200 rounded-xl">
              <button
                onClick={() => setShowFullFile(true)}
                className="w-full flex items-center justify-center gap-3 px-6 py-4 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-all shadow-lg hover:shadow-xl transform hover:scale-105"
              >
                <FolderOpen className="w-6 h-6" />
                <div className="text-left">
                  <div className="font-bold text-lg">Voir le Dossier Complet</div>
                  <div className="text-sm text-blue-100">Historique, formulaires, facturation, documents...</div>
                </div>
                <Eye className="w-6 h-6 ml-auto" />
              </button>
            </div>
          )}

          <div className="flex items-center justify-between mb-6">
            <span className={`px-3 py-1 rounded-full text-sm font-semibold ${getStatusBadge()}`}>
              {formData.status === 'active' && 'Actif'}
              {formData.status === 'inactive' && 'Inactif'}
              {formData.status === 'archived' && 'Archivé'}
            </span>
            {!isEditing ? (
              <button
                onClick={() => setIsEditing(true)}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-all"
              >
                <Edit className="w-4 h-4" />
                Modifier
              </button>
            ) : (
              <div className="flex gap-2">
                <button
                  onClick={() => {
                    setFormData(contact);
                    setIsEditing(false);
                  }}
                  className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-all"
                >
                  Annuler
                </button>
                <button
                  onClick={handleSave}
                  disabled={saving}
                  className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-all disabled:opacity-50"
                >
                  <Save className="w-4 h-4" />
                  {saving ? 'Enregistrement...' : 'Enregistrer'}
                </button>
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  <User className="w-4 h-4 inline mr-2" />
                  Nom complet
                </label>
                {isEditing ? (
                  <input
                    type="text"
                    value={formData.full_name}
                    onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                ) : (
                  <p className="text-gray-900">{contact.full_name || 'Non spécifié'}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  <Mail className="w-4 h-4 inline mr-2" />
                  Email
                </label>
                {isEditing ? (
                  <input
                    type="email"
                    value={formData.email || ''}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                ) : (
                  <p className="text-gray-900">{contact.email || 'Non spécifié'}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  <Phone className="w-4 h-4 inline mr-2" />
                  Téléphone
                </label>
                {isEditing ? (
                  <input
                    type="tel"
                    value={formData.phone || ''}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                ) : (
                  <p className="text-gray-900">{contact.phone || 'Non spécifié'}</p>
                )}
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  <Calendar className="w-4 h-4 inline mr-2" />
                  Date de naissance
                </label>
                {isEditing ? (
                  <input
                    type="date"
                    value={formData.date_of_birth || ''}
                    onChange={(e) => setFormData({ ...formData, date_of_birth: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                ) : (
                  <p className="text-gray-900">{formatDate(contact.date_of_birth)}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  <MapPin className="w-4 h-4 inline mr-2" />
                  Adresse
                </label>
                {isEditing ? (
                  <textarea
                    value={formData.address || ''}
                    onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                    rows={3}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                ) : (
                  <p className="text-gray-900">{contact.address || 'Non spécifié'}</p>
                )}
              </div>

              {isEditing && (
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Statut
                  </label>
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="active">Actif</option>
                    <option value="inactive">Inactif</option>
                    <option value="archived">Archivé</option>
                  </select>
                </div>
              )}
            </div>
          </div>

          <div className="mt-6">
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              <FileText className="w-4 h-4 inline mr-2" />
              Notes
            </label>
            {isEditing ? (
              <textarea
                value={formData.notes || ''}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                rows={4}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Notes additionnelles..."
              />
            ) : (
              <p className="text-gray-900 whitespace-pre-wrap">{contact.notes || 'Aucune note'}</p>
            )}
          </div>

          {contact.updated_at && (
            <div className="mt-6 pt-6 border-t border-gray-200">
              <p className="text-sm text-gray-500">
                Dernière modification: {formatDate(contact.updated_at)}
              </p>
            </div>
          )}
        </div>
      </motion.div>
    </motion.div>
  );
}
