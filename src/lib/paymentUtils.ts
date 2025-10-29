export function formatCardNumber(value: string): string {
  const cleaned = value.replace(/\D/g, '');
  const groups = cleaned.match(/.{1,4}/g);
  return groups ? groups.join(' ') : cleaned;
}

export function formatExpiryDate(value: string): string {
  const cleaned = value.replace(/\D/g, '');
  if (cleaned.length >= 2) {
    return `${cleaned.slice(0, 2)}/${cleaned.slice(2, 4)}`;
  }
  return cleaned;
}

export function validateCardNumber(cardNumber: string): boolean {
  const cleaned = cardNumber.replace(/\s/g, '');

  if (!/^\d+$/.test(cleaned)) return false;
  if (cleaned.length < 13 || cleaned.length > 19) return false;

  return luhnCheck(cleaned);
}

export function luhnCheck(cardNumber: string): boolean {
  let sum = 0;
  let isEven = false;

  for (let i = cardNumber.length - 1; i >= 0; i--) {
    let digit = parseInt(cardNumber[i], 10);

    if (isEven) {
      digit *= 2;
      if (digit > 9) {
        digit -= 9;
      }
    }

    sum += digit;
    isEven = !isEven;
  }

  return sum % 10 === 0;
}

export function detectCardBrand(cardNumber: string): string {
  const cleaned = cardNumber.replace(/\s/g, '');

  if (/^4/.test(cleaned)) return 'Visa';
  if (/^5[1-5]/.test(cleaned)) return 'Mastercard';
  if (/^3[47]/.test(cleaned)) return 'American Express';
  if (/^6(?:011|5)/.test(cleaned)) return 'Discover';
  if (/^(?:2131|1800|35)/.test(cleaned)) return 'JCB';

  return 'Unknown';
}

export function getCardBrandIcon(brand: string): string {
  const icons: Record<string, string> = {
    'Visa': '💳',
    'Mastercard': '💳',
    'American Express': '💳',
    'Discover': '💳',
    'JCB': '💳',
    'Unknown': '💳',
  };
  return icons[brand] || '💳';
}

export function validateExpiryDate(month: number, year: number): boolean {
  if (month < 1 || month > 12) return false;
  if (year < 2024) return false;

  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth() + 1;

  if (year < currentYear) return false;
  if (year === currentYear && month < currentMonth) return false;

  return true;
}

export function validateCVV(cvv: string, cardBrand: string): boolean {
  const cleaned = cvv.replace(/\D/g, '');

  if (cardBrand === 'American Express') {
    return cleaned.length === 4;
  }

  return cleaned.length === 3;
}

export function validateCanadianPostalCode(postalCode: string): boolean {
  const pattern = /^[A-Za-z]\d[A-Za-z][ -]?\d[A-Za-z]\d$/;
  return pattern.test(postalCode);
}

export function formatCanadianPostalCode(value: string): string {
  const cleaned = value.replace(/[^A-Za-z0-9]/g, '').toUpperCase();
  if (cleaned.length > 3) {
    return `${cleaned.slice(0, 3)} ${cleaned.slice(3, 6)}`;
  }
  return cleaned;
}

export function maskCardNumber(cardNumber: string): string {
  const lastFour = cardNumber.slice(-4);
  return `•••• •••• •••• ${lastFour}`;
}

export function getCardTypeMaxLength(cardBrand: string): number {
  if (cardBrand === 'American Express') return 15;
  return 16;
}

export function getCVVLength(cardBrand: string): number {
  if (cardBrand === 'American Express') return 4;
  return 3;
}

export function isCardExpiringSoon(month: number, year: number, monthsThreshold: number = 2): boolean {
  const now = new Date();
  const expiryDate = new Date(year, month - 1);
  const thresholdDate = new Date(now.getFullYear(), now.getMonth() + monthsThreshold);

  return expiryDate <= thresholdDate;
}

export function formatCurrency(amount: number, currency: string = 'CAD'): string {
  return new Intl.NumberFormat('fr-CA', {
    style: 'currency',
    currency,
  }).format(amount);
}

export function calculateNextBillingDate(
  currentDate: string,
  frequency: 'weekly' | 'biweekly' | 'monthly' | 'quarterly' | 'yearly',
  intervalCount: number = 1
): string {
  const date = new Date(currentDate);

  switch (frequency) {
    case 'weekly':
      date.setDate(date.getDate() + 7 * intervalCount);
      break;
    case 'biweekly':
      date.setDate(date.getDate() + 14 * intervalCount);
      break;
    case 'monthly':
      date.setMonth(date.getMonth() + intervalCount);
      break;
    case 'quarterly':
      date.setMonth(date.getMonth() + 3 * intervalCount);
      break;
    case 'yearly':
      date.setFullYear(date.getFullYear() + intervalCount);
      break;
  }

  return date.toISOString().split('T')[0];
}

export function getFrequencyLabel(frequency: string): string {
  const labels: Record<string, string> = {
    'weekly': 'Hebdomadaire',
    'biweekly': 'Aux deux semaines',
    'monthly': 'Mensuel',
    'quarterly': 'Trimestriel',
    'yearly': 'Annuel',
    'custom': 'Personnalisé',
  };
  return labels[frequency] || frequency;
}

export function validatePaymentAmount(amount: number): { valid: boolean; error?: string } {
  if (isNaN(amount)) {
    return { valid: false, error: 'Le montant doit être un nombre valide' };
  }

  if (amount <= 0) {
    return { valid: false, error: 'Le montant doit être supérieur à 0' };
  }

  if (amount > 1000000) {
    return { valid: false, error: 'Le montant est trop élevé' };
  }

  return { valid: true };
}
