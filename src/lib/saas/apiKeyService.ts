import { supabase } from '../supabase';
import { createHash, randomBytes } from 'crypto';

export interface APIKey {
  id: string;
  organization_id: string;
  name: string;
  key_prefix: string;
  last_four: string;
  scopes: string[];
  rate_limit_per_hour: number;
  is_active: boolean;
  last_used_at: string | null;
  expires_at: string | null;
  created_by: string;
  created_at: string;
  revoked_at: string | null;
  revoked_by: string | null;
}

export class APIKeyService {
  private static generateKey(): { key: string; prefix: string; hash: string; lastFour: string } {
    const randomPart = randomBytes(32).toString('base64url');
    const key = `cf_${randomPart}`;
    const hash = createHash('sha256').update(key).digest('hex');
    const prefix = key.substring(0, 10);
    const lastFour = key.slice(-4);

    return { key, prefix, hash, lastFour };
  }

  static async createAPIKey(
    orgId: string,
    name: string,
    scopes: string[] = [],
    expiresInDays?: number
  ): Promise<{ apiKey: APIKey; plainKey: string }> {
    const { key, prefix, hash, lastFour } = this.generateKey();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    const expiresAt = expiresInDays
      ? new Date(Date.now() + expiresInDays * 24 * 60 * 60 * 1000).toISOString()
      : null;

    const { data, error } = await supabase
      .from('api_keys')
      .insert({
        organization_id: orgId,
        name,
        key_prefix: prefix,
        key_hash: hash,
        last_four: lastFour,
        scopes,
        expires_at: expiresAt,
        created_by: user.id,
      })
      .select()
      .single();

    if (error) throw error;

    return {
      apiKey: data,
      plainKey: key,
    };
  }

  static async listAPIKeys(orgId: string): Promise<APIKey[]> {
    const { data, error } = await supabase
      .from('api_keys')
      .select('*')
      .eq('organization_id', orgId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  }

  static async revokeAPIKey(keyId: string): Promise<void> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    const { error } = await supabase
      .from('api_keys')
      .update({
        is_active: false,
        revoked_at: new Date().toISOString(),
        revoked_by: user.id,
      })
      .eq('id', keyId);

    if (error) throw error;
  }

  static async updateAPIKey(
    keyId: string,
    updates: { name?: string; scopes?: string[]; rate_limit_per_hour?: number }
  ): Promise<void> {
    const { error } = await supabase
      .from('api_keys')
      .update(updates)
      .eq('id', keyId);

    if (error) throw error;
  }

  static async validateAPIKey(key: string): Promise<APIKey | null> {
    const hash = createHash('sha256').update(key).digest('hex');

    const { data, error } = await supabase
      .from('api_keys')
      .select('*')
      .eq('key_hash', hash)
      .eq('is_active', true)
      .single();

    if (error || !data) return null;

    if (data.expires_at && new Date(data.expires_at) < new Date()) {
      return null;
    }

    await supabase
      .from('api_keys')
      .update({ last_used_at: new Date().toISOString() })
      .eq('id', data.id);

    return data;
  }
}
