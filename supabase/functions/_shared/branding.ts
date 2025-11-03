import { createClient } from 'npm:@supabase/supabase-js@2';

export interface BrandingInfo {
  clinic_name: string;
  email: string | null;
  phone: string | null;
  address: string | null;
  logo_url: string | null;
  website: string | null;
}

export async function getOrganizationBranding(ownerId: string): Promise<BrandingInfo> {
  const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
  const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
  const supabase = createClient(supabaseUrl, supabaseKey);

  const { data, error } = await supabase.rpc('get_organization_branding', {
    p_owner_id: ownerId
  });

  if (error) {
    console.error('Error fetching branding:', error);
    return {
      clinic_name: 'Votre Clinique',
      email: null,
      phone: null,
      address: null,
      logo_url: null,
      website: null,
    };
  }

  return data as BrandingInfo;
}

export function getFromEmail(clinicName: string, domain?: string): string {
  const resendDomain = domain || Deno.env.get("RESEND_DOMAIN") || "janiechiro.com";
  return `${clinicName} <noreply@${resendDomain}>`;
}

export function getEmailFooter(clinicName: string, clinicEmail?: string | null, clinicPhone?: string | null): string {
  const currentYear = new Date().getFullYear();

  let contactInfo = '';
  if (clinicEmail || clinicPhone) {
    contactInfo = '<p style="margin: 10px 0 0 0;">';
    if (clinicEmail) contactInfo += `Email: ${clinicEmail}`;
    if (clinicEmail && clinicPhone) contactInfo += ' | ';
    if (clinicPhone) contactInfo += `Tél: ${clinicPhone}`;
    contactInfo += '</p>';
  }

  return `
    <div style="margin-top: 40px; padding-top: 20px; border-top: 1px solid #e5e7eb; text-align: center; font-size: 14px; color: #6b7280;">
      <p style="margin: 0;">Ceci est un message automatisé de votre clinique.</p>
      ${contactInfo}
      <p style="margin: 10px 0 0 0;">© ${currentYear} ${clinicName} - Tous droits réservés</p>
    </div>
  `;
}

export function getSMSMessage(clinicName: string, messageBody: string): string {
  return `${clinicName}: ${messageBody}`;
}

export function getVoiceMessage(clinicName: string, messageBody: string, language: string = 'fr'): string {
  if (language === 'en') {
    return `Hello, this is ${clinicName}. ${messageBody}`;
  }
  return `Bonjour, c'est ${clinicName}. ${messageBody}`;
}
