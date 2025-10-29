import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

export default function DiagnosticPage() {
  const [authState, setAuthState] = useState<any>(null);
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    setLoading(true);

    const { data: { session } } = await supabase.auth.getSession();
    setAuthState(session);

    const { data: usersData } = await supabase
      .from('profiles')
      .select('*')
      .order('created_at', { ascending: false });

    setUsers(usersData || []);
    setLoading(false);
  }

  async function testLogin() {
    const { data, error } = await supabase.auth.signInWithPassword({
      email: 'test@chiroflow.com',
      password: 'test123456'
    });

    if (error) {
      alert('Erreur: ' + error.message);
    } else {
      alert('Connexion réussie!');
      loadData();
    }
  }

  async function logout() {
    await supabase.auth.signOut();
    loadData();
  }

  if (loading) {
    return <div className="p-8">Chargement...</div>;
  }

  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="bg-white rounded-lg shadow p-6">
          <h1 className="text-2xl font-bold mb-4">Page de Diagnostic</h1>

          <div className="space-y-4">
            <div>
              <h2 className="text-lg font-semibold mb-2">État de l'authentification:</h2>
              <div className="bg-gray-900 text-green-400 p-4 rounded overflow-auto">
                <pre>{JSON.stringify(authState, null, 2)}</pre>
              </div>
            </div>

            <div className="flex gap-2">
              {authState ? (
                <button
                  onClick={logout}
                  className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
                >
                  Se déconnecter
                </button>
              ) : (
                <button
                  onClick={testLogin}
                  className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                >
                  Test Login (test@chiroflow.com)
                </button>
              )}

              <a
                href="/admin"
                className="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700"
              >
                Aller à la page de login
              </a>

              <a
                href="/admin/signup"
                className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
              >
                Aller à l'inscription
              </a>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold mb-4">Utilisateurs enregistrés ({users.length}):</h2>
          <div className="space-y-2">
            {users.map(user => (
              <div key={user.id} className="border p-3 rounded">
                <div className="font-semibold">{user.full_name}</div>
                <div className="text-sm text-gray-600">{user.email}</div>
                <div className="text-xs text-gray-500">Role: {user.role}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
