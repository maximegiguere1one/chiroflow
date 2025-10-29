import { motion } from 'framer-motion';
import { useState, useEffect } from 'react';
import { TrendingUp, TrendingDown, Activity, Target, Plus, Calendar } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useToastContext } from '../../contexts/ToastContext';

interface ProgressEntry {
  id: string;
  patient_id: string;
  measurement_date: string;
  pain_level: number;
  mobility_score: number;
  posture_score: number;
  functional_score: number;
  notes: string;
  created_at: string;
}

interface Patient {
  id: string;
  first_name: string;
  last_name: string;
}

export function PatientProgressTracking() {
  const [patients, setPatients] = useState<Patient[]>([]);
  const [selectedPatient, setSelectedPatient] = useState<string>('');
  const [progressData, setProgressData] = useState<ProgressEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const toast = useToastContext();

  useEffect(() => {
    loadPatients();
  }, []);

  useEffect(() => {
    if (selectedPatient) {
      loadProgressData(selectedPatient);
    }
  }, [selectedPatient]);

  async function loadPatients() {
    try {
      const { data, error } = await supabase
        .from('patients_full')
        .select('id, first_name, last_name')
        .eq('status', 'active')
        .order('last_name', { ascending: true });

      if (error) throw error;
      setPatients(data || []);
      if (data && data.length > 0) {
        setSelectedPatient(data[0].id);
      }
    } catch (error) {
      console.error('Error loading patients:', error);
    } finally {
      setLoading(false);
    }
  }

  async function loadProgressData(patientId: string) {
    try {
      const { data, error } = await supabase
        .from('patient_progress_tracking')
        .select('*')
        .eq('patient_id', patientId)
        .order('measurement_date', { ascending: true });

      if (error) throw error;
      setProgressData(data || []);
    } catch (error) {
      console.error('Error loading progress data:', error);
    }
  }

  async function addProgressEntry(entry: Omit<ProgressEntry, 'id' | 'created_at'>) {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { error } = await supabase
        .from('patient_progress_tracking')
        .insert([{ ...entry, measured_by: user.id }]);

      if (error) throw error;

      toast.success('Mesure de progrès ajoutée');
      loadProgressData(selectedPatient);
      setShowAddModal(false);
    } catch (error: any) {
      console.error('Error adding progress entry:', error);
      toast.error('Erreur lors de l\'ajout');
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="w-8 h-8 border-4 border-gold-400 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const selectedPatientData = patients.find(p => p.id === selectedPatient);
  const latestProgress = progressData[progressData.length - 1];
  const firstProgress = progressData[0];

  function calculateTrend(metric: keyof ProgressEntry): number {
    if (progressData.length < 2) return 0;
    const latest = progressData[progressData.length - 1];
    const previous = progressData[progressData.length - 2];
    const latestValue = latest[metric] as number;
    const previousValue = previous[metric] as number;
    return latestValue - previousValue;
  }

  function calculateOverallImprovement(): number {
    if (!latestProgress || !firstProgress) return 0;

    const painImprovement = (firstProgress.pain_level || 0) - (latestProgress.pain_level || 0);
    const mobilityImprovement = (latestProgress.mobility_score || 0) - (firstProgress.mobility_score || 0);
    const postureImprovement = (latestProgress.posture_score || 0) - (firstProgress.posture_score || 0);
    const functionalImprovement = (latestProgress.functional_score || 0) - (firstProgress.functional_score || 0);

    const avg = (painImprovement + mobilityImprovement + postureImprovement + functionalImprovement) / 4;
    return Math.round((avg / 10) * 100);
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-heading text-foreground">Suivi de progrès</h2>
          <p className="text-sm text-foreground/60 mt-1">
            {progressData.length} mesures enregistrées
          </p>
        </div>
        <div className="flex items-center gap-3">
          <select
            value={selectedPatient}
            onChange={(e) => setSelectedPatient(e.target.value)}
            className="px-4 py-2 border border-neutral-300 rounded focus:border-gold-400 focus:outline-none focus:ring-2 focus:ring-gold-200"
          >
            {patients.map((p) => (
              <option key={p.id} value={p.id}>
                {p.first_name} {p.last_name}
              </option>
            ))}
          </select>
          <button
            onClick={() => setShowAddModal(true)}
            disabled={!selectedPatient}
            className="flex items-center gap-2 px-6 py-2 bg-gradient-to-r from-gold-500 to-gold-600 text-white hover:from-gold-600 hover:to-gold-700 rounded transition-all shadow-soft disabled:opacity-50"
          >
            <Plus className="w-4 h-4" />
            Nouvelle mesure
          </button>
        </div>
      </div>

      {progressData.length === 0 ? (
        <div className="bg-white border border-neutral-200 rounded-lg p-12 text-center">
          <Activity className="w-16 h-16 text-foreground/20 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-foreground mb-2">Aucune donnée de progrès</h3>
          <p className="text-sm text-foreground/60 mb-4">
            Commencez à suivre les progrès de ce patient en ajoutant une première mesure.
          </p>
          <button
            onClick={() => setShowAddModal(true)}
            className="px-6 py-3 bg-gradient-to-r from-gold-500 to-gold-600 text-white rounded hover:from-gold-600 hover:to-gold-700 transition-all"
          >
            Ajouter une mesure
          </button>
        </div>
      ) : (
        <>
          {/* Overview Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <MetricCard
              title="Amélioration globale"
              value={`${calculateOverallImprovement()}%`}
              trend={calculateOverallImprovement()}
              icon={Target}
              color="gold"
            />
            <MetricCard
              title="Douleur actuelle"
              value={`${latestProgress?.pain_level || 0}/10`}
              trend={-calculateTrend('pain_level')}
              icon={Activity}
              color="red"
              inverted
            />
            <MetricCard
              title="Mobilité"
              value={`${latestProgress?.mobility_score || 0}/10`}
              trend={calculateTrend('mobility_score')}
              icon={TrendingUp}
              color="green"
            />
            <MetricCard
              title="Fonction"
              value={`${latestProgress?.functional_score || 0}/10`}
              trend={calculateTrend('functional_score')}
              icon={TrendingUp}
              color="blue"
            />
          </div>

          {/* Progress Charts */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <ProgressChart
              title="Niveau de douleur"
              data={progressData}
              metric="pain_level"
              color="red"
              inverted
            />
            <ProgressChart
              title="Score de mobilité"
              data={progressData}
              metric="mobility_score"
              color="green"
            />
            <ProgressChart
              title="Posture"
              data={progressData}
              metric="posture_score"
              color="blue"
            />
            <ProgressChart
              title="Fonction quotidienne"
              data={progressData}
              metric="functional_score"
              color="purple"
            />
          </div>

          {/* Timeline */}
          <div className="bg-white border border-neutral-200 rounded-lg shadow-soft-lg p-6">
            <h3 className="text-lg font-medium text-foreground mb-4">Historique des mesures</h3>
            <div className="space-y-4">
              {progressData.slice().reverse().map((entry, index) => (
                <motion.div
                  key={entry.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className="flex items-start gap-4 p-4 bg-neutral-50 rounded-lg"
                >
                  <div className="flex-shrink-0">
                    <div className="w-12 h-12 bg-gold-100 rounded-full flex items-center justify-center">
                      <Calendar className="w-6 h-6 text-gold-600" />
                    </div>
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-medium text-foreground">
                        {new Date(entry.measurement_date).toLocaleDateString('fr-CA', {
                          weekday: 'long',
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric'
                        })}
                      </span>
                      <span className="text-xs text-foreground/60">
                        {new Date(entry.created_at).toLocaleTimeString('fr-CA', {
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </span>
                    </div>
                    <div className="grid grid-cols-4 gap-4 text-sm mb-2">
                      <div>
                        <span className="text-foreground/60">Douleur:</span>{' '}
                        <span className="font-medium">{entry.pain_level}/10</span>
                      </div>
                      <div>
                        <span className="text-foreground/60">Mobilité:</span>{' '}
                        <span className="font-medium">{entry.mobility_score}/10</span>
                      </div>
                      <div>
                        <span className="text-foreground/60">Posture:</span>{' '}
                        <span className="font-medium">{entry.posture_score}/10</span>
                      </div>
                      <div>
                        <span className="text-foreground/60">Fonction:</span>{' '}
                        <span className="font-medium">{entry.functional_score}/10</span>
                      </div>
                    </div>
                    {entry.notes && (
                      <p className="text-sm text-foreground/70 italic">{entry.notes}</p>
                    )}
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </>
      )}

      {showAddModal && selectedPatient && (
        <AddProgressModal
          patientId={selectedPatient}
          patientName={`${selectedPatientData?.first_name} ${selectedPatientData?.last_name}`}
          onClose={() => setShowAddModal(false)}
          onAdd={addProgressEntry}
        />
      )}
    </div>
  );
}

function MetricCard({
  title,
  value,
  trend,
  icon: Icon,
  color,
  inverted = false
}: {
  title: string;
  value: string;
  trend: number;
  icon: any;
  color: string;
  inverted?: boolean;
}) {
  const isPositive = inverted ? trend < 0 : trend > 0;
  const colorClasses = {
    gold: 'from-gold-400 to-gold-600',
    red: 'from-red-400 to-red-600',
    green: 'from-green-400 to-green-600',
    blue: 'from-blue-400 to-blue-600',
    purple: 'from-purple-400 to-purple-600'
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white border border-neutral-200 rounded-lg p-6 shadow-soft"
    >
      <div className="flex items-start justify-between mb-4">
        <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${colorClasses[color as keyof typeof colorClasses]} flex items-center justify-center`}>
          <Icon className="w-6 h-6 text-white" />
        </div>
        {trend !== 0 && (
          <div className={`flex items-center gap-1 text-sm ${
            isPositive ? 'text-green-600' : 'text-red-600'
          }`}>
            {isPositive ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
            {Math.abs(trend).toFixed(1)}
          </div>
        )}
      </div>
      <div className="text-3xl font-light text-foreground mb-1">{value}</div>
      <div className="text-sm text-foreground/60">{title}</div>
    </motion.div>
  );
}

function ProgressChart({
  title,
  data,
  metric,
  color,
  inverted = false
}: {
  title: string;
  data: ProgressEntry[];
  metric: keyof ProgressEntry;
  color: string;
  inverted?: boolean;
}) {
  const maxValue = 10;
  const chartHeight = 200;

  const colorClasses = {
    red: 'stroke-red-500 fill-red-500',
    green: 'stroke-green-500 fill-green-500',
    blue: 'stroke-blue-500 fill-blue-500',
    purple: 'stroke-purple-500 fill-purple-500'
  };

  if (data.length === 0) return null;

  const points = data.map((entry, index) => {
    const x = data.length === 1 ? 50 : (index / (data.length - 1)) * 100;
    const value = (entry[metric] as number) || 0;
    const y = inverted
      ? ((value / maxValue) * chartHeight)
      : (chartHeight - (value / maxValue) * chartHeight);
    return { x, y, value, date: entry.measurement_date };
  });

  const pathD = points
    .filter(point => !isNaN(point.x) && !isNaN(point.y))
    .map((point, i) =>
      i === 0 ? `M ${point.x} ${point.y}` : `L ${point.x} ${point.y}`
    ).join(' ');

  const areaD = `${pathD} L 100 ${chartHeight} L 0 ${chartHeight} Z`;

  return (
    <div className="bg-white border border-neutral-200 rounded-lg p-6 shadow-soft">
      <h4 className="text-lg font-medium text-foreground mb-4">{title}</h4>
      <div className="relative" style={{ height: `${chartHeight}px` }}>
        <svg className="w-full h-full" viewBox={`0 0 100 ${chartHeight}`} preserveAspectRatio="none">
          <path
            d={areaD}
            className={`${colorClasses[color as keyof typeof colorClasses]} opacity-10`}
          />
          <path
            d={pathD}
            className={colorClasses[color as keyof typeof colorClasses]}
            fill="none"
            strokeWidth="2"
          />
          {points
            .filter(point => !isNaN(point.x) && !isNaN(point.y))
            .map((point, i) => (
              <circle
                key={i}
                cx={point.x}
                cy={point.y}
                r="3"
                className={colorClasses[color as keyof typeof colorClasses]}
              />
            ))}
        </svg>
        <div className="absolute inset-0 flex items-end justify-between px-2 pointer-events-none">
          {points.map((point, i) => (
            <div key={i} className="text-xs text-foreground/60 text-center" style={{ width: `${100 / points.length}%` }}>
              {new Date(point.date).toLocaleDateString('fr-CA', { month: 'short', day: 'numeric' })}
            </div>
          ))}
        </div>
      </div>
      <div className="mt-4 flex items-center justify-between text-sm">
        <span className="text-foreground/60">Première mesure</span>
        <span className="font-medium text-foreground">
          {data[0][metric]}/10 → {data[data.length - 1][metric]}/10
        </span>
      </div>
    </div>
  );
}

function AddProgressModal({
  patientId,
  patientName,
  onClose,
  onAdd
}: {
  patientId: string;
  patientName: string;
  onClose: () => void;
  onAdd: (entry: any) => void;
}) {
  const [formData, setFormData] = useState({
    patient_id: patientId,
    measurement_date: new Date().toISOString().split('T')[0],
    pain_level: 5,
    mobility_score: 5,
    posture_score: 5,
    functional_score: 5,
    notes: ''
  });

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    onAdd(formData);
  }

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-6">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-white w-full max-w-2xl rounded-lg shadow-lifted overflow-hidden"
      >
        <div className="bg-gradient-to-r from-gold-500 to-gold-600 p-6">
          <h3 className="text-2xl font-heading text-white">Nouvelle mesure de progrès</h3>
          <p className="text-white/80 mt-1">{patientName}</p>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          <div>
            <label className="block text-sm font-medium text-foreground/70 mb-2">
              Date de mesure
            </label>
            <input
              type="date"
              value={formData.measurement_date}
              onChange={(e) => setFormData({ ...formData, measurement_date: e.target.value })}
              max={new Date().toISOString().split('T')[0]}
              className="w-full px-4 py-3 border border-neutral-300 rounded focus:border-gold-400 focus:outline-none focus:ring-2 focus:ring-gold-200"
            />
          </div>

          <div className="grid grid-cols-2 gap-6">
            <ScoreSlider
              label="Niveau de douleur"
              value={formData.pain_level}
              onChange={(val) => setFormData({ ...formData, pain_level: val })}
              min={0}
              max={10}
              color="red"
              inverted
            />
            <ScoreSlider
              label="Score de mobilité"
              value={formData.mobility_score}
              onChange={(val) => setFormData({ ...formData, mobility_score: val })}
              min={0}
              max={10}
              color="green"
            />
            <ScoreSlider
              label="Score de posture"
              value={formData.posture_score}
              onChange={(val) => setFormData({ ...formData, posture_score: val })}
              min={0}
              max={10}
              color="blue"
            />
            <ScoreSlider
              label="Fonction quotidienne"
              value={formData.functional_score}
              onChange={(val) => setFormData({ ...formData, functional_score: val })}
              min={0}
              max={10}
              color="purple"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-foreground/70 mb-2">
              Notes (optionnel)
            </label>
            <textarea
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              rows={3}
              className="w-full px-4 py-3 border border-neutral-300 rounded focus:border-gold-400 focus:outline-none focus:ring-2 focus:ring-gold-200 resize-none"
              placeholder="Observations, changements notés..."
            />
          </div>

          <div className="flex items-center justify-end gap-4 pt-4 border-t border-neutral-200">
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-3 border border-neutral-300 text-foreground hover:bg-neutral-50 rounded transition-all"
            >
              Annuler
            </button>
            <button
              type="submit"
              className="px-6 py-3 bg-gradient-to-r from-gold-500 to-gold-600 text-white hover:from-gold-600 hover:to-gold-700 rounded transition-all shadow-soft"
            >
              Enregistrer la mesure
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
}

function ScoreSlider({
  label,
  value,
  onChange,
  min,
  max,
  color,
  inverted = false
}: {
  label: string;
  value: number;
  onChange: (val: number) => void;
  min: number;
  max: number;
  color: string;
  inverted?: boolean;
}) {
  const colorClasses = {
    red: 'bg-red-500',
    green: 'bg-green-500',
    blue: 'bg-blue-500',
    purple: 'bg-purple-500'
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <label className="text-sm font-medium text-foreground/70">{label}</label>
        <span className={`text-2xl font-light px-3 py-1 rounded ${
          inverted
            ? value <= 3 ? 'bg-green-100 text-green-700' : value >= 7 ? 'bg-red-100 text-red-700' : 'bg-yellow-100 text-yellow-700'
            : value >= 7 ? 'bg-green-100 text-green-700' : value <= 3 ? 'bg-red-100 text-red-700' : 'bg-yellow-100 text-yellow-700'
        }`}>
          {value}
        </span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        value={value}
        onChange={(e) => onChange(parseInt(e.target.value))}
        className="w-full h-2 rounded-lg appearance-none cursor-pointer"
        style={{
          background: `linear-gradient(to right, ${
            color === 'red' ? '#ef4444' :
            color === 'green' ? '#10b981' :
            color === 'blue' ? '#3b82f6' : '#a855f7'
          } 0%, ${
            color === 'red' ? '#ef4444' :
            color === 'green' ? '#10b981' :
            color === 'blue' ? '#3b82f6' : '#a855f7'
          } ${(value / max) * 100}%, #e5e7eb ${(value / max) * 100}%, #e5e7eb 100%)`
        }}
      />
      <div className="flex justify-between text-xs text-foreground/60 mt-1">
        <span>{inverted ? 'Aucune' : 'Faible'}</span>
        <span>{inverted ? 'Sévère' : 'Excellent'}</span>
      </div>
    </div>
  );
}
