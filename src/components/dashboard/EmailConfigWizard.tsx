import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle, AlertCircle, XCircle, RefreshCw, ExternalLink, Mail, Shield, Settings, Loader } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useToastContext } from '../../contexts/ToastContext';

interface SecretCheck {
  name: string;
  exists: boolean;
  valid: boolean;
  issue?: string;
  recommendation?: string;
}

interface DomainVerification {
  status: string | null;
  details: any;
}

interface ConfigStatus {
  status: 'ready' | 'warning' | 'critical' | 'loading';
  timestamp: string;
  summary: {
    critical_errors: number;
    warnings: number;
    secrets_configured: number;
    secrets_valid: number;
    secrets_total: number;
  };
  secrets: SecretCheck[];
  domain_verification: DomainVerification;
  action_items: string[];
  next_steps: string[];
}

export default function EmailConfigWizard() {
  const [configStatus, setConfigStatus] = useState<ConfigStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState(true);
  const toast = useToastContext();

  useEffect(() => {
    checkConfiguration();
  }, []);

  async function checkConfiguration() {
    try {
      setLoading(true);
      const functionUrl = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/check-secrets`;

      const response = await fetch(functionUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
        },
      });

      const data = await response.json();
      setConfigStatus(data);
      setLoading(false);
    } catch (error: any) {
      console.error('Error checking configuration:', error);
      toast.error('Erreur lors de la vérification de la configuration');
      setLoading(false);
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'ready':
        return <CheckCircle className="w-6 h-6 text-green-500" />;
      case 'warning':
        return <AlertCircle className="w-6 h-6 text-yellow-500" />;
      case 'critical':
        return <XCircle className="w-6 h-6 text-red-500" />;
      default:
        return <Loader className="w-6 h-6 text-gray-400 animate-spin" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'ready':
        return 'bg-green-50 border-green-200';
      case 'warning':
        return 'bg-yellow-50 border-yellow-200';
      case 'critical':
        return 'bg-red-50 border-red-200';
      default:
        return 'bg-gray-50 border-gray-200';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'ready':
        return 'Configuration Complète';
      case 'warning':
        return 'Configuration Partielle';
      case 'critical':
        return 'Configuration Requise';
      default:
        return 'Vérification...';
    }
  };

  if (loading) {
    return (
      <div className="bg-white rounded-xl shadow-md p-6">
        <div className="flex items-center justify-center space-x-3">
          <Loader className="w-5 h-5 animate-spin text-blue-500" />
          <span className="text-gray-600">Vérification de la configuration email...</span>
        </div>
      </div>
    );
  }

  if (!configStatus) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      className={`rounded-xl border-2 ${getStatusColor(configStatus.status)} overflow-hidden mb-6`}
    >
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full px-6 py-4 flex items-center justify-between hover:bg-opacity-50 transition-colors"
      >
        <div className="flex items-center space-x-4">
          {getStatusIcon(configStatus.status)}
          <div className="text-left">
            <h3 className="font-semibold text-lg text-gray-900">{getStatusText(configStatus.status)}</h3>
            <p className="text-sm text-gray-600">
              {configStatus.summary.secrets_valid}/{configStatus.summary.secrets_total} secrets configurés
              {configStatus.summary.critical_errors > 0 && (
                <span className="text-red-600 font-medium ml-2">
                  {configStatus.summary.critical_errors} erreur(s) critique(s)
                </span>
              )}
            </p>
          </div>
        </div>
        <div className="flex items-center space-x-3">
          <div
            onClick={(e) => {
              e.stopPropagation();
              checkConfiguration();
            }}
            className="p-2 hover:bg-white rounded-lg transition-colors cursor-pointer"
            title="Rafraîchir"
          >
            <RefreshCw className="w-4 h-4 text-gray-600" />
          </div>
          <motion.div
            animate={{ rotate: expanded ? 180 : 0 }}
            transition={{ duration: 0.2 }}
            className="text-gray-400"
          >
            ▼
          </motion.div>
        </div>
      </button>

      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="border-t border-gray-200"
          >
            <div className="p-6 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {configStatus.secrets.map((secret) => (
                  <div
                    key={secret.name}
                    className={`p-4 rounded-lg border ${
                      secret.valid
                        ? 'bg-green-50 border-green-200'
                        : secret.exists
                        ? 'bg-yellow-50 border-yellow-200'
                        : 'bg-red-50 border-red-200'
                    }`}
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex items-center space-x-2">
                        {secret.valid ? (
                          <CheckCircle className="w-4 h-4 text-green-500 flex-shrink-0" />
                        ) : secret.exists ? (
                          <AlertCircle className="w-4 h-4 text-yellow-500 flex-shrink-0" />
                        ) : (
                          <XCircle className="w-4 h-4 text-red-500 flex-shrink-0" />
                        )}
                        <span className="font-medium text-sm text-gray-900">{secret.name}</span>
                      </div>
                    </div>
                    {secret.issue && (
                      <p className="text-xs text-gray-600 mb-2">{secret.issue}</p>
                    )}
                    {secret.recommendation && (
                      <p className="text-xs text-gray-700 bg-white bg-opacity-50 p-2 rounded">
                        {secret.recommendation}
                      </p>
                    )}
                  </div>
                ))}
              </div>

              {configStatus.domain_verification.status && (
                <div
                  className={`p-4 rounded-lg border ${
                    configStatus.domain_verification.status === 'verified'
                      ? 'bg-green-50 border-green-200'
                      : 'bg-red-50 border-red-200'
                  }`}
                >
                  <div className="flex items-start space-x-3">
                    {configStatus.domain_verification.status === 'verified' ? (
                      <Shield className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                    ) : (
                      <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
                    )}
                    <div className="flex-1">
                      <h4 className="font-semibold text-gray-900 mb-1">
                        {configStatus.domain_verification.status === 'verified'
                          ? 'Domaine Vérifié'
                          : 'Vérification du Domaine Requise'}
                      </h4>
                      {configStatus.domain_verification.details && (
                        <div className="text-sm text-gray-700">
                          {configStatus.domain_verification.details.error ? (
                            <p className="text-red-700">{configStatus.domain_verification.details.error}</p>
                          ) : (
                            <div>
                              <p>Domaine: {configStatus.domain_verification.details.name}</p>
                              <p>Statut: {configStatus.domain_verification.details.status}</p>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {configStatus.action_items.length > 0 && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <div className="flex items-start space-x-3">
                    <Settings className="w-5 h-5 text-blue-500 flex-shrink-0 mt-0.5" />
                    <div className="flex-1">
                      <h4 className="font-semibold text-gray-900 mb-2">Actions Requises</h4>
                      <ol className="space-y-1 text-sm text-gray-700">
                        {configStatus.action_items.map((item, index) => (
                          <li key={index} className="leading-relaxed">
                            {item}
                          </li>
                        ))}
                      </ol>
                    </div>
                  </div>
                </div>
              )}

              <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                <div className="flex items-start space-x-3">
                  <Mail className="w-5 h-5 text-gray-500 flex-shrink-0 mt-0.5" />
                  <div className="flex-1">
                    <h4 className="font-semibold text-gray-900 mb-2">Prochaines Étapes</h4>
                    <ul className="space-y-1 text-sm text-gray-700">
                      {configStatus.next_steps.map((step, index) => (
                        <li key={index} className="leading-relaxed">
                          {step}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>

              <div className="flex flex-wrap gap-3 pt-4 border-t border-gray-200">
                <a
                  href="https://resend.com/api-keys"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center space-x-2 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
                >
                  <span>Resend API Keys</span>
                  <ExternalLink className="w-4 h-4" />
                </a>
                <a
                  href="https://resend.com/domains"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center space-x-2 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
                >
                  <span>Resend Domains</span>
                  <ExternalLink className="w-4 h-4" />
                </a>
                <a
                  href={`${import.meta.env.VITE_SUPABASE_URL?.replace('https://', 'https://supabase.com/dashboard/project/')}/settings/functions`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center space-x-2 px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors"
                >
                  <span>Supabase Secrets</span>
                  <ExternalLink className="w-4 h-4" />
                </a>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
