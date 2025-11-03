import { useState } from 'react';
import { Mail, MessageSquare, Send, CheckCircle, XCircle, AlertTriangle } from 'lucide-react';
import { supabase } from '../../lib/supabase';

export function EmailSMSTester() {
  const [testing, setTesting] = useState(false);
  const [results, setResults] = useState<any>(null);

  const runTests = async () => {
    setTesting(true);
    setResults(null);

    const testResults = {
      timestamp: new Date().toISOString(),
      tests: [] as any[]
    };

    try {
      const { data: { user } } = await supabase.auth.getUser();

      testResults.tests.push({
        name: 'Authentification',
        status: user ? 'success' : 'error',
        message: user ? `Connecté: ${user.email}` : 'Non authentifié',
        user: user
      });

      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
      testResults.tests.push({
        name: 'URL Supabase',
        status: supabaseUrl ? 'success' : 'error',
        message: supabaseUrl || 'Non configurée'
      });

      const { data: { session } } = await supabase.auth.getSession();
      testResults.tests.push({
        name: 'Session',
        status: session ? 'success' : 'error',
        message: session ? 'Session active' : 'Pas de session'
      });

      try {
        const checkResponse = await fetch(`${supabaseUrl}/functions/v1/check-secrets`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${session?.access_token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({})
        });

        if (checkResponse.ok) {
          const secretsData = await checkResponse.json();
          testResults.tests.push({
            name: 'Secrets Supabase',
            status: secretsData.resend_configured ? 'success' : 'warning',
            message: `RESEND_API_KEY: ${secretsData.resend_configured ? 'Configuré' : 'Manquant'}`,
            details: secretsData
          });
        } else {
          testResults.tests.push({
            name: 'Secrets Supabase',
            status: 'error',
            message: `Erreur ${checkResponse.status}`
          });
        }
      } catch (error) {
        testResults.tests.push({
          name: 'Secrets Supabase',
          status: 'error',
          message: 'Erreur lors de la vérification',
          error: error instanceof Error ? error.message : String(error)
        });
      }

      try {
        const testEmailResponse = await fetch(`${supabaseUrl}/functions/v1/send-custom-email`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${session?.access_token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            to: user?.email || 'test@example.com',
            subject: 'Test Email depuis ChiroFlow',
            message: 'Ceci est un email de test automatique.',
            patient_name: 'Test Patient'
          })
        });

        const responseText = await testEmailResponse.text();
        let emailData;
        try {
          emailData = JSON.parse(responseText);
        } catch {
          emailData = { raw: responseText };
        }

        testResults.tests.push({
          name: 'Envoi Email Test',
          status: testEmailResponse.ok ? 'success' : 'error',
          message: testEmailResponse.ok ? 'Email envoyé avec succès!' : `Erreur ${testEmailResponse.status}`,
          details: emailData
        });
      } catch (error) {
        testResults.tests.push({
          name: 'Envoi Email Test',
          status: 'error',
          message: 'Erreur lors de l\'envoi',
          error: error instanceof Error ? error.message : String(error)
        });
      }

      const { data: trackingData, error: trackingError } = await supabase
        .from('email_tracking')
        .select('*')
        .order('sent_at', { ascending: false })
        .limit(5);

      testResults.tests.push({
        name: 'Table email_tracking',
        status: trackingError ? 'error' : 'success',
        message: trackingError ? trackingError.message : `${trackingData?.length || 0} emails récents trouvés`,
        data: trackingData
      });

    } catch (error) {
      testResults.tests.push({
        name: 'Erreur Générale',
        status: 'error',
        message: error instanceof Error ? error.message : String(error)
      });
    }

    setResults(testResults);
    setTesting(false);
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'success':
        return <CheckCircle className="w-5 h-5 text-green-600" />;
      case 'warning':
        return <AlertTriangle className="w-5 h-5 text-yellow-600" />;
      case 'error':
        return <XCircle className="w-5 h-5 text-red-600" />;
      default:
        return null;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'success':
        return 'bg-green-50 border-green-200';
      case 'warning':
        return 'bg-yellow-50 border-yellow-200';
      case 'error':
        return 'bg-red-50 border-red-200';
      default:
        return 'bg-gray-50 border-gray-200';
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Test Emails & SMS</h2>
        <p className="text-gray-600">Diagnostiquer les problèmes d'envoi de messages</p>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <button
          onClick={runTests}
          disabled={testing}
          className="w-full py-4 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold transition-all flex items-center justify-center gap-2 disabled:opacity-50"
        >
          <Send className={`w-5 h-5 ${testing ? 'animate-pulse' : ''}`} />
          {testing ? 'Tests en cours...' : 'Lancer les tests'}
        </button>
      </div>

      {results && (
        <div className="space-y-4">
          {results.tests.map((test: any, index: number) => (
            <div
              key={index}
              className={`rounded-xl border-2 p-6 ${getStatusColor(test.status)}`}
            >
              <div className="flex items-start gap-4">
                <div className="flex-shrink-0 mt-1">
                  {getStatusIcon(test.status)}
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-bold text-gray-900 text-lg mb-2">{test.name}</h3>
                  <p className="text-gray-700 mb-3">{test.message}</p>

                  {test.details && (
                    <details className="mt-3">
                      <summary className="cursor-pointer font-semibold text-sm text-gray-600 hover:text-gray-900">
                        Voir les détails
                      </summary>
                      <pre className="mt-2 p-4 bg-white rounded-lg text-xs overflow-auto max-h-64 border border-gray-300">
                        {JSON.stringify(test.details, null, 2)}
                      </pre>
                    </details>
                  )}

                  {test.error && (
                    <div className="mt-3 p-3 bg-red-100 border border-red-300 rounded-lg">
                      <p className="text-sm font-mono text-red-900">{test.error}</p>
                    </div>
                  )}

                  {test.data && (
                    <details className="mt-3">
                      <summary className="cursor-pointer font-semibold text-sm text-gray-600 hover:text-gray-900">
                        Voir les données
                      </summary>
                      <pre className="mt-2 p-4 bg-white rounded-lg text-xs overflow-auto max-h-64 border border-gray-300">
                        {JSON.stringify(test.data, null, 2)}
                      </pre>
                    </details>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {results && (
        <div className="bg-blue-50 border-2 border-blue-200 rounded-xl p-6">
          <h3 className="font-bold text-blue-900 mb-3">Prochaines étapes</h3>
          <ul className="space-y-2 text-sm text-blue-800">
            <li>✓ Si tous les tests sont verts, les emails devraient fonctionner</li>
            <li>⚠️ Si "RESEND_API_KEY" est manquant, configure-le dans Supabase Dashboard → Project Settings → Edge Functions → Secrets</li>
            <li>⚠️ Si l'envoi échoue, vérifie les logs dans Supabase Dashboard → Edge Functions → send-custom-email → Logs</li>
            <li>📧 Vérifie tes spams si l'email est envoyé mais non reçu</li>
            <li>🔑 Assure-toi d'avoir vérifié ton domaine dans Resend Dashboard</li>
          </ul>
        </div>
      )}
    </div>
  );
}
