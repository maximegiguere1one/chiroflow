import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { supabase } from '../../lib/supabase';
import { useToastContext } from '../../contexts/ToastContext';
import { Clock, Save } from 'lucide-react';

interface BusinessHour {
  id?: string;
  day_of_week: number;
  day_name: string;
  is_open: boolean;
  open_time: string;
  close_time: string;
  break_start_time?: string;
  break_end_time?: string;
}

const DAYS = [
  { value: 0, label: 'Dimanche' },
  { value: 1, label: 'Lundi' },
  { value: 2, label: 'Mardi' },
  { value: 3, label: 'Mercredi' },
  { value: 4, label: 'Jeudi' },
  { value: 5, label: 'Vendredi' },
  { value: 6, label: 'Samedi' },
];

export function BusinessHoursConfig() {
  const toast = useToastContext();
  const [hours, setHours] = useState<BusinessHour[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadBusinessHours();
  }, []);

  async function loadBusinessHours() {
    try {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from('business_hours')
        .select('*')
        .eq('owner_id', user.id)
        .order('day_of_week');

      if (error) throw error;

      if (data && data.length > 0) {
        setHours(data);
      } else {
        const defaultHours = DAYS.map(day => ({
          day_of_week: day.value,
          day_name: day.label,
          is_open: day.value >= 1 && day.value <= 5,
          open_time: '09:00',
          close_time: '17:00',
          break_start_time: '12:00',
          break_end_time: '13:00',
        }));
        setHours(defaultHours);
      }
    } catch (error) {
      console.error('Error loading business hours:', error);
      toast.error('Erreur lors du chargement');
    } finally {
      setLoading(false);
    }
  }

  async function handleSave() {
    try {
      setSaving(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const hoursData = hours.map(h => ({
        owner_id: user.id,
        day_of_week: h.day_of_week,
        day_name: h.day_name,
        is_open: h.is_open,
        open_time: h.is_open ? h.open_time : null,
        close_time: h.is_open ? h.close_time : null,
        break_start_time: h.is_open && h.break_start_time ? h.break_start_time : null,
        break_end_time: h.is_open && h.break_end_time ? h.break_end_time : null,
      }));

      const { error } = await supabase
        .from('business_hours')
        .upsert(hoursData, {
          onConflict: 'owner_id,day_of_week'
        });

      if (error) throw error;

      toast.success('Heures d\'ouverture sauvegardées!');
      await loadBusinessHours();
    } catch (error) {
      console.error('Error saving business hours:', error);
      toast.error('Erreur lors de la sauvegarde');
    } finally {
      setSaving(false);
    }
  }

  function updateDay(dayIndex: number, updates: Partial<BusinessHour>) {
    setHours(prev => prev.map((h, i) =>
      i === dayIndex ? { ...h, ...updates } : h
    ));
  }

  function applyToAllDays(sourceDay: BusinessHour) {
    const confirmed = window.confirm('Appliquer ces horaires à tous les jours ouvrables (Lun-Ven)?');
    if (!confirmed) return;

    setHours(prev => prev.map(h => {
      if (h.day_of_week >= 1 && h.day_of_week <= 5) {
        return {
          ...h,
          is_open: sourceDay.is_open,
          open_time: sourceDay.open_time,
          close_time: sourceDay.close_time,
          break_start_time: sourceDay.break_start_time,
          break_end_time: sourceDay.break_end_time,
        };
      }
      return h;
    }));
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gold-500"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-heading text-foreground flex items-center gap-2">
            <Clock className="w-5 h-5 text-gold-500" />
            Heures d'ouverture
          </h3>
          <p className="text-sm text-neutral-600 mt-1">
            Configurez vos heures d'ouverture par jour de la semaine
          </p>
        </div>
        <button
          onClick={handleSave}
          disabled={saving}
          className="flex items-center gap-2 px-6 py-2 bg-gold-500 text-white rounded-lg hover:bg-gold-600 transition-colors disabled:opacity-50"
        >
          <Save className="w-4 h-4" />
          {saving ? 'Sauvegarde...' : 'Sauvegarder'}
        </button>
      </div>

      <div className="space-y-4">
        {hours.map((day, index) => (
          <motion.div
            key={day.day_of_week}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.05 }}
            className="bg-white rounded-lg border border-neutral-200 p-6"
          >
            <div className="flex items-start gap-4">
              {/* Day Toggle */}
              <div className="flex items-center gap-3 w-40">
                <input
                  type="checkbox"
                  checked={day.is_open}
                  onChange={(e) => updateDay(index, { is_open: e.target.checked })}
                  className="w-5 h-5 rounded border-neutral-300 text-gold-500 focus:ring-gold-500"
                />
                <span className="font-medium text-foreground">{day.day_name}</span>
              </div>

              {/* Hours Configuration */}
              {day.is_open ? (
                <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Opening Hours */}
                  <div>
                    <label className="block text-sm font-medium text-neutral-700 mb-2">
                      Heures d'ouverture
                    </label>
                    <div className="flex items-center gap-2">
                      <input
                        type="time"
                        value={day.open_time}
                        onChange={(e) => updateDay(index, { open_time: e.target.value })}
                        className="flex-1 px-3 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-gold-500 focus:border-transparent"
                      />
                      <span className="text-neutral-500">à</span>
                      <input
                        type="time"
                        value={day.close_time}
                        onChange={(e) => updateDay(index, { close_time: e.target.value })}
                        className="flex-1 px-3 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-gold-500 focus:border-transparent"
                      />
                    </div>
                  </div>

                  {/* Break Hours */}
                  <div>
                    <label className="block text-sm font-medium text-neutral-700 mb-2">
                      Pause déjeuner (optionnel)
                    </label>
                    <div className="flex items-center gap-2">
                      <input
                        type="time"
                        value={day.break_start_time || ''}
                        onChange={(e) => updateDay(index, { break_start_time: e.target.value || undefined })}
                        className="flex-1 px-3 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-gold-500 focus:border-transparent"
                      />
                      <span className="text-neutral-500">à</span>
                      <input
                        type="time"
                        value={day.break_end_time || ''}
                        onChange={(e) => updateDay(index, { break_end_time: e.target.value || undefined })}
                        className="flex-1 px-3 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-gold-500 focus:border-transparent"
                      />
                    </div>
                  </div>

                  {/* Apply to all button */}
                  {day.day_of_week >= 1 && day.day_of_week <= 5 && (
                    <div className="md:col-span-2 flex justify-end">
                      <button
                        type="button"
                        onClick={() => applyToAllDays(day)}
                        className="text-sm text-gold-600 hover:text-gold-700 font-medium"
                      >
                        Appliquer à tous les jours ouvrables
                      </button>
                    </div>
                  )}
                </div>
              ) : (
                <div className="flex-1 flex items-center text-neutral-500">
                  Fermé
                </div>
              )}
            </div>
          </motion.div>
        ))}
      </div>

      {/* Summary */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h4 className="text-sm font-medium text-blue-900 mb-2">Résumé</h4>
        <div className="text-sm text-blue-800">
          {hours.filter(h => h.is_open).length} jours ouverts par semaine
        </div>
      </div>
    </div>
  );
}
