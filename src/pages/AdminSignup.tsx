import { motion } from 'framer-motion';
import { UserPlus, Mail, Lock, User, Key } from 'lucide-react';
import { useState } from 'react';
import { supabase } from '../lib/supabase';
import { ValidationInput } from '../components/common/ValidationInput';
import { emailValidation, passwordValidation, inviteCodeValidation } from '../lib/validations';

export default function AdminSignup() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [inviteCode, setInviteCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  const VALID_INVITE_CODE = import.meta.env.VITE_ADMIN_INVITE_CODE || 'CHIRO2024';

  async function handleSignup(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError('');

    if (inviteCode !== VALID_INVITE_CODE) {
      setError('Ce code d\'invitation n\'est pas valide. Vérifiez avec votre administrateur ou demandez un nouveau code.');
      setLoading(false);
      return;
    }

    if (!email || !password || !fullName) {
      setError('Veuillez remplir tous les champs obligatoires pour créer votre compte.');
      setLoading(false);
      return;
    }

    if (password.length < 8) {
      setError(`Mot de passe trop court : ${8 - password.length} caractères manquants (minimum 8)`);
      setLoading(false);
      return;
    }

    try {
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
      const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

      const response = await fetch(`${supabaseUrl}/functions/v1/create-admin-user`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${supabaseAnonKey}`,
        },
        body: JSON.stringify({
          email,
          password,
          full_name: fullName,
          invite_code: inviteCode,
        }),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        const errorMsg = data.error?.includes('already')
          ? 'Un compte existe déjà avec cet email. Connectez-vous ou utilisez une autre adresse.'
          : data.error || 'Impossible de créer le compte. Vérifiez les informations et réessayez.';
        throw new Error(errorMsg);
      }

      setSuccess(true);
    } catch (err: any) {
      setError(err.message || 'Une erreur s\'est produite. Vérifiez votre connexion et réessayez.');
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
          <div className="text-center mb-10">
            <motion.div
              initial={{ scale: 0.8 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.2, duration: 0.5 }}
              className="w-16 h-16 bg-gradient-to-br from-gold-400 to-gold-600 rounded-2xl mx-auto mb-4 flex items-center justify-center shadow-gold"
            >
              <UserPlus className="w-8 h-8 text-white" />
            </motion.div>
            <h1 className="font-heading text-3xl tracking-tight text-foreground mb-2">
              Création Compte Admin
            </h1>
            <p className="text-sm text-foreground/60 font-light">
              ChiroFlow AI
            </p>
          </div>

          {!success ? (
            <form onSubmit={handleSignup} className="space-y-6">
              <div className="bg-blue-50 border border-blue-200 p-4 rounded-lg text-sm text-blue-900">
                🔒 Code d'invitation requis pour créer un compte administrateur. Contactez votre administrateur si vous n'avez pas de code.
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground/70 mb-2">
                  Nom complet <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-foreground/40" />
                  <input
                    type="text"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    required
                    className="w-full pl-11 pr-4 py-3 bg-white/50 border border-neutral-300 focus:border-gold-400 focus:outline-none focus:ring-2 focus:ring-gold-200 transition-all rounded-lg"
                    placeholder="Dr. Marie Tremblay"
                  />
                </div>
              </div>

              <ValidationInput
                label="Email professionnel"
                hint="utilisé pour connexion et notifications"
                placeholder="dr.tremblay@clinique.com"
                type="email"
                value={email}
                onChange={setEmail}
                validation={emailValidation}
                icon={<Mail className="w-5 h-5" />}
                required
              />

              <ValidationInput
                label="Mot de passe sécurisé"
                hint="min. 8 caractères, 1 majuscule, 1 chiffre"
                placeholder="Créez un mot de passe fort"
                type="password"
                value={password}
                onChange={setPassword}
                validation={passwordValidation}
                icon={<Lock className="w-5 h-5" />}
                required
              />

              <ValidationInput
                label="Code d'invitation"
                hint="code de 6 lettres fourni par votre admin"
                placeholder="CHIRO2024"
                type="text"
                value={inviteCode}
                onChange={setInviteCode}
                validation={inviteCodeValidation}
                icon={<Key className="w-5 h-5" />}
                required
              />

              {error && (
                <motion.div
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm"
                >
                  {error}
                </motion.div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full py-4 bg-gradient-to-r from-gold-500 to-gold-600 hover:from-gold-600 hover:to-gold-700 text-white font-light tracking-wide disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 shadow-soft hover:shadow-gold"
              >
                {loading ? (
                  <div className="flex items-center justify-center gap-2">
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    <span>Configuration de votre clinique...</span>
                  </div>
                ) : (
                  'Créer mon compte administrateur'
                )}
              </button>

              <div className="text-center">
                <a
                  href="/admin"
                  className="text-sm text-foreground/60 hover:text-foreground transition-colors"
                >
                  Retour à la connexion
                </a>
              </div>
            </form>
          ) : (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="text-center space-y-6"
            >
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto">
                <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>

              <div>
                <h2 className="text-2xl font-heading text-foreground mb-2">🎉 Bienvenue dans ChiroFlow!</h2>
                <p className="text-foreground/60 font-light">
                  Votre compte administrateur est prêt. Vous pouvez maintenant vous connecter et commencer à gérer votre clinique.
                </p>
              </div>

              <div className="bg-gold-50 border border-gold-200 p-4 rounded-lg text-left">
                <div className="text-sm">
                  <span className="text-foreground/60">Email: </span>
                  <span className="font-medium text-foreground">{email}</span>
                </div>
                <p className="text-xs text-foreground/50 mt-2">
                  Conservez ces informations en lieu sûr.
                </p>
              </div>

              <a
                href="/admin"
                className="block w-full py-4 bg-gradient-to-r from-gold-500 to-gold-600 hover:from-gold-600 hover:to-gold-700 text-white hover:text-white transition-all duration-300 text-center font-medium tracking-wide rounded-lg shadow-soft hover:shadow-gold"
              >
                Se connecter à ma clinique
              </a>
            </motion.div>
          )}
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
