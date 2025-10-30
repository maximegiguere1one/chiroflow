import { useState, useEffect, useMemo, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { getStartOfDay, getEndOfDay, getCurrentTimeString, addMinutes, isTimeInRange } from '../lib/timeUtils';
import { TIMING_CONFIG } from '../config';
import type { Appointment } from '../types/database';

interface AppointmentWithTime extends Appointment {
  scheduled_time: string | null;
}

interface TodayStats {
  completed: number;
  total: number;
  late: number;
  revenue: number;
  walkIns: number;
}

export function useTodayAppointments() {
  const [appointments, setAppointments] = useState<AppointmentWithTime[]>([]);
  const [loading, setLoading] = useState(true);

  const loadTodayData = useCallback(async () => {
    try {
      const startOfDay = getStartOfDay();
      const endOfDay = getEndOfDay();

      const { data, error } = await supabase
        .from('appointments_api')
        .select('*')
        .gte('scheduled_at', startOfDay.toISOString())
        .lte('scheduled_at', endOfDay.toISOString())
        .order('scheduled_at', { ascending: true });

      if (error) throw error;

      const appointmentsWithTime = (data || []).map((apt) => ({
        ...apt,
        scheduled_time: apt.scheduled_at ? new Date(apt.scheduled_at).toTimeString().slice(0, 5) : null,
      }));

      setAppointments(appointmentsWithTime);
    } catch (error) {
      console.error('Error loading today data:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadTodayData();
    const interval = setInterval(loadTodayData, TIMING_CONFIG.appointments.autoRefreshInterval);
    return () => clearInterval(interval);
  }, [loadTodayData]);

  const currentAppointment = useMemo(() => {
    const currentTime = getCurrentTimeString();

    return appointments.find((apt) => {
      if (apt.status === 'completed' || apt.status === 'cancelled') return false;
      const aptTime = apt.scheduled_time || '00:00';
      const aptEndTime = addMinutes(aptTime, apt.duration_minutes);
      return isTimeInRange(currentTime, aptTime, aptEndTime);
    });
  }, [appointments]);

  const nextAppointment = useMemo(() => {
    const currentTime = getCurrentTimeString();

    return appointments.find((apt) => {
      if (apt.status === 'completed' || apt.status === 'cancelled') return false;
      const aptTime = apt.scheduled_time || '00:00';
      return aptTime > currentTime;
    });
  }, [appointments]);

  const stats: TodayStats = useMemo(() => {
    const completed = appointments.filter((a) => a.status === 'completed').length;
    const total = appointments.filter((a) => a.status !== 'cancelled').length;
    const currentTime = getCurrentTimeString();

    const late = appointments.filter((apt) => {
      if (apt.status === 'completed' || apt.status === 'cancelled') return false;
      const aptTime = apt.scheduled_time || '00:00';
      return aptTime < currentTime;
    }).length;

    return {
      completed,
      total,
      late,
      revenue: completed * 85,
      walkIns: 0,
    };
  }, [appointments]);

  const upcomingAppointments = useMemo(() => {
    const currentTime = getCurrentTimeString();

    return appointments
      .filter((apt) => {
        if (apt.status === 'completed' || apt.status === 'cancelled') return false;
        const aptTime = apt.scheduled_time || '00:00';
        return aptTime > currentTime;
      })
      .slice(0, 5);
  }, [appointments]);

  const completeAppointment = useCallback(async (id: string) => {
    try {
      const { error } = await supabase
        .from('appointments_api')
        .update({ status: 'completed' })
        .eq('id', id);

      if (error) throw error;
      await loadTodayData();
      return { success: true };
    } catch (error) {
      console.error('Error completing appointment:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to complete appointment',
      };
    }
  }, [loadTodayData]);

  return {
    appointments,
    loading,
    currentAppointment,
    nextAppointment,
    upcomingAppointments,
    stats,
    completeAppointment,
    reload: loadTodayData,
  };
}
