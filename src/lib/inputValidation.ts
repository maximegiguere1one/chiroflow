/**
 * Comprehensive Input Validation Library
 *
 * Provides secure validation functions for all user inputs to prevent
 * injection attacks, XSS, SQL injection, and other security vulnerabilities.
 *
 * Usage in Edge Functions and frontend code.
 */

export class ValidationError extends Error {
  constructor(
    message: string,
    public field?: string,
    public code?: string
  ) {
    super(message);
    this.name = 'ValidationError';
  }
}

// ============================================================================
// STRING VALIDATORS
// ============================================================================

/**
 * Sanitizes HTML input to prevent XSS attacks
 */
export function sanitizeHtml(input: string): string {
  if (!input) return '';

  return input
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
    .replace(/\//g, '&#x2F;');
}

/**
 * Validates and sanitizes a name (letters, spaces, hyphens, apostrophes only)
 */
export function validateName(name: string, fieldName = 'name'): string {
  if (!name || typeof name !== 'string') {
    throw new ValidationError(`${fieldName} is required`, fieldName, 'REQUIRED');
  }

  const trimmed = name.trim();

  if (trimmed.length < 2) {
    throw new ValidationError(
      `${fieldName} must be at least 2 characters`,
      fieldName,
      'TOO_SHORT'
    );
  }

  if (trimmed.length > 100) {
    throw new ValidationError(
      `${fieldName} must be less than 100 characters`,
      fieldName,
      'TOO_LONG'
    );
  }

  // Allow letters, spaces, hyphens, apostrophes, and accented characters
  const nameRegex = /^[a-zA-ZÀ-ÿ\s'-]+$/;
  if (!nameRegex.test(trimmed)) {
    throw new ValidationError(
      `${fieldName} contains invalid characters`,
      fieldName,
      'INVALID_FORMAT'
    );
  }

  return sanitizeHtml(trimmed);
}

/**
 * Validates email address format
 */
export function validateEmail(email: string): string {
  if (!email || typeof email !== 'string') {
    throw new ValidationError('Email is required', 'email', 'REQUIRED');
  }

  const trimmed = email.trim().toLowerCase();

  // RFC 5322 compliant email regex (simplified)
  const emailRegex = /^[a-zA-Z0-9.!#$%&'*+\/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/;

  if (!emailRegex.test(trimmed)) {
    throw new ValidationError('Invalid email format', 'email', 'INVALID_FORMAT');
  }

  if (trimmed.length > 254) {
    throw new ValidationError('Email is too long', 'email', 'TOO_LONG');
  }

  return trimmed;
}

/**
 * Validates phone number (flexible format, North American focus)
 */
export function validatePhone(phone: string): string {
  if (!phone || typeof phone !== 'string') {
    throw new ValidationError('Phone number is required', 'phone', 'REQUIRED');
  }

  // Remove all non-digit characters for validation
  const digitsOnly = phone.replace(/\D/g, '');

  if (digitsOnly.length < 10) {
    throw new ValidationError(
      'Phone number must have at least 10 digits',
      'phone',
      'TOO_SHORT'
    );
  }

  if (digitsOnly.length > 15) {
    throw new ValidationError(
      'Phone number is too long',
      'phone',
      'TOO_LONG'
    );
  }

  // Return sanitized version (digits, spaces, hyphens, parentheses, plus sign)
  const phoneRegex = /^[\d\s\-\(\)\+]+$/;
  if (!phoneRegex.test(phone)) {
    throw new ValidationError(
      'Phone number contains invalid characters',
      'phone',
      'INVALID_FORMAT'
    );
  }

  return phone.trim();
}

// ============================================================================
// UUID VALIDATORS
// ============================================================================

/**
 * Validates UUID format
 */
export function validateUuid(uuid: string, fieldName = 'id'): string {
  if (!uuid || typeof uuid !== 'string') {
    throw new ValidationError(`${fieldName} is required`, fieldName, 'REQUIRED');
  }

  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

  if (!uuidRegex.test(uuid)) {
    throw new ValidationError(
      `Invalid ${fieldName} format`,
      fieldName,
      'INVALID_FORMAT'
    );
  }

  return uuid.toLowerCase();
}

// ============================================================================
// DATE & TIME VALIDATORS
// ============================================================================

/**
 * Validates date string (YYYY-MM-DD format)
 */
export function validateDate(dateStr: string, fieldName = 'date'): string {
  if (!dateStr || typeof dateStr !== 'string') {
    throw new ValidationError(`${fieldName} is required`, fieldName, 'REQUIRED');
  }

  const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
  if (!dateRegex.test(dateStr)) {
    throw new ValidationError(
      `${fieldName} must be in YYYY-MM-DD format`,
      fieldName,
      'INVALID_FORMAT'
    );
  }

  const date = new Date(dateStr);
  if (isNaN(date.getTime())) {
    throw new ValidationError(`Invalid ${fieldName}`, fieldName, 'INVALID_DATE');
  }

  return dateStr;
}

/**
 * Validates time string (HH:MM format, 24-hour)
 */
export function validateTime(timeStr: string, fieldName = 'time'): string {
  if (!timeStr || typeof timeStr !== 'string') {
    throw new ValidationError(`${fieldName} is required`, fieldName, 'REQUIRED');
  }

  const timeRegex = /^([0-1][0-9]|2[0-3]):[0-5][0-9]$/;
  if (!timeRegex.test(timeStr)) {
    throw new ValidationError(
      `${fieldName} must be in HH:MM format (24-hour)`,
      fieldName,
      'INVALID_FORMAT'
    );
  }

  return timeStr;
}

/**
 * Validates that date is not in the past
 */
export function validateFutureDate(dateStr: string, fieldName = 'date'): string {
  const validated = validateDate(dateStr, fieldName);
  const date = new Date(validated);
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  if (date < today) {
    throw new ValidationError(
      `${fieldName} cannot be in the past`,
      fieldName,
      'DATE_IN_PAST'
    );
  }

  return validated;
}

// ============================================================================
// NUMERIC VALIDATORS
// ============================================================================

/**
 * Validates integer within optional range
 */
export function validateInteger(
  value: any,
  fieldName = 'value',
  min?: number,
  max?: number
): number {
  if (value === null || value === undefined || value === '') {
    throw new ValidationError(`${fieldName} is required`, fieldName, 'REQUIRED');
  }

  const num = Number(value);

  if (!Number.isInteger(num)) {
    throw new ValidationError(
      `${fieldName} must be an integer`,
      fieldName,
      'INVALID_TYPE'
    );
  }

  if (min !== undefined && num < min) {
    throw new ValidationError(
      `${fieldName} must be at least ${min}`,
      fieldName,
      'TOO_SMALL'
    );
  }

  if (max !== undefined && num > max) {
    throw new ValidationError(
      `${fieldName} must be at most ${max}`,
      fieldName,
      'TOO_LARGE'
    );
  }

  return num;
}

/**
 * Validates decimal/float within optional range
 */
export function validateDecimal(
  value: any,
  fieldName = 'value',
  min?: number,
  max?: number,
  maxDecimals = 2
): number {
  if (value === null || value === undefined || value === '') {
    throw new ValidationError(`${fieldName} is required`, fieldName, 'REQUIRED');
  }

  const num = Number(value);

  if (isNaN(num)) {
    throw new ValidationError(
      `${fieldName} must be a number`,
      fieldName,
      'INVALID_TYPE'
    );
  }

  if (min !== undefined && num < min) {
    throw new ValidationError(
      `${fieldName} must be at least ${min}`,
      fieldName,
      'TOO_SMALL'
    );
  }

  if (max !== undefined && num > max) {
    throw new ValidationError(
      `${fieldName} must be at most ${max}`,
      fieldName,
      'TOO_LARGE'
    );
  }

  // Check decimal places
  const decimalPlaces = (num.toString().split('.')[1] || '').length;
  if (decimalPlaces > maxDecimals) {
    throw new ValidationError(
      `${fieldName} can have at most ${maxDecimals} decimal places`,
      fieldName,
      'TOO_MANY_DECIMALS'
    );
  }

  return num;
}

/**
 * Validates currency amount (positive, max 2 decimals)
 */
export function validateCurrency(amount: any, fieldName = 'amount'): number {
  const validated = validateDecimal(amount, fieldName, 0.01, 999999.99, 2);
  return Math.round(validated * 100) / 100; // Ensure exactly 2 decimals
}

// ============================================================================
// ENUM VALIDATORS
// ============================================================================

/**
 * Validates that value is one of allowed options
 */
export function validateEnum<T extends string>(
  value: any,
  allowedValues: readonly T[],
  fieldName = 'value'
): T {
  if (!value || typeof value !== 'string') {
    throw new ValidationError(`${fieldName} is required`, fieldName, 'REQUIRED');
  }

  if (!allowedValues.includes(value as T)) {
    throw new ValidationError(
      `${fieldName} must be one of: ${allowedValues.join(', ')}`,
      fieldName,
      'INVALID_VALUE'
    );
  }

  return value as T;
}

// ============================================================================
// TEXT VALIDATORS
// ============================================================================

/**
 * Validates text with length constraints
 */
export function validateText(
  text: string,
  fieldName = 'text',
  minLength = 1,
  maxLength = 10000
): string {
  if (!text || typeof text !== 'string') {
    if (minLength > 0) {
      throw new ValidationError(`${fieldName} is required`, fieldName, 'REQUIRED');
    }
    return '';
  }

  const trimmed = text.trim();

  if (trimmed.length < minLength) {
    throw new ValidationError(
      `${fieldName} must be at least ${minLength} characters`,
      fieldName,
      'TOO_SHORT'
    );
  }

  if (trimmed.length > maxLength) {
    throw new ValidationError(
      `${fieldName} must be less than ${maxLength} characters`,
      fieldName,
      'TOO_LONG'
    );
  }

  return sanitizeHtml(trimmed);
}

// ============================================================================
// COMPLEX OBJECT VALIDATORS
// ============================================================================

/**
 * Validates appointment data
 */
export interface AppointmentInput {
  name: string;
  email: string;
  phone: string;
  reason: string;
  patient_age?: string;
  preferred_time?: string;
  scheduled_date?: string;
  scheduled_time?: string;
  duration_minutes?: number;
}

export function validateAppointmentData(data: any): AppointmentInput {
  if (!data || typeof data !== 'object') {
    throw new ValidationError('Invalid appointment data', 'data', 'INVALID_TYPE');
  }

  const validated: AppointmentInput = {
    name: validateName(data.name, 'name'),
    email: validateEmail(data.email),
    phone: validatePhone(data.phone),
    reason: validateText(data.reason, 'reason', 10, 1000),
  };

  if (data.patient_age) {
    validated.patient_age = validateText(data.patient_age, 'patient_age', 1, 50);
  }

  if (data.preferred_time) {
    validated.preferred_time = validateText(data.preferred_time, 'preferred_time', 1, 100);
  }

  if (data.scheduled_date) {
    validated.scheduled_date = validateDate(data.scheduled_date, 'scheduled_date');
  }

  if (data.scheduled_time) {
    validated.scheduled_time = validateTime(data.scheduled_time, 'scheduled_time');
  }

  if (data.duration_minutes !== undefined) {
    validated.duration_minutes = validateInteger(
      data.duration_minutes,
      'duration_minutes',
      15,
      480
    );
  }

  return validated;
}

/**
 * Validates payment data
 */
export interface PaymentInput {
  patient_id: string;
  amount: number;
  currency?: string;
  payment_method_id?: string;
  invoice_id?: string;
  description?: string;
}

export function validatePaymentData(data: any): PaymentInput {
  if (!data || typeof data !== 'object') {
    throw new ValidationError('Invalid payment data', 'data', 'INVALID_TYPE');
  }

  const validated: PaymentInput = {
    patient_id: validateUuid(data.patient_id, 'patient_id'),
    amount: validateCurrency(data.amount, 'amount'),
  };

  if (data.currency) {
    validated.currency = validateEnum(
      data.currency,
      ['CAD', 'USD'] as const,
      'currency'
    );
  }

  if (data.payment_method_id) {
    validated.payment_method_id = validateUuid(data.payment_method_id, 'payment_method_id');
  }

  if (data.invoice_id) {
    validated.invoice_id = validateUuid(data.invoice_id, 'invoice_id');
  }

  if (data.description) {
    validated.description = validateText(data.description, 'description', 0, 500);
  }

  return validated;
}

// ============================================================================
// PASSWORD VALIDATORS
// ============================================================================

/**
 * Validates password strength
 */
export function validatePassword(password: string): string {
  if (!password || typeof password !== 'string') {
    throw new ValidationError('Password is required', 'password', 'REQUIRED');
  }

  if (password.length < 8) {
    throw new ValidationError(
      'Password must be at least 8 characters',
      'password',
      'TOO_SHORT'
    );
  }

  if (password.length > 128) {
    throw new ValidationError(
      'Password must be less than 128 characters',
      'password',
      'TOO_LONG'
    );
  }

  // Check for at least one lowercase letter
  if (!/[a-z]/.test(password)) {
    throw new ValidationError(
      'Password must contain at least one lowercase letter',
      'password',
      'MISSING_LOWERCASE'
    );
  }

  // Check for at least one uppercase letter
  if (!/[A-Z]/.test(password)) {
    throw new ValidationError(
      'Password must contain at least one uppercase letter',
      'password',
      'MISSING_UPPERCASE'
    );
  }

  // Check for at least one digit
  if (!/\d/.test(password)) {
    throw new ValidationError(
      'Password must contain at least one number',
      'password',
      'MISSING_NUMBER'
    );
  }

  // Check for at least one special character
  if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) {
    throw new ValidationError(
      'Password must contain at least one special character',
      'password',
      'MISSING_SPECIAL'
    );
  }

  return password;
}

/**
 * Validates that passwords match
 */
export function validatePasswordMatch(password: string, confirmPassword: string): void {
  if (password !== confirmPassword) {
    throw new ValidationError(
      'Passwords do not match',
      'confirmPassword',
      'PASSWORD_MISMATCH'
    );
  }
}
