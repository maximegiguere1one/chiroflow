/**
 * 📝 EXEMPLES D'IMPLÉMENTATION - MICROCOPY AMÉLIORÉ
 *
 * Ce fichier contient des exemples concrets d'amélioration du microcopy
 * Copier/coller et adapter selon vos besoins
 */

// ============================================================================
// 1. COMPOSANTS RÉUTILISABLES
// ============================================================================

// ✅ ValidationInput - Input avec validation inline
interface ValidationInputProps {
  label: string;
  hint?: string;
  placeholder?: string;
  type?: string;
  value: string;
  onChange: (value: string) => void;
  validation?: (value: string) => { valid: boolean; message: string };
  error?: string;
  required?: boolean;
}

export const ValidationInput: React.FC<ValidationInputProps> = ({
  label,
  hint,
  placeholder,
  type = 'text',
  value,
  onChange,
  validation,
  error,
  required
}) => {
  const [touched, setTouched] = useState(false);
  const [validationState, setValidationState] = useState<{
    valid: boolean;
    message: string;
  } | null>(null);

  useEffect(() => {
    if (validation && touched && value) {
      setValidationState(validation(value));
    }
  }, [value, touched, validation]);

  return (
    <div className="form-field">
      <label className="block text-sm font-medium text-foreground/70 mb-2">
        {label}
        {required && <span className="text-red-500 ml-1">*</span>}
        {hint && (
          <span className="text-xs text-foreground/50 ml-2 font-normal">
            {hint}
          </span>
        )}
      </label>

      <div className="relative">
        <input
          type={type}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onBlur={() => setTouched(true)}
          placeholder={placeholder}
          className={`
            w-full px-4 py-3 bg-white/50 border rounded-lg
            focus:outline-none focus:ring-2 transition-all
            ${error || (validationState && !validationState.valid)
              ? 'border-red-300 focus:border-red-400 focus:ring-red-200'
              : validationState?.valid
              ? 'border-green-300 focus:border-green-400 focus:ring-green-200'
              : 'border-neutral-300 focus:border-gold-400 focus:ring-gold-200'
            }
          `}
        />

        {/* Success Icon */}
        {validationState?.valid && (
          <div className="absolute right-3 top-1/2 -translate-y-1/2">
            <CheckCircle className="w-5 h-5 text-green-500" />
          </div>
        )}
      </div>

      {/* Validation Feedback */}
      {touched && validationState && (
        <motion.div
          initial={{ opacity: 0, y: -5 }}
          animate={{ opacity: 1, y: 0 }}
          className={`
            mt-2 text-sm flex items-start gap-2
            ${validationState.valid ? 'text-green-600' : 'text-amber-600'}
          `}
        >
          {validationState.valid ? (
            <CheckCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
          ) : (
            <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
          )}
          <span>{validationState.message}</span>
        </motion.div>
      )}

      {/* Error Message */}
      {error && (
        <motion.div
          initial={{ opacity: 0, y: -5 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-2 text-sm text-red-600 flex items-start gap-2"
        >
          <XCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
          <span>{error}</span>
        </motion.div>
      )}
    </div>
  );
};

// ============================================================================
// 2. ENHANCED TOAST SYSTEM
// ============================================================================

interface ToastOptions {
  title: string;
  message?: string;
  solution?: string;
  action?: {
    label: string;
    onClick: () => void;
  };
  duration?: number;
}

export const enhancedToast = {
  error: ({ title, message, solution, action, duration = 6000 }: ToastOptions) => {
    return (
      <div className="bg-white rounded-lg shadow-lg border-l-4 border-red-500 p-4 max-w-md">
        <div className="flex items-start gap-3">
          <div className="flex-shrink-0">
            <XCircle className="w-6 h-6 text-red-500" />
          </div>

          <div className="flex-1">
            <h4 className="font-semibold text-foreground mb-1">{title}</h4>
            {message && (
              <p className="text-sm text-foreground/70 mb-2">{message}</p>
            )}
            {solution && (
              <p className="text-sm text-foreground/60 mb-3">
                💡 {solution}
              </p>
            )}
            {action && (
              <button
                onClick={action.onClick}
                className="text-sm text-red-600 hover:text-red-700 font-medium"
              >
                {action.label} →
              </button>
            )}
          </div>
        </div>
      </div>
    );
  },

  success: ({ title, message, action, duration = 4000 }: ToastOptions) => {
    return (
      <div className="bg-white rounded-lg shadow-lg border-l-4 border-green-500 p-4 max-w-md">
        <div className="flex items-start gap-3">
          <div className="flex-shrink-0">
            <CheckCircle className="w-6 h-6 text-green-500" />
          </div>

          <div className="flex-1">
            <h4 className="font-semibold text-foreground mb-1">✓ {title}</h4>
            {message && (
              <p className="text-sm text-foreground/70 mb-2">{message}</p>
            )}
            {action && (
              <button
                onClick={action.onClick}
                className="text-sm text-green-600 hover:text-green-700 font-medium"
              >
                {action.label} →
              </button>
            )}
          </div>
        </div>
      </div>
    );
  },
};

// Usage Example:
// enhancedToast.error({
//   title: 'Impossible d\'ajouter le patient',
//   message: 'Un patient avec cet email existe déjà',
//   solution: 'Utilisez une adresse différente ou modifiez le patient existant',
//   action: {
//     label: 'Voir le patient existant',
//     onClick: () => navigateToPatient(existingPatient.id)
//   }
// });

// ============================================================================
// 3. CONFIRMATION MODAL
// ============================================================================

interface ConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  description?: string;
  consequences?: string[];
  alternative?: {
    label: string;
    onClick: () => void;
  };
  danger?: boolean;
}

export const ConfirmationModal: React.FC<ConfirmationModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  title,
  description,
  consequences,
  alternative,
  danger = false
}) => {
  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
        onClick={onClose}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          onClick={(e) => e.stopPropagation()}
          className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6"
        >
          {/* Icon */}
          <div className={`
            w-12 h-12 rounded-full flex items-center justify-center mb-4
            ${danger ? 'bg-red-100' : 'bg-amber-100'}
          `}>
            {danger ? (
              <AlertTriangle className="w-6 h-6 text-red-600" />
            ) : (
              <AlertCircle className="w-6 h-6 text-amber-600" />
            )}
          </div>

          {/* Title */}
          <h3 className="text-xl font-semibold text-foreground mb-2">
            {title}
          </h3>

          {/* Description */}
          {description && (
            <p className="text-foreground/70 mb-4">
              {description}
            </p>
          )}

          {/* Consequences */}
          {consequences && consequences.length > 0 && (
            <div className="bg-red-50 rounded-lg p-4 mb-4">
              <p className="text-sm font-medium text-red-900 mb-2">
                Cette action va supprimer :
              </p>
              <ul className="space-y-1">
                {consequences.map((item, index) => (
                  <li key={index} className="text-sm text-red-800 flex items-start gap-2">
                    <span className="text-red-600 mt-0.5">•</span>
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Alternative */}
          {alternative && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-4">
              <p className="text-sm text-blue-900">
                💡 <strong>Recommandé :</strong> {alternative.label}
              </p>
            </div>
          )}

          {/* Actions */}
          <div className="flex flex-col-reverse sm:flex-row gap-3">
            <button
              onClick={onClose}
              className="flex-1 px-4 py-3 bg-neutral-100 hover:bg-neutral-200 text-foreground rounded-lg font-medium transition-colors"
            >
              Annuler
            </button>

            {alternative && (
              <button
                onClick={() => {
                  alternative.onClick();
                  onClose();
                }}
                className="flex-1 px-4 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors"
              >
                {alternative.label}
              </button>
            )}

            <button
              onClick={() => {
                onConfirm();
                onClose();
              }}
              className={`
                flex-1 px-4 py-3 rounded-lg font-medium transition-colors
                ${danger
                  ? 'bg-red-600 hover:bg-red-700 text-white'
                  : 'bg-gold-600 hover:bg-gold-700 text-white'
                }
              `}
            >
              {danger ? 'Supprimer définitivement' : 'Confirmer'}
            </button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

// Usage Example:
// <ConfirmationModal
//   isOpen={showDeleteModal}
//   onClose={() => setShowDeleteModal(false)}
//   onConfirm={handleDelete}
//   title="Supprimer Marie Tremblay?"
//   description="Cette action est irréversible."
//   consequences={[
//     'Dossier patient complet',
//     '12 rendez-vous passés',
//     '8 notes SOAP',
//     'Historique de paiements (450$)'
//   ]}
//   alternative={{
//     label: 'Archiver plutôt',
//     onClick: handleArchive
//   }}
//   danger
// />

// ============================================================================
// 4. EMPTY STATE
// ============================================================================

interface EmptyStateProps {
  icon: React.ReactNode;
  title: string;
  description: string;
  primaryAction?: {
    label: string;
    icon?: React.ReactNode;
    onClick: () => void;
  };
  secondaryActions?: Array<{
    label: string;
    onClick?: () => void;
    href?: string;
  }>;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  icon,
  title,
  description,
  primaryAction,
  secondaryActions
}) => {
  return (
    <div className="flex flex-col items-center justify-center py-12 px-4">
      {/* Icon */}
      <div className="w-16 h-16 rounded-full bg-neutral-100 flex items-center justify-center mb-4 text-neutral-400">
        {icon}
      </div>

      {/* Title */}
      <h3 className="text-xl font-semibold text-foreground mb-2">
        {title}
      </h3>

      {/* Description */}
      <p className="text-foreground/60 text-center max-w-sm mb-6">
        {description}
      </p>

      {/* Actions */}
      <div className="flex flex-col sm:flex-row gap-3">
        {primaryAction && (
          <button
            onClick={primaryAction.onClick}
            className="flex items-center gap-2 px-6 py-3 bg-gold-600 hover:bg-gold-700 text-white rounded-lg font-medium transition-colors shadow-sm"
          >
            {primaryAction.icon}
            {primaryAction.label}
          </button>
        )}

        {secondaryActions?.map((action, index) => (
          action.href ? (
            <a
              key={index}
              href={action.href}
              className="px-6 py-3 bg-neutral-100 hover:bg-neutral-200 text-foreground rounded-lg font-medium transition-colors"
            >
              {action.label}
            </a>
          ) : (
            <button
              key={index}
              onClick={action.onClick}
              className="px-6 py-3 bg-neutral-100 hover:bg-neutral-200 text-foreground rounded-lg font-medium transition-colors"
            >
              {action.label}
            </button>
          )
        ))}
      </div>
    </div>
  );
};

// Usage Example:
// <EmptyState
//   icon={<Users size={32} />}
//   title="Aucun patient pour l'instant"
//   description="Commencez en ajoutant votre premier patient pour gérer votre clinique"
//   primaryAction={{
//     label: 'Ajouter un patient',
//     icon: <Plus size={20} />,
//     onClick: () => setShowAddModal(true)
//   }}
//   secondaryActions={[
//     { label: 'Importer depuis CSV', onClick: () => setShowImportModal(true) },
//     { label: 'Voir le guide de démarrage', href: '/guide' }
//   ]}
// />

// ============================================================================
// 5. LOADING STATE
// ============================================================================

interface LoadingStateProps {
  message: string;
  progress?: number;
  details?: string;
}

export const LoadingState: React.FC<LoadingStateProps> = ({
  message,
  progress,
  details
}) => {
  return (
    <div className="flex flex-col items-center justify-center py-12">
      {/* Spinner */}
      <div className="w-12 h-12 border-4 border-gold-200 border-t-gold-600 rounded-full animate-spin mb-4" />

      {/* Message */}
      <p className="text-foreground font-medium mb-2">{message}</p>

      {/* Progress Bar */}
      {progress !== undefined && (
        <div className="w-64 h-2 bg-neutral-200 rounded-full overflow-hidden mb-2">
          <motion.div
            className="h-full bg-gold-600"
            initial={{ width: 0 }}
            animate={{ width: `${progress}%` }}
            transition={{ duration: 0.3 }}
          />
        </div>
      )}

      {/* Details */}
      {details && (
        <p className="text-sm text-foreground/60">{details}</p>
      )}
    </div>
  );
};

// Usage Example:
// <LoadingState
//   message="Chargement de vos patients..."
//   progress={75}
//   details="264 patients chargés sur 350"
// />

// ============================================================================
// 6. INLINE VALIDATION EXAMPLES
// ============================================================================

// Email Validation
export const emailValidation = (email: string) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  if (!email) {
    return { valid: false, message: 'Email requis' };
  }

  if (!emailRegex.test(email)) {
    return {
      valid: false,
      message: 'Format incorrect (ex: dr.tremblay@clinique.com)'
    };
  }

  // Check for common typos
  const commonDomains = ['gmail.com', 'hotmail.com', 'outlook.com', 'yahoo.com'];
  const domain = email.split('@')[1];
  const typos = {
    'gmial.com': 'gmail.com',
    'gmai.com': 'gmail.com',
    'hotmial.com': 'hotmail.com',
    'yahou.com': 'yahoo.com'
  };

  if (typos[domain]) {
    return {
      valid: false,
      message: `Vouliez-vous dire ${email.replace(domain, typos[domain])}?`
    };
  }

  return { valid: true, message: '✓ Email valide' };
};

// Phone Validation
export const phoneValidation = (phone: string) => {
  // Remove all non-digits
  const digits = phone.replace(/\D/g, '');

  if (!digits) {
    return { valid: false, message: 'Téléphone requis' };
  }

  if (digits.length < 10) {
    return {
      valid: false,
      message: `${10 - digits.length} chiffres restants`
    };
  }

  if (digits.length > 10) {
    return {
      valid: false,
      message: 'Trop de chiffres (max 10)'
    };
  }

  return { valid: true, message: '✓ Numéro valide' };
};

// Password Strength
export const passwordValidation = (password: string) => {
  const checks = {
    length: password.length >= 8,
    uppercase: /[A-Z]/.test(password),
    lowercase: /[a-z]/.test(password),
    number: /[0-9]/.test(password),
    special: /[^A-Za-z0-9]/.test(password)
  };

  const score = Object.values(checks).filter(Boolean).length;

  if (score < 3) {
    return {
      valid: false,
      message: 'Mot de passe faible',
      strength: 'weak',
      checks
    };
  }

  if (score < 4) {
    return {
      valid: true,
      message: 'Mot de passe moyen',
      strength: 'medium',
      checks
    };
  }

  return {
    valid: true,
    message: '✓ Mot de passe fort',
    strength: 'strong',
    checks
  };
};

// ============================================================================
// 7. IMPROVED ERROR MESSAGES - EXAMPLES
// ============================================================================

export const errorMessages = {
  // Authentication
  auth: {
    invalidCredentials: {
      title: 'Email ou mot de passe incorrect',
      message: 'Vérifiez vos identifiants et réessayez',
      solution: 'Mot de passe oublié?',
      action: { label: 'Réinitialiser mon mot de passe', onClick: () => {} }
    },
    invalidInviteCode: {
      title: 'Code d\'invitation invalide',
      message: 'Ce code n\'existe pas ou a expiré',
      solution: 'Contactez votre administrateur pour obtenir un nouveau code',
      action: { label: 'Demander un code', onClick: () => {} }
    },
    passwordTooShort: {
      title: 'Mot de passe trop court',
      message: 'Minimum 8 caractères requis',
      solution: 'Ajoutez au moins ' + (8 - password.length) + ' caractères'
    }
  },

  // Patient Management
  patient: {
    duplicateEmail: {
      title: 'Patient déjà existant',
      message: 'Un patient avec cet email existe déjà : Dr. Jean Tremblay',
      solution: 'Utilisez une adresse différente ou modifiez le patient existant',
      action: { label: 'Voir le dossier', onClick: () => {} }
    },
    requiredFields: {
      title: 'Champs obligatoires manquants',
      message: 'Veuillez remplir : Nom, Prénom, Téléphone',
      solution: 'Complétez ces champs pour continuer'
    },
    invalidPhone: {
      title: 'Numéro de téléphone invalide',
      message: 'Format accepté : (514) 555-1234 ou 514-555-1234',
      solution: 'Vérifiez le format et réessayez'
    }
  },

  // Appointment Management
  appointment: {
    conflictingTime: {
      title: 'Plage horaire déjà réservée',
      message: 'Un autre rendez-vous existe à cette heure : 14h30 avec Marie Dubois',
      solution: 'Choisissez une autre plage horaire',
      action: { label: 'Voir l\'agenda', onClick: () => {} }
    },
    pastDate: {
      title: 'Date dans le passé',
      message: 'Impossible de créer un rendez-vous dans le passé',
      solution: 'Sélectionnez une date future'
    }
  },

  // File Operations
  file: {
    importFailed: {
      title: 'Erreur lors de l\'import',
      message: 'Le fichier CSV contient des erreurs à la ligne 45',
      solution: 'Corrigez les erreurs et réessayez',
      action: { label: 'Télécharger le rapport d\'erreurs', onClick: () => {} }
    },
    invalidFormat: {
      title: 'Format de fichier invalide',
      message: 'Seuls les fichiers CSV sont acceptés',
      solution: 'Exportez votre fichier en format CSV depuis Excel'
    }
  }
};

// ============================================================================
// 8. SUCCESS MESSAGES - EXAMPLES
// ============================================================================

export const successMessages = {
  patient: {
    added: (patientName: string) => ({
      title: `✓ ${patientName} ajouté(e)!`,
      message: 'Le dossier patient est prêt',
      action: { label: 'Planifier le premier RDV', onClick: () => {} }
    }),
    updated: (patientName: string, changes: string[]) => ({
      title: `✓ Dossier de ${patientName} mis à jour`,
      message: `Modifié : ${changes.join(', ')}`,
      action: { label: 'Voir le dossier', onClick: () => {} }
    })
  },

  appointment: {
    confirmed: (patientName: string, date: string, time: string) => ({
      title: `✓ RDV confirmé avec ${patientName}`,
      message: `Email de confirmation envoyé\n${date} à ${time}`,
      action: { label: 'Voir l\'agenda', onClick: () => {} }
    }),
    cancelled: (patientName: string) => ({
      title: `✓ RDV annulé`,
      message: `${patientName} a été notifié par email`,
      action: { label: 'Replanifier', onClick: () => {} }
    })
  },

  auth: {
    accountCreated: (email: string) => ({
      title: '🎉 Compte créé avec succès!',
      message: `Bienvenue dans ChiroFlow!\nVous pouvez maintenant vous connecter avec ${email}`,
      action: { label: 'Commencer la visite guidée', onClick: () => {} }
    })
  }
};

// ============================================================================
// USAGE IN COMPONENT - FULL EXAMPLE
// ============================================================================

export const ImprovedPatientForm = () => {
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: ''
  });

  const handleSubmit = async () => {
    try {
      await addPatient(formData);

      // ✅ APRÈS: Message clair avec action
      enhancedToast.success({
        title: `${formData.firstName} ${formData.lastName} ajouté(e)!`,
        message: 'Le dossier patient est prêt',
        action: {
          label: 'Planifier le premier RDV',
          onClick: () => openScheduler(formData)
        }
      });
    } catch (error) {
      // ✅ APRÈS: Message détaillé avec solution
      if (error.code === 'DUPLICATE_EMAIL') {
        enhancedToast.error({
          title: 'Patient déjà existant',
          message: `Un patient avec ${formData.email} existe déjà`,
          solution: 'Utilisez une adresse différente ou modifiez le patient existant',
          action: {
            label: 'Voir le patient existant',
            onClick: () => navigateToPatient(error.existingPatient.id)
          }
        });
      } else {
        enhancedToast.error({
          title: 'Impossible d\'ajouter le patient',
          message: error.message,
          solution: 'Vérifiez les champs et réessayez'
        });
      }
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <ValidationInput
        label="Email professionnel"
        hint="Utilisé pour les rappels de RDV"
        placeholder="dr.tremblay@clinique.com"
        type="email"
        value={formData.email}
        onChange={(value) => setFormData({ ...formData, email: value })}
        validation={emailValidation}
        required
      />

      <ValidationInput
        label="Téléphone"
        hint="Format automatique : (514) 555-1234"
        placeholder="(514) 555-1234"
        type="tel"
        value={formData.phone}
        onChange={(value) => setFormData({ ...formData, phone: value })}
        validation={phoneValidation}
        required
      />

      <button
        type="submit"
        className="w-full px-6 py-3 bg-gold-600 hover:bg-gold-700 text-white rounded-lg font-medium"
      >
        <Plus size={20} />
        Ajouter le patient
      </button>
    </form>
  );
};
