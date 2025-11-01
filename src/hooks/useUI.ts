import { useUIStore } from '../presentation/stores/uiStore';

export function useUI() {
  const {
    sidebarOpen,
    theme,
    toggleSidebar,
    setSidebarOpen,
    setTheme,
  } = useUIStore();

  return {
    sidebarOpen,
    theme,
    toggleSidebar,
    setSidebarOpen,
    setTheme,
  };
}

export function useModal() {
  const {
    activeModal,
    modalData,
    openModal,
    closeModal,
  } = useUIStore();

  return {
    activeModal,
    modalData,
    openModal,
    closeModal,
  };
}

export function useNotifications() {
  const {
    notifications,
    addNotification,
    removeNotification,
    clearNotifications,
  } = useUIStore();

  return {
    notifications,
    addNotification,
    removeNotification,
    clearNotifications,
  };
}

export function useLoadingState(key: string) {
  const isLoading = useUIStore((state) => state.isLoading(key));
  const setLoading = useUIStore((state) => state.setLoading);

  return {
    isLoading,
    setLoading: (loading: boolean) => setLoading(key, loading),
  };
}
