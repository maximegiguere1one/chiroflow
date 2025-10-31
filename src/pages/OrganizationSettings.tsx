import React, { useState, useEffect } from 'react';
import {
  Building2,
  Users,
  CreditCard,
  Key,
  Settings,
  Save,
  UserPlus,
  Trash2,
  Copy,
  Check,
} from 'lucide-react';
import { useOrganization } from '../contexts/OrganizationContext';
import { OrganizationService, OrganizationMember } from '../lib/saas/organizationService';
import { APIKeyService } from '../lib/saas/apiKeyService';

type TabType = 'general' | 'members' | 'billing' | 'api-keys';

const OrganizationSettings: React.FC = () => {
  const { organization, refreshOrganization } = useOrganization();
  const [activeTab, setActiveTab] = useState<TabType>('general');
  const [saving, setSaving] = useState(false);

  if (!organization) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-gray-600">Loading organization settings...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Organization Settings</h1>
          <p className="text-gray-600 mt-2">{organization.name}</p>
        </div>

        <div className="bg-white shadow rounded-lg overflow-hidden">
          <div className="border-b border-gray-200">
            <nav className="flex -mb-px">
              <TabButton
                icon={<Building2 className="w-5 h-5" />}
                label="General"
                active={activeTab === 'general'}
                onClick={() => setActiveTab('general')}
              />
              <TabButton
                icon={<Users className="w-5 h-5" />}
                label="Members"
                active={activeTab === 'members'}
                onClick={() => setActiveTab('members')}
              />
              <TabButton
                icon={<CreditCard className="w-5 h-5" />}
                label="Billing"
                active={activeTab === 'billing'}
                onClick={() => setActiveTab('billing')}
              />
              <TabButton
                icon={<Key className="w-5 h-5" />}
                label="API Keys"
                active={activeTab === 'api-keys'}
                onClick={() => setActiveTab('api-keys')}
              />
            </nav>
          </div>

          <div className="p-6">
            {activeTab === 'general' && <GeneralTab organization={organization} onSave={refreshOrganization} />}
            {activeTab === 'members' && <MembersTab organizationId={organization.id} />}
            {activeTab === 'billing' && <BillingTab organization={organization} />}
            {activeTab === 'api-keys' && <APIKeysTab organizationId={organization.id} />}
          </div>
        </div>
      </div>
    </div>
  );
};

const TabButton: React.FC<{
  icon: React.ReactNode;
  label: string;
  active: boolean;
  onClick: () => void;
}> = ({ icon, label, active, onClick }) => (
  <button
    onClick={onClick}
    className={`
      flex items-center gap-2 px-6 py-4 border-b-2 font-medium text-sm transition-colors
      ${
        active
          ? 'border-blue-500 text-blue-600'
          : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
      }
    `}
  >
    {icon}
    {label}
  </button>
);

const GeneralTab: React.FC<{
  organization: any;
  onSave: () => void;
}> = ({ organization, onSave }) => {
  const [formData, setFormData] = useState({
    name: organization.name,
    email: organization.email || '',
    phone: organization.phone || '',
    address: organization.address || '',
    timezone: organization.timezone || 'America/Toronto',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await OrganizationService.updateOrganization(organization.id, formData);
      onSave();
      alert('Organization updated successfully!');
    } catch (error) {
      console.error('Failed to update organization:', error);
      alert('Failed to update organization');
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Organization Name
        </label>
        <input
          type="text"
          value={formData.name}
          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          required
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
        <input
          type="email"
          value={formData.email}
          onChange={(e) => setFormData({ ...formData, email: e.target.value })}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">Phone</label>
        <input
          type="tel"
          value={formData.phone}
          onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">Address</label>
        <textarea
          value={formData.address}
          onChange={(e) => setFormData({ ...formData, address: e.target.value })}
          rows={3}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">Timezone</label>
        <select
          value={formData.timezone}
          onChange={(e) => setFormData({ ...formData, timezone: e.target.value })}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        >
          <option value="America/Toronto">Eastern Time</option>
          <option value="America/New_York">Eastern Time (US)</option>
          <option value="America/Chicago">Central Time</option>
          <option value="America/Denver">Mountain Time</option>
          <option value="America/Los_Angeles">Pacific Time</option>
        </select>
      </div>

      <div className="flex justify-end">
        <button
          type="submit"
          className="flex items-center gap-2 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          <Save className="w-4 h-4" />
          Save Changes
        </button>
      </div>
    </form>
  );
};

const MembersTab: React.FC<{ organizationId: string }> = ({ organizationId }) => {
  const [members, setMembers] = useState<OrganizationMember[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadMembers();
  }, [organizationId]);

  const loadMembers = async () => {
    try {
      const data = await OrganizationService.getOrganizationMembers(organizationId);
      setMembers(data);
    } catch (error) {
      console.error('Failed to load members:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="text-gray-600">Loading members...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold text-gray-900">Team Members</h3>
        <button className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
          <UserPlus className="w-4 h-4" />
          Invite Member
        </button>
      </div>

      <div className="border border-gray-200 rounded-lg overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                User
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Role
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Status
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Joined
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {members.map((member) => (
              <tr key={member.id}>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm font-medium text-gray-900">{member.user_id}</div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className="px-2 py-1 text-xs font-medium rounded-full bg-blue-100 text-blue-800">
                    {member.role}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span
                    className={`px-2 py-1 text-xs font-medium rounded-full ${
                      member.status === 'active'
                        ? 'bg-green-100 text-green-800'
                        : 'bg-gray-100 text-gray-800'
                    }`}
                  >
                    {member.status}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {member.joined_at
                    ? new Date(member.joined_at).toLocaleDateString()
                    : 'Pending'}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                  {member.role !== 'owner' && (
                    <button className="text-red-600 hover:text-red-900">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

const BillingTab: React.FC<{ organization: any }> = ({ organization }) => {
  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Current Plan</h3>
        <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-lg p-6 border border-blue-200">
          <div className="flex items-center justify-between">
            <div>
              <h4 className="text-xl font-bold text-gray-900 capitalize">
                {organization.subscription_tier}
              </h4>
              <p className="text-gray-600 mt-1">
                Status: <span className="font-medium">{organization.subscription_status}</span>
              </p>
            </div>
            <button className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
              Upgrade Plan
            </button>
          </div>
        </div>
      </div>

      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Usage Limits</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <UsageMeter
            label="Users"
            current={5}
            limit={organization.max_users}
            unit="users"
          />
          <UsageMeter
            label="Patients"
            current={250}
            limit={organization.max_patients}
            unit="patients"
          />
          <UsageMeter
            label="Appointments"
            current={450}
            limit={organization.max_appointments_per_month}
            unit="this month"
          />
        </div>
      </div>
    </div>
  );
};

const UsageMeter: React.FC<{
  label: string;
  current: number;
  limit: number;
  unit: string;
}> = ({ label, current, limit, unit }) => {
  const percentage = (current / limit) * 100;

  return (
    <div className="border border-gray-200 rounded-lg p-4">
      <h4 className="text-sm font-medium text-gray-700 mb-2">{label}</h4>
      <div className="mb-2">
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div
            className="bg-blue-600 h-2 rounded-full transition-all"
            style={{ width: `${Math.min(percentage, 100)}%` }}
          />
        </div>
      </div>
      <p className="text-sm text-gray-600">
        {current.toLocaleString()} / {limit.toLocaleString()} {unit}
      </p>
    </div>
  );
};

const APIKeysTab: React.FC<{ organizationId: string }> = ({ organizationId }) => {
  const [apiKeys, setApiKeys] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [newKey, setNewKey] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    loadAPIKeys();
  }, [organizationId]);

  const loadAPIKeys = async () => {
    try {
      const keys = await APIKeyService.listAPIKeys(organizationId);
      setApiKeys(keys);
    } catch (error) {
      console.error('Failed to load API keys:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateKey = async () => {
    try {
      const { apiKey, plainKey } = await APIKeyService.createAPIKey(
        organizationId,
        'New API Key',
        ['read', 'write']
      );
      setNewKey(plainKey);
      setApiKeys([apiKey, ...apiKeys]);
    } catch (error) {
      console.error('Failed to create API key:', error);
    }
  };

  const copyToClipboard = () => {
    if (newKey) {
      navigator.clipboard.writeText(newKey);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold text-gray-900">API Keys</h3>
        <button
          onClick={handleCreateKey}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          Generate New Key
        </button>
      </div>

      {newKey && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <p className="text-sm text-yellow-800 mb-2 font-medium">
            Save this key now! You won't be able to see it again.
          </p>
          <div className="flex items-center gap-2">
            <code className="flex-1 bg-white px-4 py-2 rounded border border-yellow-300 text-sm font-mono">
              {newKey}
            </code>
            <button
              onClick={copyToClipboard}
              className="p-2 bg-white border border-yellow-300 rounded hover:bg-yellow-50 transition-colors"
            >
              {copied ? <Check className="w-4 h-4 text-green-600" /> : <Copy className="w-4 h-4" />}
            </button>
          </div>
        </div>
      )}

      <div className="border border-gray-200 rounded-lg overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Name
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Key
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Last Used
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {apiKeys.map((key) => (
              <tr key={key.id}>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                  {key.name}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <code className="text-sm text-gray-600">
                    {key.key_prefix}...{key.last_four}
                  </code>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {key.last_used_at
                    ? new Date(key.last_used_at).toLocaleDateString()
                    : 'Never'}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                  <button
                    onClick={() => APIKeyService.revokeAPIKey(key.id)}
                    className="text-red-600 hover:text-red-900"
                  >
                    Revoke
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default OrganizationSettings;
