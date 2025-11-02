import { useState } from 'react';
import { motion } from 'framer-motion';
import {
  CheckCircle, XCircle, AlertCircle, RefreshCw, Mail,
  MessageSquare, Shield, Server, Play, CheckCheck
} from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useToastContext } from '../../contexts/ToastContext';
import { designSystem } from '../../lib/designSystem10X';

interface SecretCheck {
  name: string;
  exists: boolean;
  valid: boolean;
  issue?: string;
  recommendation?: string;
}

interface TestResult {
  success: boolean;
  message: string;
  details?: any;
}

export function SecretsTester() {
  const [checking, setChecking] = useState(false);
  const [testingEmail, setTestingEmail] = useState(false);
  const [testingSMS, setTestingSMS] = useState(false);
  const [emailAddress, setEmailAddress] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [secretsStatus, setSecretsStatus] = useState<any>(null);
  const [emailResult, setEmailResult] = useState<TestResult | null>(null);
  const [smsResult, setSmsResult] = useState<TestResult | null>(null);
  const toast = useToastContext();

  async function checkSecrets() {
    setChecking(true);
    try {
      const { data, error } = await supabase.functions.invoke('check-secrets');

      if (error) throw error;

      setSecretsStatus(data);

      if (data.status === 'ready') {
        toast.success('✅ Tous les secrets sont configurés correctement!');
      } else if (data.status === 'warning') {
        toast.info('⚠️ Configuration fonctionnelle mais avec avertissements');
      } else {
        toast.error('❌ Erreurs critiques dans la configuration');
      }
    } catch (error) {
      console.error('Error checking secrets:', error);
      toast.error('Erreur lors de la vérification');
    } finally {
      setChecking(false);
    }
  }

  async function testEmail() {
    if (!emailAddress) {
      toast.error('Entrez une adresse email');
      return;
    }

    setTestingEmail(true);
    setEmailResult(null);

    try {
      const { data, error } = await supabase.functions.invoke('test-email', {
        body: {
          to: emailAddress,
          subject: 'Test ChiroFlow - Configuration Email'
        }
      });

      if (error) throw error;

      setEmailResult({
        success: true,
        message: 'Email envoyé avec succès!',
        details: data
      });
      toast.success('✅ Email envoyé! Vérifiez votre boîte.');
    } catch (error: any) {
      setEmailResult({
        success: false,
        message: error.message || 'Erreur lors de l\'envoi',
        details: error
      });
      toast.error('❌ Échec de l\'envoi d\'email');
    } finally {
      setTestingEmail(false);
    }
  }

  async function testSMS() {
    if (!phoneNumber) {
      toast.error('Entrez un numéro de téléphone');
      return;
    }

    setTestingSMS(true);
    setSmsResult(null);

    try {
      const { data, error } = await supabase.functions.invoke('send-sms-reminder', {
        body: {
          to: phoneNumber,
          message: 'Test ChiroFlow - Configuration SMS fonctionnelle!'
        }
      });

      if (error) throw error;

      setSmsResult({
        success: true,
        message: 'SMS envoyé avec succès!',
        details: data
      });
      toast.success('✅ SMS envoyé! Vérifiez votre téléphone.');
    } catch (error: any) {
      setSmsResult({
        success: false,
        message: error.message || 'Erreur lors de l\'envoi',
        details: error
      });
      toast.error('❌ Échec de l\'envoi de SMS');
    } finally {
      setTestingSMS(false);
    }
  }

  const getStatusIcon = (check: SecretCheck) => {
    if (!check.exists) return <XCircle className="w-5 h-5 text-red-500" />;
    if (!check.valid) return <AlertCircle className="w-5 h-5 text-orange-500" />;
    return <CheckCircle className="w-5 h-5 text-green-500" />;
  };

  return (
    <div className="space-y-6">

      {/* Header */}
      <div className={designSystem.components.pageHeader.container}>
        <div className={designSystem.components.pageHeader.left}>
          <div className={designSystem.components.pageHeader.indicator}>
            <Shield className="w-4 h-4 text-blue-500" />
            <span className={designSystem.components.pageHeader.subtitle}>
              Configuration
            </span>
          </div>
          <h2 className={designSystem.typography.h3}>
            Test des Secrets
          </h2>
        </div>
      </div>

      {/* Check Secrets Button */}
      <button
        onClick={checkSecrets}
        disabled={checking}
        className={designSystem.components.button.primary + ' w-full'}
      >
        {checking ? (
          <>
            <RefreshCw className="w-5 h-5 animate-spin" />
            Vérification...
          </>
        ) : (
          <>
            <Shield className="w-5 h-5" />
            Vérifier tous les secrets
          </>
        )}
      </button>

      {/* Secrets Status */}
      {secretsStatus && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className={designSystem.components.card.base}
        >
          {/* Summary */}
          <div className="mb-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className={designSystem.typography.h5}>État Global</h3>
              <div className={`
                ${designSystem.components.badge.base}
                ${secretsStatus.status === 'ready' ? designSystem.components.badge.success :
                  secretsStatus.status === 'warning' ? designSystem.components.badge.warning :
                  designSystem.components.badge.danger}
              `}>
                {secretsStatus.status === 'ready' && '✅ Prêt'}
                {secretsStatus.status === 'warning' && '⚠️ Avertissements'}
                {secretsStatus.status === 'critical' && '❌ Erreurs critiques'}
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div className={designSystem.components.infoBlock.base + ' ' + designSystem.components.infoBlock.neutral}>
                <div className="text-2xl font-bold text-foreground">{secretsStatus.summary.secrets_configured}</div>
                <div className="text-sm text-foreground/60">Configurés</div>
              </div>
              <div className={designSystem.components.infoBlock.base + ' ' + designSystem.components.infoBlock.success}>
                <div className="text-2xl font-bold text-green-600">{secretsStatus.summary.secrets_valid}</div>
                <div className="text-sm text-green-600/80">Valides</div>
              </div>
              <div className={designSystem.components.infoBlock.base + ' ' + designSystem.components.infoBlock.warning}>
                <div className="text-2xl font-bold text-orange-600">{secretsStatus.summary.critical_errors}</div>
                <div className="text-sm text-orange-600/80">Erreurs</div>
              </div>
            </div>
          </div>

          {/* Secrets List */}
          <div className="space-y-3">
            <h4 className={designSystem.typography.label}>Secrets Individuels</h4>
            {secretsStatus.secrets.map((check: SecretCheck) => (
              <div
                key={check.name}
                className="flex items-start gap-3 p-3 bg-neutral-50 rounded-lg"
              >
                {getStatusIcon(check)}
                <div className="flex-1">
                  <div className="font-medium text-foreground">{check.name}</div>
                  {check.issue && (
                    <div className="text-sm text-orange-600 mt-1">{check.issue}</div>
                  )}
                  {check.recommendation && (
                    <div className="text-sm text-foreground/60 mt-1">{check.recommendation}</div>
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* Domain Verification */}
          {secretsStatus.domain_verification?.status && (
            <div className="mt-6 pt-6 border-t border-neutral-200">
              <h4 className={designSystem.typography.label + ' mb-3'}>Vérification Domaine</h4>
              <div className={`
                ${designSystem.components.infoBlock.base}
                ${secretsStatus.domain_verification.status === 'verified'
                  ? designSystem.components.infoBlock.success
                  : designSystem.components.infoBlock.warning}
              `}>
                <div className="flex items-center gap-2 mb-2">
                  {secretsStatus.domain_verification.status === 'verified' ? (
                    <CheckCheck className="w-4 h-4 text-green-600" />
                  ) : (
                    <AlertCircle className="w-4 h-4 text-orange-600" />
                  )}
                  <span className="font-medium">
                    {secretsStatus.domain_verification.status}
                  </span>
                </div>
                {secretsStatus.domain_verification.details && (
                  <pre className="text-xs text-foreground/60 mt-2 overflow-x-auto">
                    {JSON.stringify(secretsStatus.domain_verification.details, null, 2)}
                  </pre>
                )}
              </div>
            </div>
          )}

          {/* Action Items */}
          {secretsStatus.action_items && secretsStatus.action_items.length > 0 && (
            <div className="mt-6 pt-6 border-t border-neutral-200">
              <h4 className={designSystem.typography.label + ' mb-3'}>Actions Requises</h4>
              <ul className="space-y-2">
                {secretsStatus.action_items.map((item: string, index: number) => (
                  <li key={index} className="text-sm text-foreground/80 flex items-start gap-2">
                    <span className="text-orange-500 mt-0.5">•</span>
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </motion.div>
      )}

      {/* Test Email */}
      <div className={designSystem.components.card.base}>
        <div className="flex items-center gap-2 mb-4">
          <Mail className="w-5 h-5 text-blue-500" />
          <h3 className={designSystem.typography.h5}>Test Email</h3>
        </div>

        <div className="space-y-3">
          <input
            type="email"
            value={emailAddress}
            onChange={(e) => setEmailAddress(e.target.value)}
            placeholder="votre@email.com"
            className="w-full px-4 py-3 border-2 border-neutral-200 rounded-xl focus:border-blue-500 focus:outline-none"
          />

          <button
            onClick={testEmail}
            disabled={testingEmail || !emailAddress}
            className={designSystem.components.button.primary + ' w-full'}
          >
            {testingEmail ? (
              <>
                <RefreshCw className="w-5 h-5 animate-spin" />
                Envoi...
              </>
            ) : (
              <>
                <Play className="w-5 h-5" />
                Envoyer email de test
              </>
            )}
          </button>

          {emailResult && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className={`
                ${designSystem.components.infoBlock.base}
                ${emailResult.success
                  ? designSystem.components.infoBlock.success
                  : designSystem.components.infoBlock.warning}
              `}
            >
              <div className="flex items-center gap-2">
                {emailResult.success ? (
                  <CheckCircle className="w-4 h-4 text-green-600" />
                ) : (
                  <XCircle className="w-4 h-4 text-red-600" />
                )}
                <span className="font-medium">{emailResult.message}</span>
              </div>
            </motion.div>
          )}
        </div>
      </div>

      {/* Test SMS */}
      <div className={designSystem.components.card.base}>
        <div className="flex items-center gap-2 mb-4">
          <MessageSquare className="w-5 h-5 text-green-500" />
          <h3 className={designSystem.typography.h5}>Test SMS</h3>
        </div>

        <div className="space-y-3">
          <input
            type="tel"
            value={phoneNumber}
            onChange={(e) => setPhoneNumber(e.target.value)}
            placeholder="+15551234567"
            className="w-full px-4 py-3 border-2 border-neutral-200 rounded-xl focus:border-blue-500 focus:outline-none"
          />

          <button
            onClick={testSMS}
            disabled={testingSMS || !phoneNumber}
            className={designSystem.components.button.success + ' w-full'}
          >
            {testingSMS ? (
              <>
                <RefreshCw className="w-5 h-5 animate-spin" />
                Envoi...
              </>
            ) : (
              <>
                <Play className="w-5 h-5" />
                Envoyer SMS de test
              </>
            )}
          </button>

          {smsResult && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className={`
                ${designSystem.components.infoBlock.base}
                ${smsResult.success
                  ? designSystem.components.infoBlock.success
                  : designSystem.components.infoBlock.warning}
              `}
            >
              <div className="flex items-center gap-2">
                {smsResult.success ? (
                  <CheckCircle className="w-4 h-4 text-green-600" />
                ) : (
                  <XCircle className="w-4 h-4 text-red-600" />
                )}
                <span className="font-medium">{smsResult.message}</span>
              </div>
            </motion.div>
          )}
        </div>
      </div>

    </div>
  );
}
