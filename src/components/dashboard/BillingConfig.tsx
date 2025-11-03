import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { supabase } from '../../lib/supabase';
import { useToastContext } from '../../contexts/ToastContext';
import { DollarSign, Save, FileText, CreditCard } from 'lucide-react';
import { buttonHover, buttonTap } from '../../lib/animations';

interface BillingSettings {
  tax_rate?: number;
  tax_name?: string;
  include_tax_in_price?: boolean;
  invoice_prefix?: string;
  next_invoice_number?: number;
  accept_cash?: boolean;
  accept_credit_card?: boolean;
  accept_debit?: boolean;
  accept_insurance?: boolean;
  payment_terms_days?: number;
  late_fee_percentage?: number;
  invoice_notes?: string;
  receipt_footer?: string;
}

interface BillingConfigProps {
  settings: BillingSettings | null;
}

export function BillingConfig({ settings }: BillingConfigProps) {
  const toast = useToastContext();
  const [saving, setSaving] = useState(false);
  const [billingData, setBillingData] = useState({
    tax_rate: 14.975,
    tax_name: 'TPS/TVQ',
    include_tax_in_price: false,
    invoice_prefix: 'INV-',
    next_invoice_number: 1001,
    accept_cash: true,
    accept_credit_card: true,
    accept_debit: true,
    accept_insurance: true,
    payment_terms_days: 30,
    late_fee_percentage: 0,
    invoice_notes: 'Merci de votre confiance. Pour toute question, contactez-nous.',
    receipt_footer: 'Cette facture a été générée électroniquement et est valide sans signature.',
  });

  useEffect(() => {
    if (settings) {
      setBillingData({
        tax_rate: settings.tax_rate ?? 14.975,
        tax_name: settings.tax_name ?? 'TPS/TVQ',
        include_tax_in_price: settings.include_tax_in_price ?? false,
        invoice_prefix: settings.invoice_prefix ?? 'INV-',
        next_invoice_number: settings.next_invoice_number ?? 1001,
        accept_cash: settings.accept_cash ?? true,
        accept_credit_card: settings.accept_credit_card ?? true,
        accept_debit: settings.accept_debit ?? true,
        accept_insurance: settings.accept_insurance ?? true,
        payment_terms_days: settings.payment_terms_days ?? 30,
        late_fee_percentage: settings.late_fee_percentage ?? 0,
        invoice_notes: settings.invoice_notes ?? 'Merci de votre confiance. Pour toute question, contactez-nous.',
        receipt_footer: settings.receipt_footer ?? 'Cette facture a été générée électroniquement et est valide sans signature.',
      });
    }
  }, [settings]);

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();

    try {
      setSaving(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { error } = await supabase
        .from('billing_settings')
        .upsert({
          ...billingData,
          owner_id: user.id,
        });

      if (error) throw error;

      toast.success('Paramètres de facturation sauvegardés!');
    } catch (error) {
      console.error('Error saving billing settings:', error);
      toast.error('Erreur lors de la sauvegarde');
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={handleSave} className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-heading text-foreground flex items-center gap-2">
            <DollarSign className="w-5 h-5 text-gold-500" />
            Configuration de la facturation
          </h3>
          <p className="text-sm text-neutral-600 mt-1">
            Gérez vos paramètres de facturation et taxes
          </p>
        </div>
        <button
          type="submit"
          disabled={saving}
          className="flex items-center gap-2 px-6 py-2 bg-gold-500 text-white rounded-lg hover:bg-gold-600 transition-colors disabled:opacity-50"
        >
          <Save className="w-4 h-4" />
          {saving ? 'Sauvegarde...' : 'Sauvegarder'}
        </button>
      </div>

      {/* Taxes */}
      <div className="bg-white rounded-lg border border-neutral-200 p-6">
        <h4 className="font-medium text-foreground mb-4 flex items-center gap-2">
          <FileText className="w-5 h-5 text-gold-500" />
          Configuration des taxes
        </h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-2">
              Nom de la taxe
            </label>
            <input
              type="text"
              value={billingData.tax_name}
              onChange={(e) => setBillingData({...billingData, tax_name: e.target.value})}
              className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-gold-500 focus:border-transparent"
              placeholder="TPS/TVQ"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-2">
              Taux de taxe (%)
            </label>
            <input
              type="number"
              step="0.001"
              value={billingData.tax_rate}
              onChange={(e) => setBillingData({...billingData, tax_rate: parseFloat(e.target.value)})}
              className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-gold-500 focus:border-transparent"
              placeholder="14.975"
            />
            <p className="text-xs text-neutral-600 mt-1">
              Exemple: 14.975% pour TPS (5%) + TVQ (9.975%)
            </p>
          </div>
          <div className="md:col-span-2">
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={billingData.include_tax_in_price}
                onChange={(e) => setBillingData({...billingData, include_tax_in_price: e.target.checked})}
                className="w-4 h-4 rounded border-neutral-300 text-gold-500 focus:ring-gold-500"
              />
              <span className="text-sm text-neutral-700">
                Inclure les taxes dans le prix affiché
              </span>
            </label>
          </div>
        </div>
      </div>

      {/* Invoice Configuration */}
      <div className="bg-white rounded-lg border border-neutral-200 p-6">
        <h4 className="font-medium text-foreground mb-4">Numérotation des factures</h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-2">
              Préfixe de facture
            </label>
            <input
              type="text"
              value={billingData.invoice_prefix}
              onChange={(e) => setBillingData({...billingData, invoice_prefix: e.target.value})}
              className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-gold-500 focus:border-transparent"
              placeholder="INV-"
            />
            <p className="text-xs text-neutral-600 mt-1">
              Exemple: INV-2025-0001
            </p>
          </div>
          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-2">
              Prochain numéro de facture
            </label>
            <input
              type="number"
              value={billingData.next_invoice_number}
              onChange={(e) => setBillingData({...billingData, next_invoice_number: parseInt(e.target.value)})}
              className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-gold-500 focus:border-transparent"
              min="1"
            />
          </div>
        </div>
      </div>

      {/* Payment Methods */}
      <div className="bg-white rounded-lg border border-neutral-200 p-6">
        <h4 className="font-medium text-foreground mb-4 flex items-center gap-2">
          <CreditCard className="w-5 h-5 text-gold-500" />
          Modes de paiement acceptés
        </h4>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={billingData.accept_cash}
              onChange={(e) => setBillingData({...billingData, accept_cash: e.target.checked})}
              className="w-4 h-4 rounded border-neutral-300 text-gold-500 focus:ring-gold-500"
            />
            <span className="text-sm text-neutral-700">Comptant</span>
          </label>
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={billingData.accept_credit_card}
              onChange={(e) => setBillingData({...billingData, accept_credit_card: e.target.checked})}
              className="w-4 h-4 rounded border-neutral-300 text-gold-500 focus:ring-gold-500"
            />
            <span className="text-sm text-neutral-700">Carte de crédit</span>
          </label>
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={billingData.accept_debit}
              onChange={(e) => setBillingData({...billingData, accept_debit: e.target.checked})}
              className="w-4 h-4 rounded border-neutral-300 text-gold-500 focus:ring-gold-500"
            />
            <span className="text-sm text-neutral-700">Débit</span>
          </label>
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={billingData.accept_insurance}
              onChange={(e) => setBillingData({...billingData, accept_insurance: e.target.checked})}
              className="w-4 h-4 rounded border-neutral-300 text-gold-500 focus:ring-gold-500"
            />
            <span className="text-sm text-neutral-700">Assurance</span>
          </label>
        </div>
      </div>

      {/* Payment Terms */}
      <div className="bg-white rounded-lg border border-neutral-200 p-6">
        <h4 className="font-medium text-foreground mb-4">Termes de paiement</h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-2">
              Délai de paiement (jours)
            </label>
            <input
              type="number"
              value={billingData.payment_terms_days}
              onChange={(e) => setBillingData({...billingData, payment_terms_days: parseInt(e.target.value)})}
              className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-gold-500 focus:border-transparent"
              min="0"
            />
            <p className="text-xs text-neutral-600 mt-1">
              0 = payable immédiatement, 30 = Net 30
            </p>
          </div>
          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-2">
              Frais de retard (%)
            </label>
            <input
              type="number"
              step="0.01"
              value={billingData.late_fee_percentage}
              onChange={(e) => setBillingData({...billingData, late_fee_percentage: parseFloat(e.target.value)})}
              className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-gold-500 focus:border-transparent"
              min="0"
              max="100"
            />
            <p className="text-xs text-neutral-600 mt-1">
              Laisser à 0 pour aucun frais de retard
            </p>
          </div>
        </div>
      </div>

      {/* Invoice Messages */}
      <div className="bg-white rounded-lg border border-neutral-200 p-6">
        <h4 className="font-medium text-foreground mb-4">Messages sur les factures</h4>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-2">
              Notes sur la facture
            </label>
            <textarea
              value={billingData.invoice_notes}
              onChange={(e) => setBillingData({...billingData, invoice_notes: e.target.value})}
              rows={3}
              className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-gold-500 focus:border-transparent"
              placeholder="Message qui apparaît sur toutes les factures"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-2">
              Pied de page des reçus
            </label>
            <textarea
              value={billingData.receipt_footer}
              onChange={(e) => setBillingData({...billingData, receipt_footer: e.target.value})}
              rows={2}
              className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-gold-500 focus:border-transparent"
              placeholder="Texte en bas des reçus et factures"
            />
          </div>
        </div>
      </div>

      {/* Preview */}
      <div className="bg-gradient-to-r from-gold-50 to-gold-100 border border-gold-200 rounded-lg p-6">
        <h4 className="font-medium text-foreground mb-3">Aperçu facture</h4>
        <div className="bg-white rounded-lg p-4 text-sm space-y-2">
          <div className="flex justify-between">
            <span className="text-neutral-600">Numéro:</span>
            <span className="font-mono">{billingData.invoice_prefix}2025-{String(billingData.next_invoice_number).padStart(4, '0')}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-neutral-600">Sous-total:</span>
            <span>100,00 $</span>
          </div>
          <div className="flex justify-between">
            <span className="text-neutral-600">{billingData.tax_name} ({billingData.tax_rate}%):</span>
            <span>{(100 * billingData.tax_rate / 100).toFixed(2)} $</span>
          </div>
          <div className="flex justify-between font-bold pt-2 border-t">
            <span>Total:</span>
            <span>{(100 * (1 + billingData.tax_rate / 100)).toFixed(2)} $</span>
          </div>
          <div className="pt-3 text-xs text-neutral-600 border-t">
            {billingData.invoice_notes}
          </div>
          <div className="text-xs text-neutral-500">
            {billingData.receipt_footer}
          </div>
        </div>
      </div>
    </form>
  );
}
