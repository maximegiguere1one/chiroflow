import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  Phone, Search, ShoppingCart, Check, AlertCircle, RefreshCw,
  MapPin, DollarSign, Settings, ExternalLink, Copy, CheckCheck
} from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useToastContext } from '../../contexts/ToastContext';

interface AvailableNumber {
  phoneNumber: string;
  friendlyName: string;
  locality: string;
  region: string;
  postalCode: string;
  isoCountry: string;
  capabilities: {
    voice: boolean;
    SMS: boolean;
    MMS: boolean;
  };
}

interface TwilioConfig {
  account_sid: string;
  auth_token: string;
  phone_number: string;
  app_sid: string;
}

export function TwilioPhoneSetup() {
  const toast = useToastContext();
  const [loading, setLoading] = useState(false);
  const [searching, setSearching] = useState(false);
  const [availableNumbers, setAvailableNumbers] = useState<AvailableNumber[]>([]);
  const [currentConfig, setCurrentConfig] = useState<TwilioConfig | null>(null);
  const [showApiConfig, setShowApiConfig] = useState(false);

  const [searchParams, setSearchParams] = useState({
    areaCode: '',
    contains: '',
    country: 'CA'
  });

  const [manualConfig, setManualConfig] = useState({
    account_sid: '',
    auth_token: '',
    phone_number: ''
  });

  useEffect(() => {
    loadCurrentConfig();
  }, []);

  const loadCurrentConfig = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from('clinic_settings')
        .select('twilio_account_sid, twilio_auth_token, twilio_phone_number, twilio_app_sid')
        .eq('owner_id', user.id)
        .maybeSingle();

      if (error) throw error;

      if (data?.twilio_account_sid) {
        setCurrentConfig({
          account_sid: data.twilio_account_sid,
          auth_token: data.twilio_auth_token,
          phone_number: data.twilio_phone_number,
          app_sid: data.twilio_app_sid
        });
      }
    } catch (error) {
      console.error('Error loading Twilio config:', error);
    }
  };

  const searchNumbers = async () => {
    if (!manualConfig.account_sid || !manualConfig.auth_token) {
      toast.error('Configurez d\'abord vos identifiants Twilio API');
      setShowApiConfig(true);
      return;
    }

    try {
      setSearching(true);
      const { data, error } = await supabase.functions.invoke('search-twilio-numbers', {
        body: {
          account_sid: manualConfig.account_sid,
          auth_token: manualConfig.auth_token,
          areaCode: searchParams.areaCode,
          contains: searchParams.contains,
          country: searchParams.country
        }
      });

      if (error) throw error;
      setAvailableNumbers(data.numbers || []);

      if (data.numbers?.length === 0) {
        toast.info('Aucun numéro trouvé avec ces critères');
      }
    } catch (error: any) {
      console.error('Error searching numbers:', error);
      toast.error('Erreur lors de la recherche: ' + (error.message || 'Vérifiez vos identifiants'));
    } finally {
      setSearching(false);
    }
  };

  const purchaseNumber = async (phoneNumber: string) => {
    if (!manualConfig.account_sid || !manualConfig.auth_token) {
      toast.error('Configuration Twilio manquante');
      return;
    }

    try {
      setLoading(true);

      const { data, error } = await supabase.functions.invoke('purchase-twilio-number', {
        body: {
          account_sid: manualConfig.account_sid,
          auth_token: manualConfig.auth_token,
          phone_number: phoneNumber
        }
      });

      if (error) throw error;

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Non authentifié');

      const { error: updateError } = await supabase
        .from('clinic_settings')
        .upsert({
          owner_id: user.id,
          twilio_account_sid: manualConfig.account_sid,
          twilio_auth_token: manualConfig.auth_token,
          twilio_phone_number: phoneNumber
        });

      if (updateError) throw updateError;

      await configureWebhook(phoneNumber);

      toast.success('Numéro acheté et configuré avec succès!');
      setCurrentConfig({
        account_sid: manualConfig.account_sid,
        auth_token: manualConfig.auth_token,
        phone_number: phoneNumber,
        app_sid: ''
      });
      setAvailableNumbers([]);
    } catch (error: any) {
      console.error('Error purchasing number:', error);
      toast.error('Erreur lors de l\'achat: ' + (error.message || 'Réessayez'));
    } finally {
      setLoading(false);
    }
  };

  const configureWebhook = async (phoneNumber: string) => {
    try {
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
      const webhookUrl = `${supabaseUrl}/functions/v1/receive-sms-twilio`;

      const { error } = await supabase.functions.invoke('configure-twilio-webhook', {
        body: {
          account_sid: manualConfig.account_sid,
          auth_token: manualConfig.auth_token,
          phone_number: phoneNumber,
          webhook_url: webhookUrl
        }
      });

      if (error) throw error;
      toast.success('Webhook configuré automatiquement!');
    } catch (error: any) {
      console.error('Error configuring webhook:', error);
      toast.warning('Numéro acheté mais webhook non configuré. Configurez-le manuellement.');
    }
  };

  const saveManualConfig = async () => {
    if (!manualConfig.account_sid || !manualConfig.auth_token) {
      toast.error('Tous les champs sont requis');
      return;
    }

    try {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Non authentifié');

      const { error } = await supabase
        .from('clinic_settings')
        .upsert({
          owner_id: user.id,
          twilio_account_sid: manualConfig.account_sid,
          twilio_auth_token: manualConfig.auth_token,
          twilio_phone_number: manualConfig.phone_number || null
        });

      if (error) throw error;

      toast.success('Configuration Twilio sauvegardée!');
      await loadCurrentConfig();
      setShowApiConfig(false);
    } catch (error: any) {
      console.error('Error saving config:', error);
      toast.error('Erreur lors de la sauvegarde');
    } finally {
      setLoading(false);
    }
  };

  const copyWebhookUrl = () => {
    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
    const webhookUrl = `${supabaseUrl}/functions/v1/receive-sms-twilio`;
    navigator.clipboard.writeText(webhookUrl);
    toast.success('URL du webhook copiée!');
  };

  const formatPhoneNumber = (phone: string) => {
    const cleaned = phone.replace(/\D/g, '');
    if (cleaned.length === 11 && cleaned.startsWith('1')) {
      return `+1 (${cleaned.slice(1, 4)}) ${cleaned.slice(4, 7)}-${cleaned.slice(7)}`;
    }
    return phone;
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Configuration Téléphonie</h2>
          <p className="text-gray-600 mt-1">Achetez et configurez votre numéro Twilio pour SMS</p>
        </div>
        <button
          onClick={() => window.open('https://www.twilio.com/console', '_blank')}
          className="flex items-center gap-2 px-4 py-2 text-sm text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded-lg transition-colors"
        >
          <ExternalLink className="w-4 h-4" />
          Console Twilio
        </button>
      </div>

      {currentConfig?.phone_number ? (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-gradient-to-br from-green-50 to-emerald-50 border border-green-200 rounded-xl p-6"
        >
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 bg-green-500 rounded-full flex items-center justify-center flex-shrink-0">
              <CheckCheck className="w-6 h-6 text-white" />
            </div>
            <div className="flex-1">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Numéro Actif
              </h3>
              <p className="text-2xl font-bold text-green-600 mb-4">
                {formatPhoneNumber(currentConfig.phone_number)}
              </p>
              <div className="space-y-2 text-sm text-gray-600">
                <div className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-green-500" />
                  SMS entrants configurés
                </div>
                <div className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-green-500" />
                  SMS sortants activés
                </div>
              </div>
              <button
                onClick={() => setShowApiConfig(true)}
                className="mt-4 text-sm text-blue-600 hover:text-blue-700 font-medium"
              >
                Modifier la configuration →
              </button>
            </div>
          </div>
        </motion.div>
      ) : (
        <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-6">
          <div className="flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
            <div>
              <h3 className="font-semibold text-gray-900 mb-1">
                Aucun numéro configuré
              </h3>
              <p className="text-sm text-gray-600">
                Configurez vos identifiants Twilio pour acheter un numéro
              </p>
            </div>
          </div>
        </div>
      )}

      {!showApiConfig && !currentConfig?.phone_number && (
        <button
          onClick={() => setShowApiConfig(true)}
          className="w-full py-3 px-4 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors"
        >
          Commencer la configuration
        </button>
      )}

      {showApiConfig && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          className="bg-white border border-gray-200 rounded-xl p-6 space-y-6"
        >
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Identifiants Twilio API
            </h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Account SID
                </label>
                <input
                  type="text"
                  value={manualConfig.account_sid}
                  onChange={(e) => setManualConfig({ ...manualConfig, account_sid: e.target.value })}
                  placeholder="ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Auth Token
                </label>
                <input
                  type="password"
                  value={manualConfig.auth_token}
                  onChange={(e) => setManualConfig({ ...manualConfig, auth_token: e.target.value })}
                  placeholder="********************************"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              <button
                onClick={saveManualConfig}
                disabled={loading}
                className="w-full py-2 px-4 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors disabled:opacity-50"
              >
                {loading ? 'Sauvegarde...' : 'Sauvegarder les identifiants'}
              </button>
            </div>
          </div>

          {manualConfig.account_sid && manualConfig.auth_token && (
            <>
              <div className="border-t border-gray-200 pt-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                  Rechercher un numéro
                </h3>
                <div className="grid grid-cols-3 gap-4 mb-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Code régional
                    </label>
                    <input
                      type="text"
                      value={searchParams.areaCode}
                      onChange={(e) => setSearchParams({ ...searchParams, areaCode: e.target.value })}
                      placeholder="418, 514, 581..."
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Contient
                    </label>
                    <input
                      type="text"
                      value={searchParams.contains}
                      onChange={(e) => setSearchParams({ ...searchParams, contains: e.target.value })}
                      placeholder="1234"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Pays
                    </label>
                    <select
                      value={searchParams.country}
                      onChange={(e) => setSearchParams({ ...searchParams, country: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    >
                      <option value="CA">Canada</option>
                      <option value="US">États-Unis</option>
                    </select>
                  </div>
                </div>
                <button
                  onClick={searchNumbers}
                  disabled={searching}
                  className="w-full py-2 px-4 bg-gray-900 hover:bg-gray-800 text-white rounded-lg font-medium transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {searching ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      Recherche en cours...
                    </>
                  ) : (
                    <>
                      <Search className="w-4 h-4" />
                      Rechercher des numéros
                    </>
                  )}
                </button>
              </div>

              {availableNumbers.length > 0 && (
                <div className="border-t border-gray-200 pt-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">
                    Numéros disponibles ({availableNumbers.length})
                  </h3>
                  <div className="space-y-3 max-h-96 overflow-y-auto">
                    {availableNumbers.map((number) => (
                      <div
                        key={number.phoneNumber}
                        className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                      >
                        <div className="flex-1">
                          <div className="font-semibold text-gray-900 mb-1">
                            {formatPhoneNumber(number.phoneNumber)}
                          </div>
                          <div className="flex items-center gap-4 text-sm text-gray-600">
                            <span className="flex items-center gap-1">
                              <MapPin className="w-3 h-3" />
                              {number.locality}, {number.region}
                            </span>
                            <span className="flex items-center gap-1">
                              <Phone className="w-3 h-3" />
                              {number.capabilities.SMS && 'SMS'} {number.capabilities.MMS && '+ MMS'}
                            </span>
                          </div>
                        </div>
                        <button
                          onClick={() => purchaseNumber(number.phoneNumber)}
                          disabled={loading}
                          className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium transition-colors disabled:opacity-50 flex items-center gap-2"
                        >
                          <ShoppingCart className="w-4 h-4" />
                          Acheter (~$1/mois)
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}
        </motion.div>
      )}

      <div className="bg-blue-50 border border-blue-200 rounded-xl p-6">
        <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
          <Settings className="w-5 h-5 text-blue-600" />
          URL du Webhook (pour configuration manuelle)
        </h3>
        <div className="flex items-center gap-2">
          <code className="flex-1 px-4 py-2 bg-white border border-gray-300 rounded-lg text-sm font-mono text-gray-700">
            {import.meta.env.VITE_SUPABASE_URL}/functions/v1/receive-sms-twilio
          </code>
          <button
            onClick={copyWebhookUrl}
            className="p-2 hover:bg-blue-100 rounded-lg transition-colors"
          >
            <Copy className="w-5 h-5 text-blue-600" />
          </button>
        </div>
        <p className="text-sm text-gray-600 mt-3">
          Configurez cette URL dans Twilio Console → Phone Numbers → Messaging → Webhook URL for SMS
        </p>
      </div>
    </div>
  );
}
