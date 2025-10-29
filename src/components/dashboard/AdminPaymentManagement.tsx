import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  CreditCard,
  DollarSign,
  TrendingUp,
  Calendar,
  Search,
  Download,
  Eye,
  RefreshCw,
} from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useToastContext } from '../../contexts/ToastContext';
import { formatCurrency, getCardBrandIcon } from '../../lib/paymentUtils';
import type { PaymentTransactionExtended, PaymentSubscription } from '../../types/database';

export function AdminPaymentManagement() {
  const [view, setView] = useState<'overview' | 'methods' | 'transactions' | 'subscriptions'>('overview');
  const [paymentMethods, setPaymentMethods] = useState<any[]>([]);
  const [transactions, setTransactions] = useState<PaymentTransactionExtended[]>([]);
  const [subscriptions, setSubscriptions] = useState<PaymentSubscription[]>([]);
  const [stats, setStats] = useState({
    totalMethods: 0,
    activeSubscriptions: 0,
    monthlyRevenue: 0,
    transactionsToday: 0,
  });
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [tablesExist, setTablesExist] = useState(true);
  const toast = useToastContext();

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    try {
      setLoading(true);

      const [methodsRes, transactionsRes, subscriptionsRes] = await Promise.all([
        supabase
          .from('payment_methods')
          .select('*, patients_full(first_name, last_name, email)')
          .eq('is_active', true)
          .order('created_at', { ascending: false }),
        supabase
          .from('payment_transactions_extended')
          .select('*, patients_full(first_name, last_name)')
          .order('created_at', { ascending: false })
          .limit(50),
        supabase
          .from('payment_subscriptions')
          .select('*, patients_full(first_name, last_name)')
          .eq('status', 'active')
          .order('next_billing_date', { ascending: true }),
      ]);

      const hasTableError = methodsRes.error?.code === '42P01' ||
                            transactionsRes.error?.code === '42P01' ||
                            subscriptionsRes.error?.code === '42P01';

      if (hasTableError) {
        setTablesExist(false);
        setLoading(false);
        return;
      }

      if (methodsRes.error && methodsRes.error.code !== 'PGRST116') {
        console.error('Payment methods error:', methodsRes.error);
      }
      if (transactionsRes.error && transactionsRes.error.code !== 'PGRST116') {
        console.error('Transactions error:', transactionsRes.error);
      }
      if (subscriptionsRes.error && subscriptionsRes.error.code !== 'PGRST116') {
        console.error('Subscriptions error:', subscriptionsRes.error);
      }

      setPaymentMethods(methodsRes.data || []);
      setTransactions(transactionsRes.data || []);
      setSubscriptions(subscriptionsRes.data || []);

      const today = new Date().toISOString().split('T')[0];
      const todayTransactions = (transactionsRes.data || []).filter((t: any) =>
        t.created_at.startsWith(today)
      );

      const monthlyRevenue = (transactionsRes.data || [])
        .filter((t: any) => t.status === 'completed')
        .reduce((sum: number, t: any) => sum + t.amount, 0);

      setStats({
        totalMethods: methodsRes.data?.length || 0,
        activeSubscriptions: subscriptionsRes.data?.length || 0,
        monthlyRevenue,
        transactionsToday: todayTransactions.length,
      });
    } catch (error: any) {
      console.error('Error loading payment data:', error);
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="w-8 h-8 border-4 border-gold-400 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!tablesExist) {
    return (
      <div className="space-y-6">
        <div>
          <h2 className="text-2xl font-heading text-foreground">Gestion des paiements</h2>
          <p className="text-sm text-foreground/60 mt-1">Vue d'ensemble du système de paiement</p>
        </div>

        <div className="bg-gradient-to-br from-orange-50 to-orange-100 border-2 border-orange-300 rounded-lg p-8 text-center">
          <div className="w-16 h-16 bg-orange-200 rounded-full flex items-center justify-center mx-auto mb-4">
            <CreditCard className="w-8 h-8 text-orange-700" />
          </div>
          <h3 className="text-xl font-heading text-orange-900 mb-2">
            Configuration requise
          </h3>
          <p className="text-orange-800 mb-4 max-w-2xl mx-auto">
            Le système de paiement nécessite la création des tables dans la base de données.
            Veuillez appliquer la migration de base de données pour activer cette fonctionnalité.
          </p>
          <div className="bg-white/50 rounded-lg p-4 text-left max-w-2xl mx-auto">
            <p className="text-sm font-medium text-orange-900 mb-2">
              Fichier de migration :
            </p>
            <code className="text-xs bg-orange-100 px-2 py-1 rounded text-orange-800 block mb-3">
              supabase/migrations/20251017210000_create_payment_system.sql
            </code>
            <p className="text-xs text-orange-700">
              Cette migration créera les tables suivantes : payment_methods, payment_subscriptions,
              payment_transactions_extended, payment_schedule_logs, et payment_method_audit_log.
            </p>
          </div>
          <button
            onClick={loadData}
            className="mt-6 px-6 py-3 bg-orange-600 text-white hover:bg-orange-700 rounded-lg transition-colors font-medium"
          >
            Réessayer
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-heading text-foreground">Gestion des paiements</h2>
          <p className="text-sm text-foreground/60 mt-1">Vue d'ensemble du système de paiement</p>
        </div>
        <button
          onClick={loadData}
          className="flex items-center gap-2 px-4 py-2 border border-neutral-300 hover:bg-neutral-50 rounded-lg transition-colors"
        >
          <RefreshCw className="w-4 h-4" />
          <span className="text-sm">Actualiser</span>
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <StatsCard
          title="Méthodes de paiement"
          value={stats.totalMethods}
          icon={CreditCard}
          color="from-gold-400 to-gold-600"
          bgColor="from-gold-50 to-gold-100"
        />
        <StatsCard
          title="Abonnements actifs"
          value={stats.activeSubscriptions}
          icon={Calendar}
          color="from-green-500 to-green-600"
          bgColor="from-green-50 to-green-100"
        />
        <StatsCard
          title="Revenus du mois"
          value={formatCurrency(stats.monthlyRevenue)}
          icon={DollarSign}
          color="from-neutral-600 to-foreground"
          bgColor="from-neutral-50 to-neutral-100"
        />
        <StatsCard
          title="Transactions aujourd'hui"
          value={stats.transactionsToday}
          icon={TrendingUp}
          color="from-gold-600 to-gold-400"
          bgColor="from-gold-100 to-gold-50"
        />
      </div>

      <div className="flex items-center gap-2 border border-neutral-300 overflow-hidden rounded-lg">
        {(['overview', 'methods', 'transactions', 'subscriptions'] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setView(tab)}
            className={`px-6 py-3 text-sm font-medium transition-colors ${
              view === tab
                ? 'bg-gradient-to-r from-gold-500 to-gold-600 text-white'
                : 'bg-white text-foreground hover:bg-neutral-50'
            }`}
          >
            {tab === 'overview' && 'Vue d\'ensemble'}
            {tab === 'methods' && 'Méthodes de paiement'}
            {tab === 'transactions' && 'Transactions'}
            {tab === 'subscriptions' && 'Abonnements'}
          </button>
        ))}
      </div>

      {view === 'overview' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white border border-neutral-200 shadow-soft rounded-lg p-6">
            <h3 className="font-medium text-foreground mb-4">Transactions récentes</h3>
            <div className="space-y-3">
              {transactions.slice(0, 5).map((transaction) => (
                <div
                  key={transaction.id}
                  className="flex items-center justify-between py-2 border-b border-neutral-100 last:border-0"
                >
                  <div className="flex-1">
                    <div className="text-sm font-medium text-foreground">
                      {(transaction as any).patients_full?.first_name}{' '}
                      {(transaction as any).patients_full?.last_name}
                    </div>
                    <div className="text-xs text-foreground/60">
                      {new Date(transaction.created_at).toLocaleDateString('fr-CA')}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-medium text-foreground">
                      {formatCurrency(transaction.amount, transaction.currency)}
                    </div>
                    <div
                      className={`text-xs ${
                        transaction.status === 'completed'
                          ? 'text-green-600'
                          : transaction.status === 'failed'
                          ? 'text-red-600'
                          : 'text-orange-600'
                      }`}
                    >
                      {transaction.status}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-white border border-neutral-200 shadow-soft rounded-lg p-6">
            <h3 className="font-medium text-foreground mb-4">Prochains prélèvements</h3>
            <div className="space-y-3">
              {subscriptions.slice(0, 5).map((subscription) => (
                <div
                  key={subscription.id}
                  className="flex items-center justify-between py-2 border-b border-neutral-100 last:border-0"
                >
                  <div className="flex-1">
                    <div className="text-sm font-medium text-foreground">
                      {(subscription as any).patients_full?.first_name}{' '}
                      {(subscription as any).patients_full?.last_name}
                    </div>
                    <div className="text-xs text-foreground/60">{subscription.description}</div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-medium text-foreground">
                      {formatCurrency(subscription.amount, subscription.currency)}
                    </div>
                    <div className="text-xs text-foreground/60">
                      {new Date(subscription.next_billing_date).toLocaleDateString('fr-CA')}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {view === 'methods' && (
        <div className="bg-white border border-neutral-200 shadow-soft rounded-lg overflow-hidden">
          <div className="p-4 border-b border-neutral-200">
            <div className="relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-foreground/40" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Rechercher par nom de patient..."
                className="w-full pl-12 pr-4 py-2 border border-neutral-300 focus:border-gold-400 focus:outline-none focus:ring-2 focus:ring-gold-200 transition-all rounded-lg"
              />
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-neutral-50 border-b border-neutral-200">
                <tr>
                  <th className="text-left px-6 py-4 text-sm font-medium text-foreground/70">
                    Patient
                  </th>
                  <th className="text-left px-6 py-4 text-sm font-medium text-foreground/70">Carte</th>
                  <th className="text-left px-6 py-4 text-sm font-medium text-foreground/70">
                    Expiration
                  </th>
                  <th className="text-center px-6 py-4 text-sm font-medium text-foreground/70">
                    Statut
                  </th>
                  <th className="text-right px-6 py-4 text-sm font-medium text-foreground/70">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-200">
                {paymentMethods
                  .filter((method) => {
                    const patient = method.patients_full;
                    const fullName = `${patient?.first_name} ${patient?.last_name}`.toLowerCase();
                    return fullName.includes(searchTerm.toLowerCase());
                  })
                  .map((method) => (
                    <tr key={method.id} className="hover:bg-neutral-50 transition-colors">
                      <td className="px-6 py-4">
                        <div className="font-medium text-foreground">
                          {method.patients_full?.first_name} {method.patients_full?.last_name}
                        </div>
                        <div className="text-sm text-foreground/60">
                          {method.patients_full?.email}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <span className="text-lg">{getCardBrandIcon(method.card_brand)}</span>
                          <div>
                            <div className="text-sm font-medium text-foreground">
                              {method.card_brand} •••• {method.last_four_digits}
                            </div>
                            {method.card_nickname && (
                              <div className="text-xs text-foreground/60">{method.card_nickname}</div>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm text-foreground/80">
                        {String(method.expiry_month).padStart(2, '0')}/
                        {String(method.expiry_year).slice(-2)}
                      </td>
                      <td className="px-6 py-4 text-center">
                        <span
                          className={`inline-block px-3 py-1 text-xs font-medium rounded-full ${
                            method.is_primary
                              ? 'bg-gold-100 text-gold-700'
                              : 'bg-neutral-100 text-neutral-700'
                          }`}
                        >
                          {method.is_primary ? 'Principale' : 'Active'}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <button
                          onClick={() => toast.info('Détails bientôt disponibles')}
                          className="p-2 hover:bg-neutral-100 rounded-lg transition-colors"
                          title="Voir les détails"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {view === 'transactions' && (
        <div className="bg-white border border-neutral-200 shadow-soft rounded-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-neutral-50 border-b border-neutral-200">
                <tr>
                  <th className="text-left px-6 py-4 text-sm font-medium text-foreground/70">Date</th>
                  <th className="text-left px-6 py-4 text-sm font-medium text-foreground/70">
                    Patient
                  </th>
                  <th className="text-left px-6 py-4 text-sm font-medium text-foreground/70">Type</th>
                  <th className="text-right px-6 py-4 text-sm font-medium text-foreground/70">
                    Montant
                  </th>
                  <th className="text-center px-6 py-4 text-sm font-medium text-foreground/70">
                    Statut
                  </th>
                  <th className="text-right px-6 py-4 text-sm font-medium text-foreground/70">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-200">
                {transactions.map((transaction) => (
                  <tr key={transaction.id} className="hover:bg-neutral-50 transition-colors">
                    <td className="px-6 py-4 text-sm text-foreground/80">
                      {new Date(transaction.created_at).toLocaleDateString('fr-CA')}
                    </td>
                    <td className="px-6 py-4 text-sm font-medium text-foreground">
                      {(transaction as any).patients_full?.first_name}{' '}
                      {(transaction as any).patients_full?.last_name}
                    </td>
                    <td className="px-6 py-4 text-sm text-foreground/80 capitalize">
                      {transaction.transaction_type}
                    </td>
                    <td className="px-6 py-4 text-sm font-medium text-foreground text-right">
                      {formatCurrency(transaction.amount, transaction.currency)}
                    </td>
                    <td className="px-6 py-4 text-center">
                      <span
                        className={`inline-block px-3 py-1 text-xs font-medium rounded-full ${
                          transaction.status === 'completed'
                            ? 'bg-green-100 text-green-700'
                            : transaction.status === 'pending'
                            ? 'bg-orange-100 text-orange-700'
                            : transaction.status === 'failed'
                            ? 'bg-red-100 text-red-700'
                            : 'bg-neutral-100 text-neutral-700'
                        }`}
                      >
                        {transaction.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => toast.info('Détails bientôt disponibles')}
                          className="p-2 hover:bg-neutral-100 rounded-lg transition-colors"
                          title="Voir"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => toast.info('Téléchargement bientôt disponible')}
                          className="p-2 hover:bg-neutral-100 rounded-lg transition-colors"
                          title="Télécharger"
                        >
                          <Download className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {view === 'subscriptions' && (
        <div className="bg-white border border-neutral-200 shadow-soft rounded-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-neutral-50 border-b border-neutral-200">
                <tr>
                  <th className="text-left px-6 py-4 text-sm font-medium text-foreground/70">
                    Patient
                  </th>
                  <th className="text-left px-6 py-4 text-sm font-medium text-foreground/70">
                    Description
                  </th>
                  <th className="text-left px-6 py-4 text-sm font-medium text-foreground/70">
                    Fréquence
                  </th>
                  <th className="text-right px-6 py-4 text-sm font-medium text-foreground/70">
                    Montant
                  </th>
                  <th className="text-left px-6 py-4 text-sm font-medium text-foreground/70">
                    Prochain prélèvement
                  </th>
                  <th className="text-center px-6 py-4 text-sm font-medium text-foreground/70">
                    Statut
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-200">
                {subscriptions.map((subscription) => (
                  <tr key={subscription.id} className="hover:bg-neutral-50 transition-colors">
                    <td className="px-6 py-4 text-sm font-medium text-foreground">
                      {(subscription as any).patients_full?.first_name}{' '}
                      {(subscription as any).patients_full?.last_name}
                    </td>
                    <td className="px-6 py-4 text-sm text-foreground/80">
                      {subscription.description}
                    </td>
                    <td className="px-6 py-4 text-sm text-foreground/80 capitalize">
                      {subscription.frequency}
                    </td>
                    <td className="px-6 py-4 text-sm font-medium text-foreground text-right">
                      {formatCurrency(subscription.amount, subscription.currency)}
                    </td>
                    <td className="px-6 py-4 text-sm text-foreground/80">
                      {new Date(subscription.next_billing_date).toLocaleDateString('fr-CA')}
                    </td>
                    <td className="px-6 py-4 text-center">
                      <span className="inline-block px-3 py-1 text-xs font-medium rounded-full bg-green-100 text-green-700">
                        {subscription.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

function StatsCard({
  title,
  value,
  icon: Icon,
  color,
  bgColor,
}: {
  title: string;
  value: number | string;
  icon: any;
  color: string;
  bgColor: string;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="relative group"
    >
      <div
        className={`bg-gradient-to-br ${bgColor} border border-white/40 p-6 shadow-soft hover:shadow-soft-lg transition-all duration-300 rounded-lg`}
      >
        <div className="flex items-start justify-between mb-4">
          <div
            className={`w-12 h-12 rounded-2xl bg-gradient-to-br ${color} flex items-center justify-center shadow-soft`}
          >
            <Icon className="w-6 h-6 text-white" />
          </div>
        </div>
        <div>
          <div className="text-3xl font-light text-foreground tracking-tight mb-1">{value}</div>
          <div className="text-sm text-foreground/60 font-light">{title}</div>
        </div>
      </div>
    </motion.div>
  );
}
