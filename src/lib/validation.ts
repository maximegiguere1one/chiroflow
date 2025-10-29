import { AppError, ERROR_CODES } from './errorHandler';

export interface ValidationRule<T = any> {
  validate: (value: T) => boolean;
  message: string;
  code?: string;
}

export class Validator<T> {
  private rules: ValidationRule<T>[] = [];

  addRule(rule: ValidationRule<T>): this {
    this.rules.push(rule);
    return this;
  }

  validate(value: T, fieldName: string): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    for (const rule of this.rules) {
      if (!rule.validate(value)) {
        errors.push(rule.message.replace('{field}', fieldName));
      }
    }

    return { valid: errors.length === 0, errors };
  }

  validateOrThrow(value: T, fieldName: string): void {
    const result = this.validate(value, fieldName);
    if (!result.valid) {
      throw new AppError(
        result.errors.join('; '),
        ERROR_CODES.VALIDATION_FAILED,
        'low',
        { field: fieldName, value, errors: result.errors }
      );
    }
  }
}

export const Rules = {
  required: <T>(message?: string): ValidationRule<T> => ({
    validate: (value: T) => {
      if (value === null || value === undefined) return false;
      if (typeof value === 'string') return value.trim().length > 0;
      if (Array.isArray(value)) return value.length > 0;
      return true;
    },
    message: message || '{field} est requis',
    code: ERROR_CODES.VALIDATION_REQUIRED_FIELD,
  }),

  minLength: (min: number, message?: string): ValidationRule<string> => ({
    validate: (value: string) => !!(value && value.length >= min),
    message: message || `{field} doit contenir au moins ${min} caractères`,
    code: ERROR_CODES.VALIDATION_INVALID_FORMAT,
  }),

  maxLength: (max: number, message?: string): ValidationRule<string> => ({
    validate: (value: string) => !value || value.length <= max,
    message: message || `{field} ne peut pas dépasser ${max} caractères`,
    code: ERROR_CODES.VALIDATION_INVALID_FORMAT,
  }),

  email: (message?: string): ValidationRule<string> => ({
    validate: (value: string) => {
      const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      return !value || regex.test(value);
    },
    message: message || '{field} doit être une adresse email valide',
    code: ERROR_CODES.VALIDATION_INVALID_FORMAT,
  }),

  phone: (message?: string): ValidationRule<string> => ({
    validate: (value: string) => {
      if (!value) return true;
      const cleaned = value.replace(/\D/g, '');
      return cleaned.length >= 10 && cleaned.length <= 15;
    },
    message: message || '{field} doit être un numéro de téléphone valide',
    code: ERROR_CODES.VALIDATION_INVALID_FORMAT,
  }),

  date: (message?: string): ValidationRule<string> => ({
    validate: (value: string) => {
      if (!value) return true;
      const date = new Date(value);
      return date instanceof Date && !isNaN(date.getTime());
    },
    message: message || '{field} doit être une date valide',
    code: ERROR_CODES.VALIDATION_INVALID_FORMAT,
  }),

  min: (min: number, message?: string): ValidationRule<number> => ({
    validate: (value: number) => value === undefined || value >= min,
    message: message || `{field} doit être supérieur ou égal à ${min}`,
    code: ERROR_CODES.VALIDATION_INVALID_FORMAT,
  }),

  max: (max: number, message?: string): ValidationRule<number> => ({
    validate: (value: number) => value === undefined || value <= max,
    message: message || `{field} doit être inférieur ou égal à ${max}`,
    code: ERROR_CODES.VALIDATION_INVALID_FORMAT,
  }),

  pattern: (regex: RegExp, message?: string): ValidationRule<string> => ({
    validate: (value: string) => !value || regex.test(value),
    message: message || '{field} a un format invalide',
    code: ERROR_CODES.VALIDATION_INVALID_FORMAT,
  }),

  oneOf: <T>(values: T[], message?: string): ValidationRule<T> => ({
    validate: (value: T) => !value || values.includes(value),
    message: message || `{field} doit être l'une des valeurs suivantes: ${values.join(', ')}`,
    code: ERROR_CODES.VALIDATION_INVALID_FORMAT,
  }),

  custom: <T>(
    validateFn: (value: T) => boolean,
    message: string
  ): ValidationRule<T> => ({
    validate: validateFn,
    message,
    code: ERROR_CODES.VALIDATION_FAILED,
  }),
};

export function createPatientValidator() {
  return {
    firstName: new Validator<string>()
      .addRule(Rules.required())
      .addRule(Rules.minLength(2))
      .addRule(Rules.maxLength(100)),

    lastName: new Validator<string>()
      .addRule(Rules.required())
      .addRule(Rules.minLength(2))
      .addRule(Rules.maxLength(100)),

    email: new Validator<string>()
      .addRule(Rules.required())
      .addRule(Rules.email()),

    phone: new Validator<string>()
      .addRule(Rules.required())
      .addRule(Rules.phone()),

    dateOfBirth: new Validator<string>()
      .addRule(Rules.date())
      .addRule(Rules.custom(
        (value: string) => {
          if (!value) return true;
          const date = new Date(value);
          const age = (Date.now() - date.getTime()) / (1000 * 60 * 60 * 24 * 365.25);
          return age >= 0 && age <= 150;
        },
        'Date de naissance invalide'
      )),
  };
}

export function createAppointmentValidator() {
  return {
    name: new Validator<string>()
      .addRule(Rules.required())
      .addRule(Rules.minLength(2))
      .addRule(Rules.maxLength(200)),

    email: new Validator<string>()
      .addRule(Rules.required())
      .addRule(Rules.email()),

    phone: new Validator<string>()
      .addRule(Rules.required())
      .addRule(Rules.phone()),

    reason: new Validator<string>()
      .addRule(Rules.required())
      .addRule(Rules.minLength(5))
      .addRule(Rules.maxLength(1000)),

    scheduledDate: new Validator<string>()
      .addRule(Rules.required())
      .addRule(Rules.date())
      .addRule(Rules.custom(
        (value: string) => {
          if (!value) return true;
          const date = new Date(value);
          return date.getTime() >= Date.now();
        },
        'La date doit être dans le futur'
      )),

    scheduledTime: new Validator<string>()
      .addRule(Rules.required())
      .addRule(Rules.pattern(
        /^([01]\d|2[0-3]):([0-5]\d)$/,
        'Format de temps invalide (HH:MM)'
      )),
  };
}

export function sanitizeInput(input: string): string {
  return input
    .trim()
    .replace(/<script[^>]*>.*?<\/script>/gi, '')
    .replace(/<iframe[^>]*>.*?<\/iframe>/gi, '')
    .replace(/javascript:/gi, '')
    .replace(/on\w+\s*=/gi, '');
}

export function sanitizeObject<T extends Record<string, any>>(obj: T): T {
  const sanitized = {} as T;

  for (const [key, value] of Object.entries(obj)) {
    if (typeof value === 'string') {
      sanitized[key as keyof T] = sanitizeInput(value) as any;
    } else if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
      sanitized[key as keyof T] = sanitizeObject(value);
    } else {
      sanitized[key as keyof T] = value;
    }
  }

  return sanitized;
}

export function validateAndSanitize<T extends Record<string, any>>(
  data: T,
  validators: Record<keyof T, Validator<any>>
): { valid: boolean; data: T; errors: Record<string, string[]> } {
  const errors: Record<string, string[]> = {};
  const sanitized = sanitizeObject(data);

  for (const [field, validator] of Object.entries(validators)) {
    const result = validator.validate(sanitized[field as keyof T], field);
    if (!result.valid) {
      errors[field] = result.errors;
    }
  }

  return {
    valid: Object.keys(errors).length === 0,
    data: sanitized,
    errors,
  };
}
