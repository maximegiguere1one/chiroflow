import { motion } from 'framer-motion';
import { Lock, Mail } from 'lucide-react';
import { useState } from 'react';
import { supabase } from '../lib/supabase';
import { OrganizationService } from '../lib/saas/organizationService';
import { router } from '../lib/router';
import { ValidationInput } from '../components/common/ValidationInput';
import { emailValidation } from '../lib/validations';

interface AdminLoginProps {
  onLogin: () => void;
}

export default function AdminLogin({ onLogin }: AdminLoginProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
      });

      if (error) throw error;

      if (data.user) {
        const org = await OrganizationService.getCurrentOrganization();

        if (!org) {
          router.navigate('/onboarding', false);
        } else {
          onLogin();
        }
      }
    } catch (err: any) {
      if (err.message?.includes('Invalid login credentials')) {
        setError('Email ou mot de passe incorrect. Vérifiez vos identifiants et réessayez.');
      } else if (err.message?.includes('Email not confirmed')) {
        setError('Veuillez confirmer votre email avant de vous connecter.');
      } else {
        setError(err.message || 'Impossible de se connecter. Vérifiez votre connexion internet.');
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-neutral-50 via-background to-gold-50/20 flex items-center justify-center px-6">
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8 }}
        className="w-full max-w-md"
      >
        <div className="bg-white/80 backdrop-blur-xl border border-neutral-200/50 shadow-premium p-10">
          {/* Logo / Header */}
          <div className="text-center mb-10">
            <motion.div
              initial={{ scale: 0.8 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.2, duration: 0.5 }}
              className="w-16 h-16 bg-gradient-to-br from-gold-400 to-gold-600 rounded-2xl mx-auto mb-4 flex items-center justify-center shadow-gold"
            >
              <Lock className="w-8 h-8 text-white" />
            </motion.div>
            <h1 className="font-heading text-3xl tracking-tight text-foreground mb-2">
              ChiroFlow AI
            </h1>
            <p className="text-sm text-foreground/60 font-light">
              Accès administrateur sécurisé
            </p>
          </div>

          {/* Login Form */}
          <form onSubmit={handleLogin} className="space-y-6">
            {error && (
              <motion.div
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm"
              >
                {error}
              </motion.div>
            )}

            <ValidationInput
              label="Email professionnel"
              hint="utilisé pour la connexion"
              placeholder="dr.tremblay@clinique.com"
              type="email"
              value={email}
              onChange={setEmail}
              validation={emailValidation}
              icon={<Mail className="w-5 h-5" />}
              required
            />

            <div>
              <label className="block text-sm font-medium text-foreground/70 mb-2">
                Mot de passe
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-foreground/40" />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-11 pr-4 py-3 bg-white/50 border border-neutral-300 focus:border-gold-400 focus:outline-none focus:ring-2 focus:ring-gold-200 transition-all rounded-lg"
                  placeholder="Entrez votre mot de passe"
                  required
                />
              </div>
            </div>

            <div className="flex items-center justify-between text-sm">
              <div className="flex items-center gap-2">
                <div className="w-5 h-5 rounded bg-green-100 border-2 border-green-500 flex items-center justify-center">
                  <svg className="w-3 h-3 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <span className="text-foreground/60 font-light">
                  Session persistante activée
                </span>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-4 bg-gradient-to-r from-gold-500 to-gold-600 hover:from-gold-600 hover:to-gold-700 text-white font-light tracking-wide disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 shadow-soft hover:shadow-gold"
            >
              {loading ? (
                <div className="flex items-center justify-center gap-2">
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Vérification de vos identifiants...</span>
                </div>
              ) : (
                'Se connecter à ma clinique'
              )}
            </button>
          </form>

          <div className="mt-8 pt-6 border-t border-neutral-200/50 text-center space-y-3">
            <a
              href="/admin/signup"
              className="text-sm text-gold-600 hover:text-gold-700 transition-colors font-light"
            >
              Créer un compte administrateur
            </a>
            <p className="text-xs text-foreground/40 font-light">
              Accès réservé aux administrateurs autorisés
            </p>
          </div>
        </div>

        <motion.a
          href="/"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="block text-center mt-6 text-sm text-foreground/60 hover:text-foreground transition-colors"
        >
          ← Retour au site
        </motion.a>
      </motion.div>
    </div>
  );
}
