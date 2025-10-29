import { useState, useEffect } from 'react';
import { X, Shield, Copy, Check, AlertTriangle, Download } from 'lucide-react';
import { initiateMFASetup, verifyAndEnableMFA, getMFAStatus, regenerateBackupCodes, type MFASetupData } from '../../lib/mfa';
import { useToastContext } from '../../contexts/ToastContext';

interface MFASetupModalProps {
  isOpen: boolean;
  onClose: () => void;
  isRequired?: boolean;
}

export function MFASetupModal({ isOpen, onClose, isRequired = false }: MFASetupModalProps) {
  const [step, setStep] = useState<'intro' | 'setup' | 'verify' | 'backup' | 'complete'>('intro');
  const [setupData, setSetupData] = useState<MFASetupData | null>(null);
  const [verificationCode, setVerificationCode] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [copiedSecret, setCopiedSecret] = useState(false);
  const [copiedBackup, setCopiedBackup] = useState(false);
  const [verifyError, setVerifyError] = useState('');
  const { showToast } = useToastContext();

  useEffect(() => {
    if (isOpen) {
      checkMFAStatus();
    }
  }, [isOpen]);

  const checkMFAStatus = async () => {
    const status = await getMFAStatus();
    if (status?.isEnabled && status.isVerified) {
      setStep('complete');
    } else {
      setStep('intro');
    }
  };

  const handleStartSetup = async () => {
    setIsLoading(true);
    try {
      const data = await initiateMFASetup();
      setSetupData(data);
      setStep('setup');
    } catch (error) {
      showToast('error', 'Failed to initiate MFA setup');
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerify = async () => {
    if (!verificationCode || verificationCode.length !== 6) {
      setVerifyError('Please enter a valid 6-digit code');
      return;
    }

    setIsLoading(true);
    setVerifyError('');

    console.log('=== MFA VERIFICATION DEBUG ===');
    console.log('Entered code:', verificationCode);
    console.log('Secret from setup:', setupData?.secret);
    console.log('Current time:', new Date().toISOString());
    console.log('Unix timestamp:', Math.floor(Date.now() / 1000));
    console.log('Counter:', Math.floor(Date.now() / 1000 / 30));

    try {
      const success = await verifyAndEnableMFA(verificationCode);

      if (success) {
        setStep('backup');
        showToast('success', 'MFA enabled successfully!');
      } else {
        setVerifyError('Invalid code. Please try again.');
        console.error('❌ Verification returned false');
      }
    } catch (error) {
      setVerifyError('Verification failed. Please try again.');
      console.error('❌ Verification error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopySecret = () => {
    if (setupData?.secret) {
      navigator.clipboard.writeText(setupData.secret);
      setCopiedSecret(true);
      setTimeout(() => setCopiedSecret(false), 2000);
      showToast('success', 'Secret copied to clipboard');
    }
  };

  const handleCopyBackupCodes = () => {
    if (setupData?.backupCodes) {
      navigator.clipboard.writeText(setupData.backupCodes.join('\n'));
      setCopiedBackup(true);
      setTimeout(() => setCopiedBackup(false), 2000);
      showToast('success', 'Backup codes copied to clipboard');
    }
  };

  const handleDownloadBackupCodes = () => {
    if (setupData?.backupCodes) {
      const content = `ChiroFlow MFA Backup Codes\n\nGenerated: ${new Date().toLocaleString()}\n\n${setupData.backupCodes.join('\n')}\n\nKeep these codes in a safe place. Each code can only be used once.`;
      const blob = new Blob([content], { type: 'text/plain' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'chiroflow-backup-codes.txt';
      a.click();
      URL.revokeObjectURL(url);
      showToast('success', 'Backup codes downloaded');
    }
  };

  const handleComplete = () => {
    setStep('complete');
    if (!isRequired) {
      onClose();
    }
  };

  const handleRegenerateBackupCodes = async () => {
    setIsLoading(true);
    try {
      const newCodes = await regenerateBackupCodes();
      setSetupData(prev => prev ? { ...prev, backupCodes: newCodes } : null);
      showToast('success', 'Backup codes regenerated');
    } catch (error) {
      showToast('error', 'Failed to regenerate backup codes');
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b border-gray-200 p-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-green-100 rounded-lg">
              <Shield className="w-6 h-6 text-green-600" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900">Two-Factor Authentication</h2>
              {isRequired && (
                <p className="text-sm text-red-600 mt-1">Required for security compliance</p>
              )}
            </div>
          </div>
          {!isRequired && step === 'complete' && (
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
              <X className="w-5 h-5" />
            </button>
          )}
        </div>

        <div className="p-6">
          {step === 'intro' && (
            <div className="space-y-6">
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 flex gap-3">
                <AlertTriangle className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
                <div>
                  <h3 className="font-semibold text-yellow-900 mb-1">Security Requirement</h3>
                  <p className="text-sm text-yellow-800">
                    Multi-Factor Authentication (MFA) is {isRequired ? 'required' : 'recommended'} for all administrative users
                    to protect sensitive patient information and comply with healthcare privacy regulations.
                  </p>
                </div>
              </div>

              <div className="space-y-4">
                <h3 className="font-semibold text-gray-900">What is MFA?</h3>
                <p className="text-gray-600">
                  MFA adds an extra layer of security by requiring a time-based code from your phone in addition to your password.
                </p>

                <div className="bg-gray-50 rounded-lg p-4 space-y-3">
                  <h4 className="font-medium text-gray-900">Setup Process:</h4>
                  <ol className="list-decimal list-inside space-y-2 text-gray-600 text-sm">
                    <li>Scan QR code with your authenticator app (Google Authenticator, Authy, etc.)</li>
                    <li>Enter the 6-digit code to verify</li>
                    <li>Save your backup codes in a safe place</li>
                    <li>MFA will be enabled on your account</li>
                  </ol>
                </div>
              </div>

              <button
                onClick={handleStartSetup}
                disabled={isLoading}
                className="w-full bg-green-600 text-white py-3 rounded-lg font-semibold hover:bg-green-700 transition-colors disabled:opacity-50"
              >
                {isLoading ? 'Setting up...' : 'Start Setup'}
              </button>
            </div>
          )}

          {step === 'setup' && setupData && (
            <div className="space-y-6">
              <div className="text-center">
                <h3 className="font-semibold text-gray-900 mb-4">Scan QR Code</h3>
                <div className="bg-white p-4 inline-block rounded-lg border-2 border-gray-200">
                  <img src={setupData.qrCodeUrl} alt="MFA QR Code" className="w-64 h-64" />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Or enter this code manually:
                </label>
                <div className="flex items-center gap-2">
                  <code className="flex-1 bg-gray-100 px-4 py-3 rounded-lg font-mono text-sm break-all">
                    {setupData.secret}
                  </code>
                  <button
                    onClick={handleCopySecret}
                    className="p-3 bg-gray-200 hover:bg-gray-300 rounded-lg transition-colors"
                    title="Copy secret"
                  >
                    {copiedSecret ? <Check className="w-5 h-5 text-green-600" /> : <Copy className="w-5 h-5 text-gray-600" />}
                  </button>
                </div>
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <p className="text-sm text-blue-800">
                  Use an authenticator app like <strong>Google Authenticator</strong>, <strong>Authy</strong>, or{' '}
                  <strong>Microsoft Authenticator</strong> to scan this code.
                </p>
              </div>

              <button
                onClick={() => setStep('verify')}
                className="w-full bg-green-600 text-white py-3 rounded-lg font-semibold hover:bg-green-700 transition-colors"
              >
                I've Scanned the Code
              </button>
            </div>
          )}

          {step === 'verify' && (
            <div className="space-y-6">
              <div>
                <h3 className="font-semibold text-gray-900 mb-2">Verify Your Code</h3>
                <p className="text-gray-600 text-sm mb-4">
                  Enter the 6-digit code from your authenticator app to verify the setup.
                </p>

                <input
                  type="text"
                  inputMode="numeric"
                  maxLength={6}
                  value={verificationCode}
                  onChange={(e) => {
                    setVerificationCode(e.target.value.replace(/\D/g, ''));
                    setVerifyError('');
                  }}
                  placeholder="000000"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg text-center text-2xl font-mono tracking-widest focus:ring-2 focus:ring-green-500 focus:border-transparent"
                />

                {verifyError && (
                  <p className="text-red-600 text-sm mt-2">{verifyError}</p>
                )}
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => setStep('setup')}
                  className="flex-1 px-4 py-3 border border-gray-300 text-gray-700 rounded-lg font-semibold hover:bg-gray-50 transition-colors"
                >
                  Back
                </button>
                <button
                  onClick={handleVerify}
                  disabled={isLoading || verificationCode.length !== 6}
                  className="flex-1 bg-green-600 text-white py-3 rounded-lg font-semibold hover:bg-green-700 transition-colors disabled:opacity-50"
                >
                  {isLoading ? 'Verifying...' : 'Verify & Enable'}
                </button>
              </div>
            </div>
          )}

          {step === 'backup' && setupData && (
            <div className="space-y-6">
              <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex gap-3">
                <AlertTriangle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                <div>
                  <h3 className="font-semibold text-red-900 mb-1">Save Your Backup Codes</h3>
                  <p className="text-sm text-red-800">
                    Store these codes in a safe place. Each code can only be used once if you lose access to your authenticator app.
                  </p>
                </div>
              </div>

              <div>
                <div className="bg-gray-900 rounded-lg p-4">
                  <div className="grid grid-cols-2 gap-2 font-mono text-sm text-white">
                    {setupData.backupCodes.map((code, index) => (
                      <div key={index} className="text-center py-1">
                        {code}
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={handleCopyBackupCodes}
                  className="flex-1 px-4 py-3 border border-gray-300 text-gray-700 rounded-lg font-semibold hover:bg-gray-50 transition-colors flex items-center justify-center gap-2"
                >
                  {copiedBackup ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                  {copiedBackup ? 'Copied!' : 'Copy Codes'}
                </button>
                <button
                  onClick={handleDownloadBackupCodes}
                  className="flex-1 px-4 py-3 border border-gray-300 text-gray-700 rounded-lg font-semibold hover:bg-gray-50 transition-colors flex items-center justify-center gap-2"
                >
                  <Download className="w-4 h-4" />
                  Download
                </button>
              </div>

              <button
                onClick={handleComplete}
                className="w-full bg-green-600 text-white py-3 rounded-lg font-semibold hover:bg-green-700 transition-colors"
              >
                I've Saved My Backup Codes
              </button>
            </div>
          )}

          {step === 'complete' && (
            <div className="text-center space-y-6">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto">
                <Check className="w-8 h-8 text-green-600" />
              </div>

              <div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">MFA Enabled Successfully!</h3>
                <p className="text-gray-600">
                  Your account is now protected with Two-Factor Authentication. You'll need to enter a code from your authenticator app
                  each time you log in.
                </p>
              </div>

              <div className="bg-gray-50 rounded-lg p-4 space-y-3">
                <h4 className="font-medium text-gray-900">Need to regenerate backup codes?</h4>
                <button
                  onClick={handleRegenerateBackupCodes}
                  disabled={isLoading}
                  className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-white transition-colors disabled:opacity-50"
                >
                  {isLoading ? 'Regenerating...' : 'Regenerate Backup Codes'}
                </button>
              </div>

              {!isRequired && (
                <button
                  onClick={onClose}
                  className="w-full bg-green-600 text-white py-3 rounded-lg font-semibold hover:bg-green-700 transition-colors"
                >
                  Close
                </button>
              )}

              {isRequired && (
                <button
                  onClick={() => window.location.reload()}
                  className="w-full bg-green-600 text-white py-3 rounded-lg font-semibold hover:bg-green-700 transition-colors"
                >
                  Continue to Dashboard
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
