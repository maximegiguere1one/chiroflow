export function validateEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

export function validatePhone(phone: string): boolean {
  const phoneRegex = /^[\d\s\-\(\)\+]+$/;
  return phoneRegex.test(phone) && phone.replace(/\D/g, '').length >= 10;
}

export function sanitizeInput(input: string): string {
  return input.trim().replace(/<script[^>]*>.*?<\/script>/gi, '');
}

export function validateRequired(value: string | null | undefined, fieldName: string): void {
  if (!value || value.trim().length === 0) {
    throw new Error(`${fieldName} est requis`);
  }
}

export function validateLength(
  value: string,
  fieldName: string,
  min?: number,
  max?: number
): void {
  if (min !== undefined && value.length < min) {
    throw new Error(`${fieldName} doit contenir au moins ${min} caractères`);
  }
  if (max !== undefined && value.length > max) {
    throw new Error(`${fieldName} ne peut pas dépasser ${max} caractères`);
  }
}

export function validateDateFormat(date: string): boolean {
  const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
  if (!dateRegex.test(date)) return false;

  const parsedDate = new Date(date);
  return parsedDate instanceof Date && !isNaN(parsedDate.getTime());
}

export function validateAge(dateOfBirth: string): boolean {
  const dob = new Date(dateOfBirth);
  const today = new Date();
  const age = today.getFullYear() - dob.getFullYear();
  return age >= 0 && age <= 150;
}

export interface ValidationResult {
  valid: boolean;
  errors: string[];
}

export function validatePatientData(data: {
  first_name: string;
  last_name: string;
  email?: string;
  phone?: string;
  date_of_birth?: string;
}): ValidationResult {
  const errors: string[] = [];

  try {
    validateRequired(data.first_name, 'Prénom');
    validateLength(data.first_name, 'Prénom', 1, 100);
  } catch (e: any) {
    errors.push(e.message);
  }

  try {
    validateRequired(data.last_name, 'Nom');
    validateLength(data.last_name, 'Nom', 1, 100);
  } catch (e: any) {
    errors.push(e.message);
  }

  if (data.email && !validateEmail(data.email)) {
    errors.push('Email invalide');
  }

  if (data.phone && !validatePhone(data.phone)) {
    errors.push('Numéro de téléphone invalide');
  }

  if (data.date_of_birth) {
    if (!validateDateFormat(data.date_of_birth)) {
      errors.push('Format de date invalide');
    } else if (!validateAge(data.date_of_birth)) {
      errors.push('Date de naissance invalide');
    }
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

export function validateAppointmentData(data: {
  name: string;
  email: string;
  phone: string;
  reason: string;
}): ValidationResult {
  const errors: string[] = [];

  try {
    validateRequired(data.name, 'Nom');
    validateLength(data.name, 'Nom', 2, 200);
  } catch (e: any) {
    errors.push(e.message);
  }

  if (!validateEmail(data.email)) {
    errors.push('Email invalide');
  }

  if (!validatePhone(data.phone)) {
    errors.push('Numéro de téléphone invalide');
  }

  try {
    validateRequired(data.reason, 'Motif de consultation');
    validateLength(data.reason, 'Motif de consultation', 5, 1000);
  } catch (e: any) {
    errors.push(e.message);
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}
