import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';

interface UIState {
  sidebarOpen: boolean;
  theme: 'light' | 'dark' | 'system';
  activeModal: string | null;
  modalData: Record<string, unknown>;
  notifications: Notification[];
  loading: Record<string, boolean>;
}

interface Notification {
  id: string;
  type: 'success' | 'error' | 'warning' | 'info';
  message: string;
  duration?: number;
  createdAt: number;
}

interface UIActions {
  toggleSidebar: () => void;
  setSidebarOpen: (open: boolean) => void;
  setTheme: (theme: 'light' | 'dark' | 'system') => void;
  openModal: (modalId: string, data?: Record<string, unknown>) => void;
  closeModal: () => void;
  addNotification: (notification: Omit<Notification, 'id' | 'createdAt'>) => void;
  removeNotification: (id: string) => void;
  clearNotifications: () => void;
  setLoading: (key: string, loading: boolean) => void;
  isLoading: (key: string) => boolean;
}

type UIStore = UIState & UIActions;

const initialState: UIState = {
  sidebarOpen: true,
  theme: 'light',
  activeModal: null,
  modalData: {},
  notifications: [],
  loading: {},
};

export const useUIStore = create<UIStore>()(
  devtools(
    persist(
      immer((set, get) => ({
        ...initialState,

        toggleSidebar: () => {
          set((state) => {
            state.sidebarOpen = !state.sidebarOpen;
          });
        },

        setSidebarOpen: (open: boolean) => {
          set((state) => {
            state.sidebarOpen = open;
          });
        },

        setTheme: (theme: 'light' | 'dark' | 'system') => {
          set((state) => {
            state.theme = theme;
          });
        },

        openModal: (modalId: string, data?: Record<string, unknown>) => {
          set((state) => {
            state.activeModal = modalId;
            state.modalData = data || {};
          });
        },

        closeModal: () => {
          set((state) => {
            state.activeModal = null;
            state.modalData = {};
          });
        },

        addNotification: (notification: Omit<Notification, 'id' | 'createdAt'>) => {
          const id = Math.random().toString(36).substr(2, 9);
          const newNotification: Notification = {
            ...notification,
            id,
            createdAt: Date.now(),
          };

          set((state) => {
            state.notifications.push(newNotification);
          });

          if (notification.duration !== 0) {
            setTimeout(() => {
              get().removeNotification(id);
            }, notification.duration || 5000);
          }
        },

        removeNotification: (id: string) => {
          set((state) => {
            state.notifications = state.notifications.filter((n) => n.id !== id);
          });
        },

        clearNotifications: () => {
          set((state) => {
            state.notifications = [];
          });
        },

        setLoading: (key: string, loading: boolean) => {
          set((state) => {
            state.loading[key] = loading;
          });
        },

        isLoading: (key: string) => {
          return get().loading[key] || false;
        },
      })),
      {
        name: 'ui-store',
        partialize: (state) => ({
          sidebarOpen: state.sidebarOpen,
          theme: state.theme,
        }),
      }
    ),
    { name: 'UIStore' }
  )
);
