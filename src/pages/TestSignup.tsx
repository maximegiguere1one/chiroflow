import { useState } from 'react';

export default function TestSignup() {
  const [result, setResult] = useState('');
  const [loading, setLoading] = useState(false);

  async function testSignup() {
    setLoading(true);
    setResult('Testing...');

    try {
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
      const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

      const testData = {
        email: 'test@chiroflow.com',
        password: 'test123456',
        full_name: 'Test Admin',
        invite_code: 'CHIRO2024',
      };

      const response = await fetch(`${supabaseUrl}/functions/v1/create-admin-user`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${supabaseAnonKey}`,
        },
        body: JSON.stringify(testData),
      });

      const data = await response.json();

      setResult(JSON.stringify({
        status: response.status,
        ok: response.ok,
        data: data,
      }, null, 2));
    } catch (error: any) {
      setResult(`Error: ${error.message}`);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <div className="max-w-2xl mx-auto bg-white rounded-lg shadow p-6">
        <h1 className="text-2xl font-bold mb-4">Test Signup Function</h1>

        <button
          onClick={testSignup}
          disabled={loading}
          className="px-6 py-3 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
        >
          {loading ? 'Testing...' : 'Test Create Admin User'}
        </button>

        {result && (
          <div className="mt-6">
            <h2 className="text-lg font-semibold mb-2">Result:</h2>
            <pre className="bg-gray-900 text-green-400 p-4 rounded overflow-auto text-sm">
              {result}
            </pre>
          </div>
        )}

        <div className="mt-6 text-sm text-gray-600">
          <p><strong>Test Data:</strong></p>
          <ul className="list-disc ml-6 mt-2">
            <li>Email: test@chiroflow.com</li>
            <li>Password: test123456</li>
            <li>Full Name: Test Admin</li>
            <li>Invite Code: CHIRO2024</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
