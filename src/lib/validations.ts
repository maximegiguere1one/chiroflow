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

  const commonTypos: Record<string, string> = {
    'gmial.com': 'gmail.com',
    'gmai.com': 'gmail.com',
    'hotmial.com': 'hotmail.com',
    'yahou.com': 'yahoo.com',
    'outloo.com': 'outlook.com'
  };

  const domain = email.split('@')[1];
  if (commonTypos[domain]) {
    return {
      valid: false,
      message: `Vouliez-vous dire ${email.replace(domain, commonTypos[domain])}?`
    };
  }

  return { valid: true, message: '✓ Email valide' };
};

export const phoneValidation = (phone: string) => {
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

export const formatPhone = (phone: string): string => {
  const digits = phone.replace(/\D/g, '');

  if (digits.length <= 3) {
    return digits;
  }

  if (digits.length <= 6) {
    return `(${digits.slice(0, 3)}) ${digits.slice(3)}`;
  }

  return `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6, 10)}`;
};

export const passwordValidation = (password: string) => {
  const checks = {
    length: password.length >= 8,
    uppercase: /[A-Z]/.test(password),
    lowercase: /[a-z]/.test(password),
    number: /[0-9]/.test(password),
    special: /[^A-Za-z0-9]/.test(password)
  };

  const score = Object.values(checks).filter(Boolean).length;

  if (!password) {
    return { valid: false, message: 'Mot de passe requis', checks };
  }

  if (score < 3) {
    return {
      valid: false,
      message: 'Mot de passe faible - ajoutez plus de variété',
      strength: 'weak',
      checks
    };
  }

  if (score < 4) {
    return {
      valid: true,
      message: 'Mot de passe moyen - presque bon',
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

export const inviteCodeValidation = (code: string) => {
  if (!code) {
    return { valid: false, message: 'Code requis' };
  }

  if (code.length < 6) {
    return {
      valid: false,
      message: `${6 - code.length} caractères restants`
    };
  }

  return { valid: true, message: '✓ Format valide' };
};
