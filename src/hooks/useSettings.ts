import { useEffect } from 'react';
import { useSettingsStore } from '../presentation/stores/settingsStore';

export function useSettings(autoLoad = true) {
  const {
    clinicSettings,
    bookingSettings,
    notificationSettings,
    brandingSettings,
    loading,
    error,
    initialized,
    loadAllSettings,
    updateClinicSettings,
    updateBookingSettings,
    updateNotificationSettings,
    updateBrandingSettings,
  } = useSettingsStore();

  useEffect(() => {
    if (autoLoad && !initialized) {
      loadAllSettings();
    }
  }, [autoLoad, initialized, loadAllSettings]);

  return {
    clinicSettings,
    bookingSettings,
    notificationSettings,
    brandingSettings,
    loading,
    error,
    initialized,
    loadAllSettings,
    updateClinicSettings,
    updateBookingSettings,
    updateNotificationSettings,
    updateBrandingSettings,
  };
}

export function useClinicSettings() {
  const clinicSettings = useSettingsStore((state) => state.clinicSettings);
  const updateClinicSettings = useSettingsStore((state) => state.updateClinicSettings);
  const loading = useSettingsStore((state) => state.loading);

  return {
    settings: clinicSettings,
    update: updateClinicSettings,
    loading,
  };
}

export function useBookingSettings() {
  const bookingSettings = useSettingsStore((state) => state.bookingSettings);
  const updateBookingSettings = useSettingsStore((state) => state.updateBookingSettings);
  const loading = useSettingsStore((state) => state.loading);

  return {
    settings: bookingSettings,
    update: updateBookingSettings,
    loading,
  };
}
