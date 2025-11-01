import { useEffect } from 'react';
import { useAppointmentStore } from '../presentation/stores/appointmentStore';

export function useAppointments(autoLoad = true) {
  const {
    appointments,
    todayAppointments,
    loading,
    error,
    selectedDate,
    loadAppointments,
    loadTodayAppointments,
    createAppointment,
    updateAppointment,
    deleteAppointment,
    setSelectedDate,
    refresh,
  } = useAppointmentStore();

  useEffect(() => {
    if (autoLoad) {
      loadAppointments();
      loadTodayAppointments();
    }
  }, []);

  return {
    appointments,
    todayAppointments,
    loading,
    error,
    selectedDate,
    loadAppointments,
    loadTodayAppointments,
    createAppointment,
    updateAppointment,
    deleteAppointment,
    setSelectedDate,
    refresh,
  };
}

export function useTodayAppointments() {
  const todayAppointments = useAppointmentStore((state) => state.todayAppointments);
  const loading = useAppointmentStore((state) => state.loading);
  const loadTodayAppointments = useAppointmentStore((state) => state.loadTodayAppointments);

  useEffect(() => {
    loadTodayAppointments();
  }, []);

  return {
    todayAppointments,
    loading,
    refresh: loadTodayAppointments,
  };
}
