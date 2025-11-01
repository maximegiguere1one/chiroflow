import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Radio, Wifi, WifiOff, Activity, Users, CheckCircle } from 'lucide-react';
import { usePatientStoreWithRealtime } from '../../presentation/stores/patientStoreWithRealtime';
import { useAppointmentStore } from '../../presentation/stores/appointmentStore';

export default function RealtimeDemo() {
  const {
    patients,
    isRealtimeActive,
    enableRealtime,
    disableRealtime,
    loadPatients,
  } = usePatientStoreWithRealtime();

  const appointments = useAppointmentStore((state) => state.appointments);
  const [realtimeEvents, setRealtimeEvents] = useState<Array<{
    id: string;
    type: 'INSERT' | 'UPDATE' | 'DELETE';
    table: string;
    timestamp: number;
  }>>([]);

  useEffect(() => {
    loadPatients();
  }, []);

  useEffect(() => {
    if (isRealtimeActive) {
      const originalConsoleLog = console.log;
      console.log = (...args) => {
        if (args[0]?.includes?.('Realtime')) {
          const eventType = args[0].split(' ')[1];
          if (['INSERT', 'UPDATE', 'DELETE'].includes(eventType)) {
            setRealtimeEvents((prev) => [
              {
                id: Math.random().toString(36),
                type: eventType as any,
                table: 'contacts',
                timestamp: Date.now(),
              },
              ...prev.slice(0, 9),
            ]);
          }
        }
        originalConsoleLog(...args);
      };

      return () => {
        console.log = originalConsoleLog;
      };
    }
  }, [isRealtimeActive]);

  const handleToggleRealtime = () => {
    if (isRealtimeActive) {
      disableRealtime();
    } else {
      enableRealtime();
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          Démo Temps-Réel Supabase
        </h1>
        <p className="text-gray-600">
          Activez le temps-réel pour voir les changements en direct
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        <motion.div
          whileHover={{ scale: 1.02 }}
          className="bg-white rounded-xl shadow-sm border border-gray-200 p-6"
        >
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              {isRealtimeActive ? (
                <div className="relative">
                  <Wifi className="w-8 h-8 text-green-500" />
                  <motion.div
                    animate={{ scale: [1, 1.5, 1], opacity: [1, 0, 1] }}
                    transition={{ repeat: Infinity, duration: 2 }}
                    className="absolute inset-0 bg-green-500 rounded-full opacity-25"
                  />
                </div>
              ) : (
                <WifiOff className="w-8 h-8 text-gray-400" />
              )}
              <div>
                <h3 className="text-lg font-semibold text-gray-900">
                  État Temps-Réel
                </h3>
                <p className="text-sm text-gray-500">
                  {isRealtimeActive ? 'Actif' : 'Inactif'}
                </p>
              </div>
            </div>
            <button
              onClick={handleToggleRealtime}
              className={`px-4 py-2 rounded-lg font-medium transition-all ${
                isRealtimeActive
                  ? 'bg-red-100 text-red-700 hover:bg-red-200'
                  : 'bg-green-100 text-green-700 hover:bg-green-200'
              }`}
            >
              {isRealtimeActive ? 'Désactiver' : 'Activer'}
            </button>
          </div>
          <div className="text-sm text-gray-600">
            {isRealtimeActive ? (
              <>
                ✅ Écoute active sur la table <code className="bg-gray-100 px-2 py-1 rounded">contacts</code>
              </>
            ) : (
              'Cliquez sur "Activer" pour commencer'
            )}
          </div>
        </motion.div>

        <motion.div
          whileHover={{ scale: 1.02 }}
          className="bg-white rounded-xl shadow-sm border border-gray-200 p-6"
        >
          <div className="flex items-center gap-3 mb-4">
            <Users className="w-8 h-8 text-blue-500" />
            <div>
              <h3 className="text-lg font-semibold text-gray-900">
                Patients Chargés
              </h3>
              <p className="text-sm text-gray-500">En mémoire</p>
            </div>
          </div>
          <div className="text-3xl font-bold text-blue-600">
            {patients.length}
          </div>
        </motion.div>

        <motion.div
          whileHover={{ scale: 1.02 }}
          className="bg-white rounded-xl shadow-sm border border-gray-200 p-6"
        >
          <div className="flex items-center gap-3 mb-4">
            <Activity className="w-8 h-8 text-purple-500" />
            <div>
              <h3 className="text-lg font-semibold text-gray-900">
                Événements
              </h3>
              <p className="text-sm text-gray-500">Dernière minute</p>
            </div>
          </div>
          <div className="text-3xl font-bold text-purple-600">
            {realtimeEvents.length}
          </div>
        </motion.div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <Radio className="w-5 h-5 text-blue-500" />
            Événements Temps-Réel
          </h3>
          
          {realtimeEvents.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <Activity className="w-12 h-12 text-gray-400 mx-auto mb-3" />
              <p>Aucun événement encore</p>
              <p className="text-sm">
                {isRealtimeActive
                  ? 'Les changements apparaîtront ici en temps réel'
                  : 'Activez le temps-réel pour voir les événements'}
              </p>
            </div>
          ) : (
            <div className="space-y-2 max-h-96 overflow-y-auto">
              {realtimeEvents.map((event, index) => (
                <motion.div
                  key={event.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className={`p-3 rounded-lg border-l-4 ${
                    event.type === 'INSERT'
                      ? 'bg-green-50 border-green-500'
                      : event.type === 'UPDATE'
                      ? 'bg-blue-50 border-blue-500'
                      : 'bg-red-50 border-red-500'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span
                        className={`text-xs font-semibold px-2 py-1 rounded ${
                          event.type === 'INSERT'
                            ? 'bg-green-100 text-green-700'
                            : event.type === 'UPDATE'
                            ? 'bg-blue-100 text-blue-700'
                            : 'bg-red-100 text-red-700'
                        }`}
                      >
                        {event.type}
                      </span>
                      <span className="text-sm text-gray-700 font-mono">
                        {event.table}
                      </span>
                    </div>
                    <span className="text-xs text-gray-500">
                      {new Date(event.timestamp).toLocaleTimeString()}
                    </span>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <CheckCircle className="w-5 h-5 text-green-500" />
            Fonctionnalités Temps-Réel
          </h3>
          
          <div className="space-y-4">
            <div className="flex items-start gap-3">
              <div className="w-2 h-2 bg-green-500 rounded-full mt-2"></div>
              <div>
                <p className="font-medium text-gray-900">
                  Synchronisation Automatique
                </p>
                <p className="text-sm text-gray-600">
                  Les changements sont automatiquement reflétés dans l'interface
                </p>
              </div>
            </div>
            
            <div className="flex items-start gap-3">
              <div className="w-2 h-2 bg-green-500 rounded-full mt-2"></div>
              <div>
                <p className="font-medium text-gray-900">
                  Événements INSERT
                </p>
                <p className="text-sm text-gray-600">
                  Nouveaux patients ajoutés instantanément
                </p>
              </div>
            </div>
            
            <div className="flex items-start gap-3">
              <div className="w-2 h-2 bg-green-500 rounded-full mt-2"></div>
              <div>
                <p className="font-medium text-gray-900">
                  Événements UPDATE
                </p>
                <p className="text-sm text-gray-600">
                  Modifications synchronisées en temps réel
                </p>
              </div>
            </div>
            
            <div className="flex items-start gap-3">
              <div className="w-2 h-2 bg-green-500 rounded-full mt-2"></div>
              <div>
                <p className="font-medium text-gray-900">
                  Événements DELETE
                </p>
                <p className="text-sm text-gray-600">
                  Suppressions reflétées immédiatement
                </p>
              </div>
            </div>

            <div className="mt-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
              <p className="text-sm text-blue-800 font-medium mb-2">
                💡 Comment tester:
              </p>
              <ol className="text-sm text-blue-700 space-y-1 list-decimal list-inside">
                <li>Activez le temps-réel ci-dessus</li>
                <li>Ouvrez un autre onglet avec l'application</li>
                <li>Créez/modifiez/supprimez un patient</li>
                <li>Observez les changements en temps réel ici!</li>
              </ol>
            </div>
          </div>
        </div>
      </div>

      <div className="mt-6 bg-yellow-50 border border-yellow-200 rounded-lg p-4">
        <p className="text-sm text-yellow-800">
          <strong>Note:</strong> Le temps-réel Supabase utilise WebSockets pour une synchronisation instantanée.
          Dans un environnement de production, assurez-vous que les politiques RLS sont correctement configurées
          pour sécuriser l'accès aux données en temps réel.
        </p>
      </div>
    </div>
  );
}
