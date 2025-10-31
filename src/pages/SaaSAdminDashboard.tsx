import React, { useState, useEffect } from 'react';
import {
  Building2,
  Users,
  CreditCard,
  TrendingUp,
  AlertCircle,
  CheckCircle,
  Clock,
  DollarSign,
} from 'lucide-react';
import { supabase } from '../lib/supabase';

interface PlatformStats {
  totalOrganizations: number;
  activeOrganizations: number;
  trialingOrganizations: number;
  totalUsers: number;
  totalRevenue: number;
  monthlyRecurringRevenue: number;
  churnRate: number;
}

const SaaSAdminDashboard: React.FC = () => {
  const [stats, setStats] = useState<PlatformStats>({
    totalOrganizations: 0,
    activeOrganizations: 0,
    trialingOrganizations: 0,
    totalUsers: 0,
    totalRevenue: 0,
    monthlyRecurringRevenue: 0,
    churnRate: 0,
  });
  const [organizations, setOrganizations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      const { data: orgs } = await supabase
        .from('organizations')
        .select('*')
        .order('created_at', { ascending: false });

      const { data: members } = await supabase
        .from('organization_members')
        .select('id');

      const { data: subscriptions } = await supabase
        .from('organization_subscriptions')
        .select(`
          *,
          subscription_plans (price_monthly)
        `);

      const activeOrgs = orgs?.filter((o) => o.subscription_status === 'active').length || 0;
      const trialingOrgs = orgs?.filter((o) => o.subscription_status === 'trialing').length || 0;

      const mrr = subscriptions?.reduce((acc: number, sub: any) => {
        if (sub.status === 'active' && sub.subscription_plans) {
          return acc + Number(sub.subscription_plans.price_monthly);
        }
        return acc;
      }, 0) || 0;

      setStats({
        totalOrganizations: orgs?.length || 0,
        activeOrganizations: activeOrgs,
        trialingOrganizations: trialingOrgs,
        totalUsers: members?.length || 0,
        totalRevenue: mrr * 12,
        monthlyRecurringRevenue: mrr,
        churnRate: 0,
      });

      setOrganizations(orgs || []);
    } catch (error) {
      console.error('Failed to load dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-gray-600">Loading platform metrics...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">SaaS Platform Dashboard</h1>
          <p className="text-gray-600 mt-2">Monitor and manage the ChiroFlow platform</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <StatCard
            title="Total Organizations"
            value={stats.totalOrganizations}
            icon={<Building2 className="w-6 h-6" />}
            color="blue"
          />
          <StatCard
            title="Active Subscriptions"
            value={stats.activeOrganizations}
            icon={<CheckCircle className="w-6 h-6" />}
            color="green"
          />
          <StatCard
            title="Trials"
            value={stats.trialingOrganizations}
            icon={<Clock className="w-6 h-6" />}
            color="yellow"
          />
          <StatCard
            title="Total Users"
            value={stats.totalUsers}
            icon={<Users className="w-6 h-6" />}
            color="purple"
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          <RevenueCard
            title="Monthly Recurring Revenue"
            value={stats.monthlyRecurringRevenue}
            icon={<TrendingUp className="w-6 h-6" />}
          />
          <RevenueCard
            title="Annual Run Rate"
            value={stats.totalRevenue}
            icon={<DollarSign className="w-6 h-6" />}
          />
          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-medium text-gray-600">Churn Rate</h3>
              <AlertCircle className="w-6 h-6 text-orange-500" />
            </div>
            <p className="text-3xl font-bold text-gray-900">
              {stats.churnRate.toFixed(1)}%
            </p>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">Organizations</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Name
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Tier
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Created
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Trial Ends
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {organizations.map((org) => (
                  <tr key={org.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="font-medium text-gray-900">{org.name}</div>
                      <div className="text-sm text-gray-500">{org.slug}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <StatusBadge status={org.subscription_status} />
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="text-sm font-medium text-gray-900">
                        {org.subscription_tier}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {new Date(org.created_at).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {org.trial_ends_at
                        ? new Date(org.trial_ends_at).toLocaleDateString()
                        : 'N/A'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

const StatCard: React.FC<{
  title: string;
  value: number;
  icon: React.ReactNode;
  color: string;
}> = ({ title, value, icon, color }) => {
  const colorClasses = {
    blue: 'bg-blue-50 text-blue-600',
    green: 'bg-green-50 text-green-600',
    yellow: 'bg-yellow-50 text-yellow-600',
    purple: 'bg-purple-50 text-purple-600',
  };

  return (
    <div className="bg-white rounded-lg shadow-sm p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-medium text-gray-600">{title}</h3>
        <div className={`p-2 rounded-lg ${colorClasses[color as keyof typeof colorClasses]}`}>
          {icon}
        </div>
      </div>
      <p className="text-3xl font-bold text-gray-900">{value.toLocaleString()}</p>
    </div>
  );
};

const RevenueCard: React.FC<{
  title: string;
  value: number;
  icon: React.ReactNode;
}> = ({ title, value, icon }) => {
  return (
    <div className="bg-white rounded-lg shadow-sm p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-medium text-gray-600">{title}</h3>
        <div className="p-2 rounded-lg bg-emerald-50 text-emerald-600">{icon}</div>
      </div>
      <p className="text-3xl font-bold text-gray-900">
        ${value.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
      </p>
    </div>
  );
};

const StatusBadge: React.FC<{ status: string }> = ({ status }) => {
  const statusConfig = {
    active: { bg: 'bg-green-100', text: 'text-green-800', label: 'Active' },
    trialing: { bg: 'bg-blue-100', text: 'text-blue-800', label: 'Trial' },
    past_due: { bg: 'bg-yellow-100', text: 'text-yellow-800', label: 'Past Due' },
    cancelled: { bg: 'bg-red-100', text: 'text-red-800', label: 'Cancelled' },
  };

  const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.active;

  return (
    <span
      className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${config.bg} ${config.text}`}
    >
      {config.label}
    </span>
  );
};

export default SaaSAdminDashboard;
