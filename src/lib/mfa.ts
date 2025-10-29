import { supabase } from './supabase';

export interface MFASetupData {
  secret: string;
  qrCodeUrl: string;
  backupCodes: string[];
}

export interface MFAStatus {
  isEnabled: boolean;
  isVerified: boolean;
  method: 'totp' | 'sms' | 'email';
  lastUsedAt: string | null;
}

export async function initiateMFASetup(): Promise<MFASetupData> {
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    throw new Error('User not authenticated');
  }

  const secret = generateTOTPSecret();
  const email = user.email || '';
  const qrCodeUrl = generateQRCodeUrl(email, secret);
  const backupCodes = await generateBackupCodes();

  console.log('[initiateMFASetup] Saving secret for user:', user.id);
  console.log('[initiateMFASetup] Secret:', secret);

  // Check if record exists
  const { data: existing } = await supabase
    .from('user_2fa_settings')
    .select('id')
    .eq('user_id', user.id)
    .maybeSingle();

  if (existing) {
    console.log('[initiateMFASetup] Updating existing record');
    // Update existing record
    const { error: updateError } = await supabase
      .from('user_2fa_settings')
      .update({
        totp_secret: secret,
        backup_codes: backupCodes.map(code => hashBackupCode(code)),
        is_enabled: false,
        method: 'totp'
      })
      .eq('user_id', user.id);

    if (updateError) {
      console.error('[initiateMFASetup] Update error:', updateError);
      throw new Error('Failed to update MFA settings: ' + updateError.message);
    }
  } else {
    console.log('[initiateMFASetup] Creating new record');
    // Insert new record
    const { error: insertError } = await supabase
      .from('user_2fa_settings')
      .insert({
        user_id: user.id,
        totp_secret: secret,
        backup_codes: backupCodes.map(code => hashBackupCode(code)),
        is_enabled: false,
        method: 'totp'
      });

    if (insertError) {
      console.error('[initiateMFASetup] Insert error:', insertError);
      throw new Error('Failed to create MFA settings: ' + insertError.message);
    }
  }

  console.log('[initiateMFASetup] ✅ Secret saved successfully');

  return {
    secret,
    qrCodeUrl,
    backupCodes
  };
}

export async function verifyAndEnableMFA(token: string): Promise<boolean> {
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    throw new Error('User not authenticated');
  }

  console.log('[verifyAndEnableMFA] Fetching settings for user:', user.id);

  const { data: settings, error: fetchError } = await supabase
    .from('user_2fa_settings')
    .select('totp_secret')
    .eq('user_id', user.id)
    .single();

  if (fetchError) {
    console.error('[verifyAndEnableMFA] Error fetching settings:', fetchError);
    throw new Error('Failed to fetch MFA settings: ' + fetchError.message);
  }

  console.log('[verifyAndEnableMFA] Settings found:', {
    hasSecret: !!settings?.totp_secret,
    secretLength: settings?.totp_secret?.length || 0
  });

  if (!settings?.totp_secret) {
    throw new Error('MFA not initiated');
  }

  const isValid = verifyTOTPToken(settings.totp_secret, token);

  if (!isValid) {
    console.log('[verifyAndEnableMFA] ❌ Token validation failed');
    await recordMFAAttempt(user.id, 'totp', false, 'Invalid token');
    return false;
  }

  console.log('[verifyAndEnableMFA] ✅ Token valid, enabling MFA');

  const { error: updateError } = await supabase
    .from('user_2fa_settings')
    .update({
      is_enabled: true,
      verified_at: new Date().toISOString()
    })
    .eq('user_id', user.id);

  if (updateError) {
    console.error('[verifyAndEnableMFA] Error updating settings:', updateError);
    throw new Error('Failed to enable MFA: ' + updateError.message);
  }

  await recordMFAAttempt(user.id, 'totp', true);

  return true;
}

export async function verifyMFAToken(token: string): Promise<boolean> {
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    throw new Error('User not authenticated');
  }

  const { data: rateLimitCheck } = await supabase
    .rpc('check_2fa_failed_attempts', { p_user_id: user.id });

  if (rateLimitCheck?.is_locked) {
    throw new Error(`Too many failed attempts. Please try again in ${rateLimitCheck.window_minutes} minutes.`);
  }

  const { data: settings } = await supabase
    .from('user_2fa_settings')
    .select('totp_secret, backup_codes')
    .eq('user_id', user.id)
    .single();

  if (!settings) {
    throw new Error('MFA not setup');
  }

  const isTOTPValid = verifyTOTPToken(settings.totp_secret, token);

  if (isTOTPValid) {
    await recordMFAAttempt(user.id, 'totp', true);
    return true;
  }

  const isBackupCode = await verifyBackupCode(user.id, token, settings.backup_codes);

  if (isBackupCode) {
    await recordMFAAttempt(user.id, 'backup_code', true);
    return true;
  }

  await recordMFAAttempt(user.id, 'totp', false, 'Invalid token or backup code');
  return false;
}

export async function getMFAStatus(): Promise<MFAStatus | null> {
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return null;
  }

  const { data: settings } = await supabase
    .from('user_2fa_settings')
    .select('is_enabled, verified_at, method, last_used_at')
    .eq('user_id', user.id)
    .single();

  if (!settings) {
    return null;
  }

  return {
    isEnabled: settings.is_enabled,
    isVerified: settings.verified_at !== null,
    method: settings.method as 'totp' | 'sms' | 'email',
    lastUsedAt: settings.last_used_at
  };
}

export async function disableMFA(): Promise<void> {
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    throw new Error('User not authenticated');
  }

  await supabase
    .from('user_2fa_settings')
    .update({
      is_enabled: false,
      verified_at: null
    })
    .eq('user_id', user.id);
}

export async function regenerateBackupCodes(): Promise<string[]> {
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    throw new Error('User not authenticated');
  }

  const backupCodes = await generateBackupCodes();

  await supabase
    .from('user_2fa_settings')
    .update({
      backup_codes: backupCodes.map(code => hashBackupCode(code))
    })
    .eq('user_id', user.id);

  return backupCodes;
}

function generateTOTPSecret(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';
  let secret = '';
  const array = new Uint8Array(32);
  crypto.getRandomValues(array);

  for (let i = 0; i < 32; i++) {
    secret += chars[array[i] % chars.length];
  }

  return secret;
}

function generateQRCodeUrl(email: string, secret: string): string {
  const issuer = 'ChiroFlow';
  const label = `${issuer}:${email}`;
  const otpauthUrl = `otpauth://totp/${encodeURIComponent(label)}?secret=${secret}&issuer=${encodeURIComponent(issuer)}`;
  return `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(otpauthUrl)}`;
}

async function generateBackupCodes(): Promise<string[]> {
  const codes: string[] = [];
  for (let i = 0; i < 10; i++) {
    const array = new Uint8Array(4);
    crypto.getRandomValues(array);
    const code = Array.from(array)
      .map(b => b.toString(16).padStart(2, '0'))
      .join('')
      .toUpperCase();
    codes.push(code);
  }
  return codes;
}

function hashBackupCode(code: string): string {
  return `BACKUP_${code.toUpperCase()}`;
}

function verifyTOTPToken(secret: string, token: string): boolean {
  const window = 1;
  const timeStep = 30;
  const currentTime = Math.floor(Date.now() / 1000);

  console.log('[MFA] Verifying TOTP token:', {
    inputToken: token,
    currentTime,
    counter: Math.floor(currentTime / 30)
  });

  for (let i = -window; i <= window; i++) {
    const time = currentTime + (i * timeStep);
    const expectedToken = generateTOTPToken(secret, time);

    console.log(`[MFA] Window ${i}: Generated token = ${expectedToken}`);

    if (expectedToken === token) {
      console.log('[MFA] ✅ Token matched!');
      return true;
    }
  }

  console.log('[MFA] ❌ No token matched');
  return false;
}

function generateTOTPToken(secret: string, time: number): string {
  const counter = Math.floor(time / 30);
  const key = base32Decode(secret);
  const buffer = new ArrayBuffer(8);
  const view = new DataView(buffer);
  view.setBigUint64(0, BigInt(counter), false);

  const hmac = hmacSHA1(key, new Uint8Array(buffer));

  // Dynamic truncation per RFC 6238
  const offset = hmac[hmac.length - 1] & 0x0f;
  const code = (
    ((hmac[offset] & 0x7f) << 24) |
    ((hmac[offset + 1] & 0xff) << 16) |
    ((hmac[offset + 2] & 0xff) << 8) |
    (hmac[offset + 3] & 0xff)
  ) % 1000000;

  return code.toString().padStart(6, '0');
}

function base32Decode(base32: string): Uint8Array {
  const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';
  const cleanBase32 = base32.toUpperCase().replace(/=+$/, '');
  const bits: number[] = [];

  for (const char of cleanBase32) {
    const val = alphabet.indexOf(char);
    if (val === -1) continue;
    bits.push(...val.toString(2).padStart(5, '0').split('').map(Number));
  }

  const bytes: number[] = [];
  for (let i = 0; i + 8 <= bits.length; i += 8) {
    bytes.push(parseInt(bits.slice(i, i + 8).join(''), 2));
  }

  return new Uint8Array(bytes);
}

function hmacSHA1(key: Uint8Array, message: Uint8Array): Uint8Array {
  const blockSize = 64;
  const ipad = 0x36;
  const opad = 0x5c;

  if (key.length > blockSize) {
    key = sha1(key);
  }

  if (key.length < blockSize) {
    const paddedKey = new Uint8Array(blockSize);
    paddedKey.set(key);
    key = paddedKey;
  }

  const innerKey = key.map(b => b ^ ipad);
  const outerKey = key.map(b => b ^ opad);

  const innerHash = sha1(concat(innerKey, message));
  return sha1(concat(outerKey, innerHash));
}

function sha1(data: Uint8Array): Uint8Array {
  let h0 = 0x67452301;
  let h1 = 0xEFCDAB89;
  let h2 = 0x98BADCFE;
  let h3 = 0x10325476;
  let h4 = 0xC3D2E1F0;

  const ml = data.length * 8;
  const paddedLength = Math.ceil((ml + 65) / 512) * 512 / 8;
  const padded = new Uint8Array(paddedLength);
  padded.set(data);
  padded[data.length] = 0x80;

  const view = new DataView(padded.buffer);
  view.setBigUint64(paddedLength - 8, BigInt(ml), false);

  for (let offset = 0; offset < paddedLength; offset += 64) {
    const w = new Uint32Array(80);

    for (let i = 0; i < 16; i++) {
      w[i] = view.getUint32(offset + i * 4, false);
    }

    for (let i = 16; i < 80; i++) {
      w[i] = rotateLeft(w[i - 3] ^ w[i - 8] ^ w[i - 14] ^ w[i - 16], 1);
    }

    let a = h0, b = h1, c = h2, d = h3, e = h4;

    for (let i = 0; i < 80; i++) {
      let f, k;
      if (i < 20) {
        f = (b & c) | (~b & d);
        k = 0x5A827999;
      } else if (i < 40) {
        f = b ^ c ^ d;
        k = 0x6ED9EBA1;
      } else if (i < 60) {
        f = (b & c) | (b & d) | (c & d);
        k = 0x8F1BBCDC;
      } else {
        f = b ^ c ^ d;
        k = 0xCA62C1D6;
      }

      const temp = (rotateLeft(a, 5) + f + e + k + w[i]) >>> 0;
      e = d;
      d = c;
      c = rotateLeft(b, 30);
      b = a;
      a = temp;
    }

    h0 = (h0 + a) >>> 0;
    h1 = (h1 + b) >>> 0;
    h2 = (h2 + c) >>> 0;
    h3 = (h3 + d) >>> 0;
    h4 = (h4 + e) >>> 0;
  }

  const result = new Uint8Array(20);
  const resultView = new DataView(result.buffer);
  resultView.setUint32(0, h0, false);
  resultView.setUint32(4, h1, false);
  resultView.setUint32(8, h2, false);
  resultView.setUint32(12, h3, false);
  resultView.setUint32(16, h4, false);

  return result;
}

function rotateLeft(n: number, bits: number): number {
  return ((n << bits) | (n >>> (32 - bits))) >>> 0;
}

function concat(a: Uint8Array, b: Uint8Array): Uint8Array {
  const result = new Uint8Array(a.length + b.length);
  result.set(a, 0);
  result.set(b, a.length);
  return result;
}

async function verifyBackupCode(userId: string, code: string, hashedCodes: string[]): Promise<boolean> {
  const hashedInput = hashBackupCode(code);

  if (!hashedCodes.includes(hashedInput)) {
    return false;
  }

  const remainingCodes = hashedCodes.filter(c => c !== hashedInput);

  await supabase
    .from('user_2fa_settings')
    .update({ backup_codes: remainingCodes })
    .eq('user_id', userId);

  return true;
}

async function recordMFAAttempt(
  userId: string,
  attemptType: 'totp' | 'backup_code' | 'sms' | 'email',
  success: boolean,
  failureReason?: string
): Promise<void> {
  await supabase.from('user_2fa_attempts').insert({
    user_id: userId,
    attempt_type: attemptType,
    success,
    failure_reason: failureReason,
    ip_address: null,
    user_agent: navigator.userAgent
  });
}
