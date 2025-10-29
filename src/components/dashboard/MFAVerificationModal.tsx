import { useState } from 'react';
import { Shield, AlertTriangle } from 'lucide-react';
import { verifyMFAToken } from '../../lib/mfa';
import { useToastContext } from '../../contexts/ToastContext';

interface MFAVerificationModalProps {
  isOpen: boolean;
  onVerified: () => void;
  onCancel: () => void;
}

export function MFAVerificationModal({ isOpen, onVerified, onCancel }: MFAVerificationModalProps) {
  const [code, setCode] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [attemptsRemaining, setAttemptsRemaining] = useState<number | null>(null);
  const { showToast } = useToastContext();

  const handleVerify = async () => {
    if (!code || code.length !== 6) {
      setError('Please enter a valid 6-digit code');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      const success = await verifyMFAToken(code);

      if (success) {
        showToast('success', 'Verification successful!');
        onVerified();
      } else {
        setError('Invalid code. Please try again.');
        setCode('');
      }
    } catch (error: any) {
      if (error.message.includes('Too many failed attempts')) {
        setError(error.message);
      } else {
        setError('Verification failed. Please try again.');
      }
      setCode('');
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && code.length === 6) {
      handleVerify();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl max-w-md w-full">
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-green-100 rounded-lg">
              <Shield className="w-6 h-6 text-green-600" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900">Two-Factor Authentication</h2>
              <p className="text-sm text-gray-600 mt-1">Enter your verification code</p>
            </div>
          </div>
        </div>

        <div className="p-6 space-y-6">
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <p className="text-sm text-blue-800">
              Open your authenticator app and enter the 6-digit code to continue.
            </p>
          </div>

          <div>
            <input
              type="text"
              inputMode="numeric"
              maxLength={6}
              value={code}
              onChange={(e) => {
                setCode(e.target.value.replace(/\D/g, ''));
                setError('');
              }}
              onKeyPress={handleKeyPress}
              placeholder="000000"
              autoFocus
              className="w-full px-4 py-3 border border-gray-300 rounded-lg text-center text-2xl font-mono tracking-widest focus:ring-2 focus:ring-green-500 focus:border-transparent"
            />

            {error && (
              <div className="mt-3 bg-red-50 border border-red-200 rounded-lg p-3 flex gap-2">
                <AlertTriangle className="w-4 h-4 text-red-600 flex-shrink-0 mt-0.5" />
                <p className="text-sm text-red-800">{error}</p>
              </div>
            )}
          </div>

          <div className="space-y-3">
            <button
              onClick={handleVerify}
              disabled={isLoading || code.length !== 6}
              className="w-full bg-green-600 text-white py-3 rounded-lg font-semibold hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? 'Verifying...' : 'Verify Code'}
            </button>

            <button
              onClick={onCancel}
              disabled={isLoading}
              className="w-full px-4 py-3 border border-gray-300 text-gray-700 rounded-lg font-semibold hover:bg-gray-50 transition-colors disabled:opacity-50"
            >
              Cancel
            </button>
          </div>

          <div className="text-center">
            <p className="text-sm text-gray-600">
              Lost access to your authenticator?{' '}
              <button className="text-green-600 hover:text-green-700 font-medium">
                Use backup code
              </button>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
