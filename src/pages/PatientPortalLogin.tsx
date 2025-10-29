import { useState } from 'react';
import { motion } from 'framer-motion';
import { Mail, Lock, ArrowRight, Shield, Loader2 } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { env } from '../lib/env';

interface PatientPortalLoginProps {
  onLogin: () => void;
}

export default function PatientPortalLogin({ onLogin }: PatientPortalLoginProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [mode, setMode] = useState<'login' | 'magic-link'>('login');
  const [magicLinkSent, setMagicLinkSent] = useState(false);

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const { data, error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (signInError) throw signInError;

      if (data.user && data.session) {
        // Appeler la fonction de synchronisation
        try {
          const syncResponse = await fetch(
            `${env.supabaseUrl}/functions/v1/sync-patient-portal-user`,
            {
              method: 'POST',
              headers: {
                'Authorization': `Bearer ${data.session.access_token}`,
                'Content-Type': 'application/json',
              },
            }
          );

          const syncResult = await syncResponse.json();

          if (!syncResult.success) {
            if (syncResult.needsRegistration) {
              throw new Error('Aucun dossier patient trouvé. Veuillez contacter votre clinique.');
            }
            // Si erreur de sync, on continue quand même (fallback par email)
            console.warn('Avertissement lors de la synchronisation:', syncResult.error);
          }
        } catch (syncError) {
          console.warn('Erreur lors de la synchronisation:', syncError);
          // On continue quand même, le fallback par email prendra le relais
        }

        onLogin();
      }
    } catch (err: any) {
      setError(err.message || 'Erreur de connexion');
    } finally {
      setLoading(false);
    }
  }

  async function handleMagicLink(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const { error: magicLinkError } = await supabase.auth.signInWithOtp({
        email,
        options: {
          emailRedirectTo: window.location.origin + '/patient-portal',
        },
      });

      if (magicLinkError) throw magicLinkError;

      setMagicLinkSent(true);
    } catch (err: any) {
      setError(err.message || 'Erreur lors de l\'envoi du lien magique');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-neutral-50 via-background to-neutral-50 flex items-center justify-center p-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md"
      >
        <div className="bg-white border border-neutral-200 shadow-lifted p-8">
          <div className="text-center mb-8">
            <div className="w-16 h-16 bg-gradient-to-br from-gold-400 to-gold-600 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-gold">
              <Shield className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-2xl font-heading text-foreground mb-2">Portail Patient</h1>
            <p className="text-foreground/60 text-sm">
              Accédez à vos rendez-vous et paiements de manière sécurisée
            </p>
          </div>

          {magicLinkSent ? (
            <div className="text-center py-8">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Mail className="w-8 h-8 text-green-600" />
              </div>
              <h3 className="text-lg font-medium text-foreground mb-2">
                Vérifiez votre courriel
              </h3>
              <p className="text-foreground/60 text-sm mb-6">
                Nous avons envoyé un lien de connexion magique à <strong>{email}</strong>
              </p>
              <button
                onClick={() => {
                  setMagicLinkSent(false);
                  setEmail('');
                }}
                className="text-gold-600 hover:text-gold-700 text-sm font-medium"
              >
                Retour à la connexion
              </button>
            </div>
          ) : (
            <>
              <div className="flex gap-2 mb-6">
                <button
                  onClick={() => setMode('login')}
                  className={`flex-1 py-2 px-4 text-sm font-medium transition-all ${
                    mode === 'login'
                      ? 'bg-gradient-to-r from-gold-500 to-gold-600 text-white shadow-gold'
                      : 'bg-neutral-100 text-foreground/70 hover:bg-neutral-200'
                  }`}
                >
                  Mot de passe
                </button>
                <button
                  onClick={() => setMode('magic-link')}
                  className={`flex-1 py-2 px-4 text-sm font-medium transition-all ${
                    mode === 'magic-link'
                      ? 'bg-gradient-to-r from-gold-500 to-gold-600 text-white shadow-gold'
                      : 'bg-neutral-100 text-foreground/70 hover:bg-neutral-200'
                  }`}
                >
                  Lien magique
                </button>
              </div>

              {error && (
                <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
                  <p className="text-sm text-red-700">{error}</p>
                </div>
              )}

              {mode === 'login' ? (
                <form onSubmit={handleLogin} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-foreground/70 mb-2">
                      Courriel
                    </label>
                    <div className="relative">
                      <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-foreground/40" />
                      <input
                        type="email"
                        required
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="w-full pl-12 pr-4 py-3 border border-neutral-300 focus:border-gold-400 focus:outline-none focus:ring-2 focus:ring-gold-200 transition-all"
                        placeholder="votre@email.com"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-foreground/70 mb-2">
                      Mot de passe
                    </label>
                    <div className="relative">
                      <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-foreground/40" />
                      <input
                        type="password"
                        required
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="w-full pl-12 pr-4 py-3 border border-neutral-300 focus:border-gold-400 focus:outline-none focus:ring-2 focus:ring-gold-200 transition-all"
                        placeholder="••••••••"
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full py-3 bg-gradient-to-r from-gold-500 to-gold-600 text-white hover:from-gold-600 hover:to-gold-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 shadow-soft hover:shadow-gold flex items-center justify-center gap-2"
                  >
                    {loading ? (
                      <>
                        <Loader2 className="w-5 h-5 animate-spin" />
                        Connexion...
                      </>
                    ) : (
                      <>
                        Se connecter
                        <ArrowRight className="w-5 h-5" />
                      </>
                    )}
                  </button>
                </form>
              ) : (
                <form onSubmit={handleMagicLink} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-foreground/70 mb-2">
                      Courriel
                    </label>
                    <div className="relative">
                      <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-foreground/40" />
                      <input
                        type="email"
                        required
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="w-full pl-12 pr-4 py-3 border border-neutral-300 focus:border-gold-400 focus:outline-none focus:ring-2 focus:ring-gold-200 transition-all"
                        placeholder="votre@email.com"
                      />
                    </div>
                    <p className="mt-2 text-xs text-foreground/60">
                      Nous vous enverrons un lien sécurisé pour vous connecter sans mot de passe
                    </p>
                  </div>

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full py-3 bg-gradient-to-r from-gold-500 to-gold-600 text-white hover:from-gold-600 hover:to-gold-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 shadow-soft hover:shadow-gold flex items-center justify-center gap-2"
                  >
                    {loading ? (
                      <>
                        <Loader2 className="w-5 h-5 animate-spin" />
                        Envoi...
                      </>
                    ) : (
                      <>
                        Envoyer le lien magique
                        <ArrowRight className="w-5 h-5" />
                      </>
                    )}
                  </button>
                </form>
              )}

              <div className="mt-6 pt-6 border-t border-neutral-200">
                <p className="text-center text-sm text-foreground/60">
                  Pas encore de compte ?{' '}
                  <a href="#" className="text-gold-600 hover:text-gold-700 font-medium">
                    Contactez votre clinique
                  </a>
                </p>
              </div>
            </>
          )}
        </div>

        <div className="mt-6 text-center">
          <a
            href="/"
            className="text-sm text-foreground/60 hover:text-foreground transition-colors"
          >
            ← Retour à l'accueil
          </a>
        </div>
      </motion.div>
    </div>
  );
}
