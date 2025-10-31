import React, { createContext, useContext, useEffect, useState } from 'react';
import { OrganizationService, Organization } from '../lib/saas/organizationService';
import { supabase } from '../lib/supabase';

interface OrganizationContextType {
  organization: Organization | null;
  loading: boolean;
  refreshOrganization: () => Promise<void>;
  hasFeature: (featureName: string) => boolean;
  canPerformAction: (resource: string, action: string) => boolean;
}

const OrganizationContext = createContext<OrganizationContextType | undefined>(undefined);

export const OrganizationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [organization, setOrganization] = useState<Organization | null>(null);
  const [loading, setLoading] = useState(true);

  const loadOrganization = async () => {
    try {
      setLoading(true);
      const org = await OrganizationService.getCurrentOrganization();
      setOrganization(org);
    } catch (error) {
      console.error('Failed to load organization:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadOrganization();

    const { data: authListener } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'SIGNED_IN') {
        loadOrganization();
      } else if (event === 'SIGNED_OUT') {
        setOrganization(null);
      }
    });

    return () => {
      authListener.subscription.unsubscribe();
    };
  }, []);

  const hasFeature = (featureName: string): boolean => {
    if (!organization) return false;
    return organization.features_enabled[featureName] === true;
  };

  const canPerformAction = (resource: string, action: string): boolean => {
    if (!organization) return false;
    return true;
  };

  return (
    <OrganizationContext.Provider
      value={{
        organization,
        loading,
        refreshOrganization: loadOrganization,
        hasFeature,
        canPerformAction,
      }}
    >
      {children}
    </OrganizationContext.Provider>
  );
};

export const useOrganization = () => {
  const context = useContext(OrganizationContext);
  if (context === undefined) {
    throw new Error('useOrganization must be used within an OrganizationProvider');
  }
  return context;
};
