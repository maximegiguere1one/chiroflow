import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Building2,
  Users,
  Calendar,
  CreditCard,
  CheckCircle,
  ArrowRight,
  ArrowLeft,
} from 'lucide-react';
import { OrganizationService } from '../lib/saas/organizationService';
import { supabase } from '../lib/supabase';

type Step = 'organization' | 'team' | 'preferences' | 'plan' | 'complete';

interface OnboardingData {
  organizationName: string;
  slug: string;
  email: string;
  phone: string;
  timezone: string;
  teamMembers: Array<{ email: string; role: string }>;
  clinicType: string;
  appointmentDuration: number;
  selectedPlan: string;
}

const OnboardingFlow: React.FC = () => {
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState<Step>('organization');
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<OnboardingData>({
    organizationName: '',
    slug: '',
    email: '',
    phone: '',
    timezone: 'America/Toronto',
    teamMembers: [],
    clinicType: 'chiropractic',
    appointmentDuration: 30,
    selectedPlan: 'professional',
  });

  const steps: Step[] = ['organization', 'team', 'preferences', 'plan', 'complete'];
  const currentStepIndex = steps.indexOf(currentStep);
  const progress = ((currentStepIndex + 1) / steps.length) * 100;

  const handleNext = () => {
    const nextIndex = currentStepIndex + 1;
    if (nextIndex < steps.length) {
      setCurrentStep(steps[nextIndex]);
    }
  };

  const handleBack = () => {
    const prevIndex = currentStepIndex - 1;
    if (prevIndex >= 0) {
      setCurrentStep(steps[prevIndex]);
    }
  };

  const handleComplete = async () => {
    setLoading(true);
    try {
      const org = await OrganizationService.createOrganization({
        name: data.organizationName,
        slug: data.slug,
        email: data.email,
        phone: data.phone,
        timezone: data.timezone,
      });

      if (!org) throw new Error('Failed to create organization');

      for (const member of data.teamMembers) {
        await OrganizationService.inviteMember(
          org.id,
          member.email,
          member.role as any
        );
      }

      navigate('/admin/dashboard');
    } catch (error) {
      console.error('Onboarding failed:', error);
      alert('Failed to complete onboarding. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const generateSlug = (name: string) => {
    return name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto">
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-3xl font-bold text-gray-900">Welcome to ChiroFlow</h1>
            <span className="text-sm font-medium text-gray-600">
              Step {currentStepIndex + 1} of {steps.length}
            </span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className="bg-blue-600 h-2 rounded-full transition-all duration-300"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-xl p-8">
          {currentStep === 'organization' && (
            <OrganizationStep
              data={data}
              onChange={(updates) => setData({ ...data, ...updates })}
              onGenerateSlug={(name) =>
                setData({ ...data, slug: generateSlug(name) })
              }
            />
          )}

          {currentStep === 'team' && (
            <TeamStep
              data={data}
              onChange={(updates) => setData({ ...data, ...updates })}
            />
          )}

          {currentStep === 'preferences' && (
            <PreferencesStep
              data={data}
              onChange={(updates) => setData({ ...data, ...updates })}
            />
          )}

          {currentStep === 'plan' && (
            <PlanStep
              data={data}
              onChange={(updates) => setData({ ...data, ...updates })}
            />
          )}

          {currentStep === 'complete' && (
            <CompleteStep
              onComplete={handleComplete}
              loading={loading}
            />
          )}

          <div className="mt-8 flex justify-between">
            {currentStepIndex > 0 && currentStep !== 'complete' && (
              <button
                onClick={handleBack}
                className="flex items-center gap-2 px-6 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                <ArrowLeft className="w-4 h-4" />
                Back
              </button>
            )}

            {currentStep !== 'complete' && (
              <button
                onClick={handleNext}
                className="ml-auto flex items-center gap-2 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Next
                <ArrowRight className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

const OrganizationStep: React.FC<{
  data: OnboardingData;
  onChange: (updates: Partial<OnboardingData>) => void;
  onGenerateSlug: (name: string) => void;
}> = ({ data, onChange, onGenerateSlug }) => (
  <div>
    <div className="flex items-center gap-3 mb-6">
      <div className="p-3 bg-blue-100 rounded-lg">
        <Building2 className="w-6 h-6 text-blue-600" />
      </div>
      <div>
        <h2 className="text-2xl font-bold text-gray-900">Organization Details</h2>
        <p className="text-gray-600">Tell us about your practice</p>
      </div>
    </div>

    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Practice Name *
        </label>
        <input
          type="text"
          value={data.organizationName}
          onChange={(e) => {
            onChange({ organizationName: e.target.value });
            onGenerateSlug(e.target.value);
          }}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          placeholder="Acme Chiropractic Clinic"
          required
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          URL Slug *
        </label>
        <div className="flex items-center gap-2">
          <span className="text-gray-500">app.chiroflow.com/</span>
          <input
            type="text"
            value={data.slug}
            onChange={(e) => onChange({ slug: e.target.value })}
            className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="acme-chiropractic"
            required
          />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Email *
        </label>
        <input
          type="email"
          value={data.email}
          onChange={(e) => onChange({ email: e.target.value })}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          placeholder="contact@clinic.com"
          required
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Phone
        </label>
        <input
          type="tel"
          value={data.phone}
          onChange={(e) => onChange({ phone: e.target.value })}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          placeholder="+1 (555) 123-4567"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Timezone
        </label>
        <select
          value={data.timezone}
          onChange={(e) => onChange({ timezone: e.target.value })}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        >
          <option value="America/Toronto">Eastern Time</option>
          <option value="America/New_York">Eastern Time (US)</option>
          <option value="America/Chicago">Central Time</option>
          <option value="America/Denver">Mountain Time</option>
          <option value="America/Los_Angeles">Pacific Time</option>
        </select>
      </div>
    </div>
  </div>
);

const TeamStep: React.FC<{
  data: OnboardingData;
  onChange: (updates: Partial<OnboardingData>) => void;
}> = ({ data, onChange }) => (
  <div>
    <div className="flex items-center gap-3 mb-6">
      <div className="p-3 bg-blue-100 rounded-lg">
        <Users className="w-6 h-6 text-blue-600" />
      </div>
      <div>
        <h2 className="text-2xl font-bold text-gray-900">Invite Your Team</h2>
        <p className="text-gray-600">Add team members to collaborate (optional)</p>
      </div>
    </div>

    <p className="text-sm text-gray-600 mb-4">
      You can skip this step and invite team members later from settings.
    </p>
  </div>
);

const PreferencesStep: React.FC<{
  data: OnboardingData;
  onChange: (updates: Partial<OnboardingData>) => void;
}> = ({ data, onChange }) => (
  <div>
    <div className="flex items-center gap-3 mb-6">
      <div className="p-3 bg-blue-100 rounded-lg">
        <Calendar className="w-6 h-6 text-blue-600" />
      </div>
      <div>
        <h2 className="text-2xl font-bold text-gray-900">Practice Preferences</h2>
        <p className="text-gray-600">Configure your scheduling settings</p>
      </div>
    </div>

    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Default Appointment Duration
        </label>
        <select
          value={data.appointmentDuration}
          onChange={(e) =>
            onChange({ appointmentDuration: parseInt(e.target.value) })
          }
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        >
          <option value={15}>15 minutes</option>
          <option value={30}>30 minutes</option>
          <option value={45}>45 minutes</option>
          <option value={60}>60 minutes</option>
        </select>
      </div>
    </div>
  </div>
);

const PlanStep: React.FC<{
  data: OnboardingData;
  onChange: (updates: Partial<OnboardingData>) => void;
}> = ({ data, onChange }) => (
  <div>
    <div className="flex items-center gap-3 mb-6">
      <div className="p-3 bg-blue-100 rounded-lg">
        <CreditCard className="w-6 h-6 text-blue-600" />
      </div>
      <div>
        <h2 className="text-2xl font-bold text-gray-900">Choose Your Plan</h2>
        <p className="text-gray-600">Start with a 14-day free trial</p>
      </div>
    </div>

    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      {['starter', 'professional', 'enterprise'].map((plan) => (
        <button
          key={plan}
          onClick={() => onChange({ selectedPlan: plan })}
          className={`p-6 border-2 rounded-lg transition-all ${
            data.selectedPlan === plan
              ? 'border-blue-600 bg-blue-50'
              : 'border-gray-200 hover:border-gray-300'
          }`}
        >
          <h3 className="text-lg font-bold text-gray-900 capitalize mb-2">
            {plan}
          </h3>
          <p className="text-gray-600 text-sm">
            {plan === 'starter' && '2 users, 100 patients'}
            {plan === 'professional' && '10 users, 1000 patients'}
            {plan === 'enterprise' && 'Unlimited'}
          </p>
        </button>
      ))}
    </div>
  </div>
);

const CompleteStep: React.FC<{
  onComplete: () => void;
  loading: boolean;
}> = ({ onComplete, loading }) => (
  <div className="text-center py-8">
    <div className="flex justify-center mb-6">
      <div className="p-4 bg-green-100 rounded-full">
        <CheckCircle className="w-16 h-16 text-green-600" />
      </div>
    </div>

    <h2 className="text-3xl font-bold text-gray-900 mb-4">
      You're All Set!
    </h2>
    <p className="text-gray-600 mb-8">
      Your practice is ready to go. Click below to start managing your patients.
    </p>

    <button
      onClick={onComplete}
      disabled={loading}
      className="px-8 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
    >
      {loading ? 'Setting up...' : 'Go to Dashboard'}
    </button>
  </div>
);

export default OnboardingFlow;
