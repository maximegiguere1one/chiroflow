// Test utility for TOTP verification
// Import this in your component to test TOTP generation

export function testTOTP() {
  // Test with a known secret and expected output
  const testSecret = 'JBSWY3DPEHPK3PXP'; // "Hello!" in base32
  const testTime = 1234567890; // Known test timestamp

  console.log('=== TOTP TEST ===');
  console.log('Test Secret:', testSecret);
  console.log('Test Time:', testTime);
  console.log('Expected Counter:', Math.floor(testTime / 30));

  // Expected token for this test case (from TOTP RFC)
  // At time 1234567890, the token should be specific value

  const counter = Math.floor(testTime / 30);
  console.log('Counter:', counter);

  // Let's also test with current time
  const now = Math.floor(Date.now() / 1000);
  const currentCounter = Math.floor(now / 30);
  console.log('\n=== CURRENT TIME TEST ===');
  console.log('Current Time:', now);
  console.log('Current Counter:', currentCounter);
  console.log('Current Date:', new Date().toISOString());
}

// Helper to manually verify a token
export function manualVerifyToken(secret: string, token: string) {
  console.log('\n=== MANUAL VERIFICATION ===');
  console.log('Secret:', secret);
  console.log('Token to verify:', token);
  console.log('Current time:', Math.floor(Date.now() / 1000));
  console.log('Current counter:', Math.floor(Date.now() / 1000 / 30));

  // Show what tokens we're generating for the next few windows
  const currentTime = Math.floor(Date.now() / 1000);
  for (let i = -2; i <= 2; i++) {
    const time = currentTime + (i * 30);
    const counter = Math.floor(time / 30);
    console.log(`Window ${i}: counter=${counter}, time=${time}`);
  }
}

// Test base32 decoding
export function testBase32Decode(secret: string) {
  const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';
  const cleanBase32 = secret.toUpperCase().replace(/=+$/, '');

  console.log('\n=== BASE32 DECODE TEST ===');
  console.log('Input:', secret);
  console.log('Clean:', cleanBase32);
  console.log('Length:', cleanBase32.length);

  const bits: number[] = [];
  for (const char of cleanBase32) {
    const val = alphabet.indexOf(char);
    if (val === -1) {
      console.error('Invalid character:', char);
      continue;
    }
    const binary = val.toString(2).padStart(5, '0');
    console.log(`Char '${char}' -> ${val} -> ${binary}`);
    bits.push(...binary.split('').map(Number));
  }

  console.log('Total bits:', bits.length);
  console.log('Expected bytes:', Math.floor(bits.length / 8));

  const bytes: number[] = [];
  for (let i = 0; i + 8 <= bits.length; i += 8) {
    const byte = parseInt(bits.slice(i, i + 8).join(''), 2);
    bytes.push(byte);
  }

  console.log('Decoded bytes:', bytes);
  console.log('Decoded hex:', bytes.map(b => b.toString(16).padStart(2, '0')).join(''));

  return new Uint8Array(bytes);
}
