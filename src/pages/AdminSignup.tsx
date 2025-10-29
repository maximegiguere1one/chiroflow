import { motion } from 'framer-motion';
import { UserPlus } from 'lucide-react';
import { useState } from 'react';
import { supabase } from '../lib/supabase';

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
      setError('Code d\'invitation invalide');
      setLoading(false);
      return;
    }

    if (!email || !password || !fullName) {
      setError('Tous les champs sont requis');
      setLoading(false);
      return;
    }

    if (password.length < 6) {
      setError('Le mot de passe doit contenir au moins 6 caractères');
      setLoading(false);
      return;
    }

    try {
      // Créer l'utilisateur avec Supabase Auth
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: fullName
          }
        }
      });

      if (authError) throw authError;

      if (authData.user) {
        // Créer le profil dans la table profiles
        const { error: profileError } = await supabase
          .from('profiles')
          .insert({
            id: authData.user.id,
            email,
            full_name: fullName,
            role: 'admin'
          });

        if (profileError && profileError.code !== '23505') {
          console.error('Profile error:', profileError);
        }

        // Créer les settings de la clinique
        const { error: settingsError } = await supabase
          .from('clinic_settings')
          .insert({
            owner_id: authData.user.id,
            clinic_name: 'Clinique Dre Janie Leblanc',
            email: 'dre.janie@example.com',
            phone: '418-XXX-XXXX'
          });

        if (settingsError && settingsError.code !== '23505') {
          console.error('Settings error:', settingsError);
        }

        setSuccess(true);
      }
    } catch (err: any) {
      setError(err.message || 'Erreur lors de la création du compte');
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
              <div className="bg-gold-50 border border-gold-200 p-4 rounded-lg text-sm text-foreground/70">
                Code d'invitation requis pour créer un compte administrateur.
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground/70 mb-2">
                  Nom complet <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  required
                  className="w-full px-4 py-3 bg-white/50 border border-neutral-300 focus:border-gold-400 focus:outline-none focus:ring-2 focus:ring-gold-200 transition-all"
                  placeholder="Dr. Janie Leblanc"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground/70 mb-2">
                  Email <span className="text-red-500">*</span>
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="w-full px-4 py-3 bg-white/50 border border-neutral-300 focus:border-gold-400 focus:outline-none focus:ring-2 focus:ring-gold-200 transition-all"
                  placeholder="votre@email.com"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground/70 mb-2">
                  Mot de passe <span className="text-red-500">*</span>
                </label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  minLength={6}
                  className="w-full px-4 py-3 bg-white/50 border border-neutral-300 focus:border-gold-400 focus:outline-none focus:ring-2 focus:ring-gold-200 transition-all"
                  placeholder="Minimum 6 caractères"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground/70 mb-2">
                  Code d'invitation <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={inviteCode}
                  onChange={(e) => setInviteCode(e.target.value)}
                  required
                  className="w-full px-4 py-3 bg-white/50 border border-neutral-300 focus:border-gold-400 focus:outline-none focus:ring-2 focus:ring-gold-200 transition-all"
                  placeholder="Code fourni par l'administrateur"
                />
              </div>

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
                    <span>Création en cours...</span>
                  </div>
                ) : (
                  'Créer le compte admin'
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
                <h2 className="text-2xl font-heading text-foreground mb-2">Compte créé!</h2>
                <p className="text-foreground/60 font-light">
                  Votre compte administrateur a été créé avec succès.
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
                className="block w-full py-4 bg-foreground text-background hover:bg-foreground/90 transition-all duration-300 text-center font-light tracking-wide"
              >
                Se connecter maintenant
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
