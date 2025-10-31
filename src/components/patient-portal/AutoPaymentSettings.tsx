import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  CreditCard,
  Shield,
  DollarSign,
  Bell,
  Check,
  X,
  AlertCircle,
  Info,
  Settings,
} from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { usePaymentMethods } from '../../hooks/usePaymentMethods';
import { useToastContext } from '../../contexts/ToastContext';
import { formatCurrency, getCardBrandIcon } from '../../lib/paymentUtils';

interface AutoPaymentSettingsProps {
  patientId: string;
}

interface PaymentAuthorization {
  id: string;
  patient_id: string;
  payment_method_id: string | null;
  is_enabled: boolean;
  auto_pay_all_appointments: boolean;
  spending_limit_per_charge: number | null;
  spending_limit_monthly: number | null;
  notification_preferences: {
    email_on_charge: boolean;
    email_on_failure: boolean;
    email_receipt: boolean;
  };
  consent_given_at: string | null;
  created_at: string;
  updated_at: string;
}

export default function AutoPaymentSettings({ patientId }: AutoPaymentSettingsProps) {
  const { paymentMethods, loading: methodsLoading } = usePaymentMethods(patientId);
  const toast = useToastContext();

  const [authorization, setAuthorization] = useState<PaymentAuthorization | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showConsent, setShowConsent] = useState(false);

  const [settings, setSettings] = useState({
    isEnabled: false,
    autoPayAll: true,
    paymentMethodId: null as string | null,
    spendingLimitPerCharge: null as number | null,
    spendingLimitMonthly: null as number | null,
    emailOnCharge: true,
    emailOnFailure: true,
    emailReceipt: true,
  });

  useEffect(() => {
    loadAuthorization();
  }, [patientId]);

  async function loadAuthorization() {
    try {
      setLoading(true);

      const { data, error } = await supabase
        .from('payment_authorizations')
        .select('*')
        .eq('patient_id', patientId)
        .maybeSingle();

      if (error && error.code !== 'PGRST116') throw error;

      if (data) {
        setAuthorization(data);
        setSettings({
          isEnabled: data.is_enabled,
          autoPayAll: data.auto_pay_all_appointments,
          paymentMethodId: data.payment_method_id,
          spendingLimitPerCharge: data.spending_limit_per_charge,
          spendingLimitMonthly: data.spending_limit_monthly,
          emailOnCharge: data.notification_preferences?.email_on_charge ?? true,
          emailOnFailure: data.notification_preferences?.email_on_failure ?? true,
          emailReceipt: data.notification_preferences?.email_receipt ?? true,
        });
      }
    } catch (error) {
      console.error('Error loading authorization:', error);
      toast.error('Erreur lors du chargement des paramètres');
    } finally {
      setLoading(false);
    }
  }

  async function handleSave() {
    if (settings.isEnabled && !settings.paymentMethodId) {
      toast.error('Veuillez sélectionner une méthode de paiement');
      return;
    }

    if (settings.isEnabled && !authorization?.consent_given_at) {
      setShowConsent(true);
      return;
    }

    await saveSettings();
  }

  async function handleConsentAndSave() {
    setSaving(true);

    try {
      const payload = {
        patient_id: patientId,
        payment_method_id: settings.paymentMethodId,
        is_enabled: settings.isEnabled,
        auto_pay_all_appointments: settings.autoPayAll,
        spending_limit_per_charge: settings.spendingLimitPerCharge,
        spending_limit_monthly: settings.spendingLimitMonthly,
        notification_preferences: {
          email_on_charge: settings.emailOnCharge,
          email_on_failure: settings.emailOnFailure,
          email_receipt: settings.emailReceipt,
        },
        consent_given_at: new Date().toISOString(),
        consent_ip_address: 'client_ip',
        last_modified_by: (await supabase.auth.getUser()).data.user?.id,
      };

      const { error } = await supabase.from('payment_authorizations').upsert(payload);

      if (error) throw error;

      toast.success('Paramètres de paiement automatique enregistrés');
      setShowConsent(false);
      await loadAuthorization();
    } catch (error) {
      console.error('Error saving authorization:', error);
      toast.error('Erreur lors de l\'enregistrement');
    } finally {
      setSaving(false);
    }
  }

  async function saveSettings() {
    setSaving(true);

    try {
      const payload = {
        patient_id: patientId,
        payment_method_id: settings.paymentMethodId,
        is_enabled: settings.isEnabled,
        auto_pay_all_appointments: settings.autoPayAll,
        spending_limit_per_charge: settings.spendingLimitPerCharge,
        spending_limit_monthly: settings.spendingLimitMonthly,
        notification_preferences: {
          email_on_charge: settings.emailOnCharge,
          email_on_failure: settings.emailOnFailure,
          email_receipt: settings.emailReceipt,
        },
        last_modified_by: (await supabase.auth.getUser()).data.user?.id,
      };

      const { error } = await supabase.from('payment_authorizations').upsert(payload);

      if (error) throw error;

      toast.success('Paramètres mis à jour avec succès');
      await loadAuthorization();
    } catch (error) {
      console.error('Error saving settings:', error);
      toast.error('Erreur lors de l\'enregistrement');
    } finally {
      setSaving(false);
    }
  }

  const primaryPaymentMethod = paymentMethods.find((m) => m.id === settings.paymentMethodId);

  if (loading || methodsLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="w-8 h-8 border-4 border-gold-400 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex items-start gap-3">
          <Info className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
          <div className="text-sm text-blue-800">
            <p className="font-medium mb-1">Paiements automatiques</p>
            <p>
              Activez les paiements automatiques pour que vos rendez-vous soient payés automatiquement
              avec votre méthode de paiement enregistrée. Vous recevrez toujours une confirmation par
              email.
            </p>
          </div>
        </div>
      </div>

      <div className="bg-white border border-neutral-200 rounded-lg p-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gold-100 rounded-full flex items-center justify-center">
              <Shield className="w-5 h-5 text-gold-600" />
            </div>
            <div>
              <h3 className="font-heading text-lg text-foreground">Paiements automatiques</h3>
              <p className="text-sm text-foreground/60">
                {settings.isEnabled ? 'Activés' : 'Désactivés'}
              </p>
            </div>
          </div>

          <button
            onClick={() => setSettings({ ...settings, isEnabled: !settings.isEnabled })}
            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
              settings.isEnabled ? 'bg-gold-500' : 'bg-neutral-300'
            }`}
          >
            <span
              className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                settings.isEnabled ? 'translate-x-6' : 'translate-x-1'
              }`}
            />
          </button>
        </div>

        {settings.isEnabled && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            className="space-y-6"
          >
            {paymentMethods.length === 0 ? (
              <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
                <div className="flex items-start gap-3">
                  <AlertCircle className="w-5 h-5 text-orange-600 flex-shrink-0 mt-0.5" />
                  <div className="text-sm text-orange-800">
                    <p className="font-medium mb-1">Aucune méthode de paiement</p>
                    <p>
                      Vous devez d'abord ajouter une méthode de paiement dans l'onglet "Paiements" avant
                      d'activer les paiements automatiques.
                    </p>
                  </div>
                </div>
              </div>
            ) : (
              <>
                <div>
                  <label className="block text-sm font-medium text-foreground/70 mb-3">
                    Méthode de paiement
                  </label>
                  <div className="space-y-2">
                    {paymentMethods.map((method) => (
                      <button
                        key={method.id}
                        onClick={() => setSettings({ ...settings, paymentMethodId: method.id })}
                        className={`w-full p-4 rounded-lg border-2 transition-all text-left ${
                          settings.paymentMethodId === method.id
                            ? 'border-gold-500 bg-gold-50'
                            : 'border-neutral-200 hover:border-gold-300'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className="text-2xl">{getCardBrandIcon(method.card_brand)}</div>
                            <div>
                              <div className="font-medium text-foreground">
                                {method.card_brand} •••• {method.last_four_digits}
                              </div>
                              <div className="text-sm text-foreground/60">
                                {method.cardholder_name}
                              </div>
                            </div>
                          </div>
                          {settings.paymentMethodId === method.id && (
                            <Check className="w-5 h-5 text-gold-600" />
                          )}
                        </div>
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="flex items-center gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={settings.autoPayAll}
                      onChange={(e) =>
                        setSettings({ ...settings, autoPayAll: e.target.checked })
                      }
                      className="w-4 h-4 text-gold-600 border-neutral-300 rounded focus:ring-gold-500"
                    />
                    <span className="text-sm text-foreground">
                      Payer automatiquement tous les rendez-vous
                    </span>
                  </label>
                </div>

                <div className="border-t border-neutral-200 pt-6">
                  <div className="flex items-center gap-2 mb-4">
                    <DollarSign className="w-5 h-5 text-gold-600" />
                    <h4 className="font-medium text-foreground">Limites de dépenses</h4>
                  </div>

                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-foreground/70 mb-2">
                        Limite par rendez-vous (optionnel)
                      </label>
                      <div className="relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-foreground/60">
                          $
                        </span>
                        <input
                          type="number"
                          value={settings.spendingLimitPerCharge || ''}
                          onChange={(e) =>
                            setSettings({
                              ...settings,
                              spendingLimitPerCharge: e.target.value
                                ? parseFloat(e.target.value)
                                : null,
                            })
                          }
                          placeholder="Aucune limite"
                          className="w-full pl-8 pr-4 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-gold-500 focus:border-gold-500"
                        />
                      </div>
                      <p className="text-xs text-foreground/50 mt-1">
                        Les frais supérieurs nécessiteront votre approbation
                      </p>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-foreground/70 mb-2">
                        Limite mensuelle (optionnel)
                      </label>
                      <div className="relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-foreground/60">
                          $
                        </span>
                        <input
                          type="number"
                          value={settings.spendingLimitMonthly || ''}
                          onChange={(e) =>
                            setSettings({
                              ...settings,
                              spendingLimitMonthly: e.target.value
                                ? parseFloat(e.target.value)
                                : null,
                            })
                          }
                          placeholder="Aucune limite"
                          className="w-full pl-8 pr-4 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-gold-500 focus:border-gold-500"
                        />
                      </div>
                      <p className="text-xs text-foreground/50 mt-1">
                        Total maximum pouvant être débité par mois
                      </p>
                    </div>
                  </div>
                </div>

                <div className="border-t border-neutral-200 pt-6">
                  <div className="flex items-center gap-2 mb-4">
                    <Bell className="w-5 h-5 text-gold-600" />
                    <h4 className="font-medium text-foreground">Notifications</h4>
                  </div>

                  <div className="space-y-3">
                    <label className="flex items-center gap-3 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={settings.emailOnCharge}
                        onChange={(e) =>
                          setSettings({ ...settings, emailOnCharge: e.target.checked })
                        }
                        className="w-4 h-4 text-gold-600 border-neutral-300 rounded focus:ring-gold-500"
                      />
                      <span className="text-sm text-foreground">
                        M'envoyer un email lors de chaque paiement
                      </span>
                    </label>

                    <label className="flex items-center gap-3 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={settings.emailOnFailure}
                        onChange={(e) =>
                          setSettings({ ...settings, emailOnFailure: e.target.checked })
                        }
                        className="w-4 h-4 text-gold-600 border-neutral-300 rounded focus:ring-gold-500"
                      />
                      <span className="text-sm text-foreground">
                        M'alerter si un paiement échoue
                      </span>
                    </label>

                    <label className="flex items-center gap-3 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={settings.emailReceipt}
                        onChange={(e) =>
                          setSettings({ ...settings, emailReceipt: e.target.checked })
                        }
                        className="w-4 h-4 text-gold-600 border-neutral-300 rounded focus:ring-gold-500"
                      />
                      <span className="text-sm text-foreground">Recevoir les reçus par email</span>
                    </label>
                  </div>
                </div>
              </>
            )}
          </motion.div>
        )}

        <div className="flex gap-3 mt-6 pt-6 border-t border-neutral-200">
          <button
            onClick={handleSave}
            disabled={saving || (settings.isEnabled && !settings.paymentMethodId)}
            className="flex-1 px-6 py-3 bg-gradient-to-r from-gold-500 to-gold-600 text-white hover:from-gold-600 hover:to-gold-700 transition-all shadow-soft hover:shadow-gold rounded-lg font-medium disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {saving ? 'Enregistrement...' : 'Enregistrer les paramètres'}
          </button>
        </div>
      </div>

      {showConsent && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-xl shadow-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto"
          >
            <div className="p-6 border-b border-neutral-200">
              <h3 className="text-xl font-heading text-foreground">Autorisation de paiement automatique</h3>
            </div>

            <div className="p-6 space-y-4">
              <p className="text-foreground/80">
                En activant les paiements automatiques, vous autorisez la clinique à débiter
                automatiquement votre méthode de paiement enregistrée pour les rendez-vous confirmés.
              </p>

              <div className="bg-neutral-50 border border-neutral-200 rounded-lg p-4 space-y-2 text-sm">
                <p className="font-medium text-foreground">Vous acceptez que:</p>
                <ul className="list-disc list-inside space-y-1 text-foreground/70">
                  <li>Les paiements seront automatiquement traités après chaque rendez-vous</li>
                  <li>Vous recevrez une notification par email pour chaque transaction</li>
                  <li>Vous pouvez désactiver cette fonctionnalité à tout moment</li>
                  <li>Les limites de dépenses que vous avez définies seront respectées</li>
                  <li>Les informations de paiement sont stockées de manière sécurisée</li>
                </ul>
              </div>

              {primaryPaymentMethod && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <p className="text-sm font-medium text-blue-900 mb-2">Méthode de paiement:</p>
                  <div className="flex items-center gap-2 text-sm text-blue-800">
                    <span className="text-lg">{getCardBrandIcon(primaryPaymentMethod.card_brand)}</span>
                    <span>
                      {primaryPaymentMethod.card_brand} •••• {primaryPaymentMethod.last_four_digits}
                    </span>
                  </div>
                </div>
              )}
            </div>

            <div className="flex gap-3 p-6 border-t border-neutral-200">
              <button
                onClick={() => setShowConsent(false)}
                disabled={saving}
                className="flex-1 px-4 py-3 border border-neutral-300 text-foreground hover:bg-neutral-50 rounded-lg transition-colors disabled:opacity-50"
              >
                Annuler
              </button>
              <button
                onClick={handleConsentAndSave}
                disabled={saving}
                className="flex-1 px-4 py-3 bg-gradient-to-r from-gold-500 to-gold-600 text-white hover:from-gold-600 hover:to-gold-700 rounded-lg transition-all shadow-soft hover:shadow-gold font-medium disabled:opacity-50"
              >
                {saving ? 'Enregistrement...' : 'J\'accepte et j\'active'}
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}
