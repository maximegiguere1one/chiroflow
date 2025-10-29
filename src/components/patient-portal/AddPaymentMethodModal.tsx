import { useState } from 'react';
import { motion } from 'framer-motion';
import { X, CreditCard, Lock, CheckCircle } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { env } from '../../lib/env';
import {
  formatCardNumber,
  formatExpiryDate,
  formatCanadianPostalCode,
  validateCardNumber,
  validateExpiryDate,
  validateCVV,
  validateCanadianPostalCode,
  detectCardBrand,
  getCardBrandIcon,
} from '../../lib/paymentUtils';

interface AddPaymentMethodModalProps {
  patientId: string;
  onClose: () => void;
  onSuccess: () => void;
}

export default function AddPaymentMethodModal({
  patientId,
  onClose,
  onSuccess,
}: AddPaymentMethodModalProps) {
  const [step, setStep] = useState<'form' | 'processing' | 'success'>('form');
  const [formData, setFormData] = useState({
    cardNumber: '',
    expiryDate: '',
    cvv: '',
    cardholderName: '',
    line1: '',
    line2: '',
    city: '',
    province: 'QC',
    postalCode: '',
    cardNickname: '',
    setPrimary: false,
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [cardBrand, setCardBrand] = useState('Unknown');

  function handleCardNumberChange(value: string) {
    const formatted = formatCardNumber(value);
    if (formatted.replace(/\s/g, '').length <= 19) {
      setFormData({ ...formData, cardNumber: formatted });
      setCardBrand(detectCardBrand(formatted));
      if (errors.cardNumber) {
        setErrors({ ...errors, cardNumber: '' });
      }
    }
  }

  function handleExpiryChange(value: string) {
    const formatted = formatExpiryDate(value);
    if (formatted.length <= 5) {
      setFormData({ ...formData, expiryDate: formatted });
      if (errors.expiryDate) {
        setErrors({ ...errors, expiryDate: '' });
      }
    }
  }

  function handleCVVChange(value: string) {
    const cleaned = value.replace(/\D/g, '');
    const maxLength = cardBrand === 'American Express' ? 4 : 3;
    if (cleaned.length <= maxLength) {
      setFormData({ ...formData, cvv: cleaned });
      if (errors.cvv) {
        setErrors({ ...errors, cvv: '' });
      }
    }
  }

  function handlePostalCodeChange(value: string) {
    const formatted = formatCanadianPostalCode(value);
    if (formatted.length <= 7) {
      setFormData({ ...formData, postalCode: formatted });
      if (errors.postalCode) {
        setErrors({ ...errors, postalCode: '' });
      }
    }
  }

  function validateForm(): boolean {
    const newErrors: Record<string, string> = {};

    if (!validateCardNumber(formData.cardNumber)) {
      newErrors.cardNumber = 'Numéro de carte invalide';
    }

    const [month, year] = formData.expiryDate.split('/');
    if (!month || !year || !validateExpiryDate(parseInt(month), parseInt('20' + year))) {
      newErrors.expiryDate = 'Date d\'expiration invalide';
    }

    if (!validateCVV(formData.cvv, cardBrand)) {
      newErrors.cvv = 'CVV invalide';
    }

    if (!formData.cardholderName.trim()) {
      newErrors.cardholderName = 'Nom du titulaire requis';
    }

    if (!formData.line1.trim()) {
      newErrors.line1 = 'Adresse requise';
    }

    if (!formData.city.trim()) {
      newErrors.city = 'Ville requise';
    }

    if (!validateCanadianPostalCode(formData.postalCode)) {
      newErrors.postalCode = 'Code postal invalide';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setStep('processing');

    try {
      const [month, year] = formData.expiryDate.split('/');

      const response = await fetch(
        `${env.supabaseUrl}/functions/v1/tokenize-payment-method`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${env.supabaseAnonKey}`,
          },
          body: JSON.stringify({
            cardNumber: formData.cardNumber.replace(/\s/g, ''),
            expiryMonth: month,
            expiryYear: '20' + year,
            cvv: formData.cvv,
            cardholderName: formData.cardholderName,
            billingAddress: {
              line1: formData.line1,
              line2: formData.line2 || null,
              city: formData.city,
              province: formData.province,
              postalCode: formData.postalCode,
              country: 'CA',
            },
            patientId,
            cardNickname: formData.cardNickname || null,
            setPrimary: formData.setPrimary,
          }),
        }
      );

      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error || 'Échec de la tokenisation');
      }

      const { error: insertError } = await supabase.from('payment_methods').insert({
        patient_id: patientId,
        card_token: result.token,
        card_brand: result.cardBrand,
        last_four_digits: result.lastFourDigits,
        expiry_month: parseInt(month),
        expiry_year: parseInt('20' + year),
        cardholder_name: formData.cardholderName,
        billing_address_line1: formData.line1,
        billing_address_line2: formData.line2 || null,
        billing_city: formData.city,
        billing_province: formData.province,
        billing_postal_code: formData.postalCode,
        billing_country: 'CA',
        card_nickname: formData.cardNickname || null,
        is_primary: formData.setPrimary,
        is_verified: true,
        is_active: true,
      });

      if (insertError) throw insertError;

      setStep('success');
      setTimeout(() => {
        onSuccess();
      }, 1500);
    } catch (error: any) {
      console.error('Error adding payment method:', error);
      alert('Erreur: ' + (error.message || 'Erreur inconnue'));
      setStep('form');
    }
  }

  if (step === 'processing') {
    return (
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-6">
        <div className="bg-white p-12 rounded-lg shadow-lifted text-center">
          <div className="w-16 h-16 border-4 border-gold-400 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-foreground font-medium">Traitement sécurisé en cours...</p>
          <p className="text-sm text-foreground/60 mt-2">Veuillez patienter</p>
        </div>
      </div>
    );
  }

  if (step === 'success') {
    return (
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-6">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-white p-12 rounded-lg shadow-lifted text-center"
        >
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckCircle className="w-8 h-8 text-green-600" />
          </div>
          <h3 className="text-xl font-heading text-foreground mb-2">Carte ajoutée avec succès!</h3>
          <p className="text-foreground/60">Votre méthode de paiement est maintenant active</p>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-6">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-white w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-lifted rounded-lg"
      >
        <div className="sticky top-0 bg-white border-b border-neutral-200 p-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-gold-400 to-gold-600 rounded-lg flex items-center justify-center">
              <CreditCard className="w-5 h-5 text-white" />
            </div>
            <h3 className="text-xl font-heading text-foreground">Ajouter une carte</h3>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-neutral-100 rounded-lg transition-colors">
            <X className="w-6 h-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          <div className="bg-gradient-to-br from-neutral-800 to-neutral-900 text-white p-6 rounded-xl">
            <div className="flex items-center justify-between mb-6">
              <div className="text-2xl">{getCardBrandIcon(cardBrand)}</div>
              <div className="text-sm opacity-80">{cardBrand}</div>
            </div>
            <div className="text-xl tracking-wider font-mono mb-4">
              {formData.cardNumber || '•••• •••• •••• ••••'}
            </div>
            <div className="flex items-center justify-between text-sm">
              <div className="opacity-80">
                {formData.cardholderName || 'NOM DU TITULAIRE'}
              </div>
              <div className="opacity-80">{formData.expiryDate || 'MM/YY'}</div>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-foreground/70 mb-2">
              Numéro de carte <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              inputMode="numeric"
              value={formData.cardNumber}
              onChange={(e) => handleCardNumberChange(e.target.value)}
              className={`w-full px-4 py-3 border ${
                errors.cardNumber ? 'border-red-300' : 'border-neutral-300'
              } focus:border-gold-400 focus:outline-none focus:ring-2 focus:ring-gold-200 transition-all rounded-lg`}
              placeholder="1234 5678 9012 3456"
            />
            {errors.cardNumber && <p className="mt-1 text-sm text-red-600">{errors.cardNumber}</p>}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-foreground/70 mb-2">
                Date d'expiration <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                inputMode="numeric"
                value={formData.expiryDate}
                onChange={(e) => handleExpiryChange(e.target.value)}
                className={`w-full px-4 py-3 border ${
                  errors.expiryDate ? 'border-red-300' : 'border-neutral-300'
                } focus:border-gold-400 focus:outline-none focus:ring-2 focus:ring-gold-200 transition-all rounded-lg`}
                placeholder="MM/YY"
              />
              {errors.expiryDate && <p className="mt-1 text-sm text-red-600">{errors.expiryDate}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-foreground/70 mb-2">
                CVV <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <input
                  type="text"
                  inputMode="numeric"
                  value={formData.cvv}
                  onChange={(e) => handleCVVChange(e.target.value)}
                  className={`w-full px-4 py-3 border ${
                    errors.cvv ? 'border-red-300' : 'border-neutral-300'
                  } focus:border-gold-400 focus:outline-none focus:ring-2 focus:ring-gold-200 transition-all rounded-lg`}
                  placeholder="123"
                />
                <Lock className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-foreground/40" />
              </div>
              {errors.cvv && <p className="mt-1 text-sm text-red-600">{errors.cvv}</p>}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-foreground/70 mb-2">
              Nom du titulaire <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={formData.cardholderName}
              onChange={(e) =>
                setFormData({ ...formData, cardholderName: e.target.value.toUpperCase() })
              }
              className={`w-full px-4 py-3 border ${
                errors.cardholderName ? 'border-red-300' : 'border-neutral-300'
              } focus:border-gold-400 focus:outline-none focus:ring-2 focus:ring-gold-200 transition-all rounded-lg`}
              placeholder="JEAN DUPONT"
            />
            {errors.cardholderName && (
              <p className="mt-1 text-sm text-red-600">{errors.cardholderName}</p>
            )}
          </div>

          <div className="border-t border-neutral-200 pt-6">
            <h4 className="font-medium text-foreground mb-4">Adresse de facturation</h4>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-foreground/70 mb-2">
                  Adresse <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.line1}
                  onChange={(e) => setFormData({ ...formData, line1: e.target.value })}
                  className={`w-full px-4 py-3 border ${
                    errors.line1 ? 'border-red-300' : 'border-neutral-300'
                  } focus:border-gold-400 focus:outline-none focus:ring-2 focus:ring-gold-200 transition-all rounded-lg`}
                  placeholder="123 Rue Principale"
                />
                {errors.line1 && <p className="mt-1 text-sm text-red-600">{errors.line1}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground/70 mb-2">
                  Appartement, suite, etc. (optionnel)
                </label>
                <input
                  type="text"
                  value={formData.line2}
                  onChange={(e) => setFormData({ ...formData, line2: e.target.value })}
                  className="w-full px-4 py-3 border border-neutral-300 focus:border-gold-400 focus:outline-none focus:ring-2 focus:ring-gold-200 transition-all rounded-lg"
                  placeholder="App. 4B"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-foreground/70 mb-2">
                    Ville <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.city}
                    onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                    className={`w-full px-4 py-3 border ${
                      errors.city ? 'border-red-300' : 'border-neutral-300'
                    } focus:border-gold-400 focus:outline-none focus:ring-2 focus:ring-gold-200 transition-all rounded-lg`}
                    placeholder="Montréal"
                  />
                  {errors.city && <p className="mt-1 text-sm text-red-600">{errors.city}</p>}
                </div>

                <div>
                  <label className="block text-sm font-medium text-foreground/70 mb-2">
                    Province <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={formData.province}
                    onChange={(e) => setFormData({ ...formData, province: e.target.value })}
                    className="w-full px-4 py-3 border border-neutral-300 focus:border-gold-400 focus:outline-none focus:ring-2 focus:ring-gold-200 transition-all rounded-lg"
                  >
                    <option value="QC">Québec</option>
                    <option value="ON">Ontario</option>
                    <option value="BC">Colombie-Britannique</option>
                    <option value="AB">Alberta</option>
                    <option value="MB">Manitoba</option>
                    <option value="SK">Saskatchewan</option>
                    <option value="NS">Nouvelle-Écosse</option>
                    <option value="NB">Nouveau-Brunswick</option>
                    <option value="PE">Île-du-Prince-Édouard</option>
                    <option value="NL">Terre-Neuve-et-Labrador</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground/70 mb-2">
                  Code postal <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.postalCode}
                  onChange={(e) => handlePostalCodeChange(e.target.value)}
                  className={`w-full px-4 py-3 border ${
                    errors.postalCode ? 'border-red-300' : 'border-neutral-300'
                  } focus:border-gold-400 focus:outline-none focus:ring-2 focus:ring-gold-200 transition-all rounded-lg`}
                  placeholder="H1A 1A1"
                />
                {errors.postalCode && <p className="mt-1 text-sm text-red-600">{errors.postalCode}</p>}
              </div>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-foreground/70 mb-2">
              Surnom de la carte (optionnel)
            </label>
            <input
              type="text"
              value={formData.cardNickname}
              onChange={(e) => setFormData({ ...formData, cardNickname: e.target.value })}
              className="w-full px-4 py-3 border border-neutral-300 focus:border-gold-400 focus:outline-none focus:ring-2 focus:ring-gold-200 transition-all rounded-lg"
              placeholder="Ma carte personnelle"
            />
          </div>

          <div className="flex items-center gap-3">
            <input
              type="checkbox"
              id="setPrimary"
              checked={formData.setPrimary}
              onChange={(e) => setFormData({ ...formData, setPrimary: e.target.checked })}
              className="w-4 h-4 text-gold-600 border-neutral-300 rounded focus:ring-gold-500"
            />
            <label htmlFor="setPrimary" className="text-sm text-foreground/80">
              Définir comme méthode de paiement principale
            </label>
          </div>

          <div className="bg-neutral-50 border border-neutral-200 p-4 rounded-lg">
            <div className="flex items-start gap-3">
              <Lock className="w-5 h-5 text-gold-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm text-foreground/80 font-medium mb-1">
                  Paiement sécurisé
                </p>
                <p className="text-xs text-foreground/60">
                  Vos informations de carte sont cryptées et stockées de manière sécurisée. Nous
                  n'enregistrons jamais votre numéro de carte complet ou votre CVV.
                </p>
              </div>
            </div>
          </div>

          <div className="flex items-center justify-end gap-4 pt-4 border-t border-neutral-200">
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-3 border border-neutral-300 text-foreground hover:bg-neutral-50 transition-all rounded-lg"
            >
              Annuler
            </button>
            <button
              type="submit"
              className="px-6 py-3 bg-gradient-to-r from-gold-500 to-gold-600 text-white hover:from-gold-600 hover:to-gold-700 transition-all duration-300 shadow-soft hover:shadow-gold rounded-lg"
            >
              Ajouter la carte
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
}
