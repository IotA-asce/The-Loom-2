/**
 * UI Store
 * 
 * Manages UI state including sidebar state, modal state, and other
 * transient UI concerns. Not persisted across sessions.
 */

import { create } from 'zustand';
import { devtools } from 'zustand/middleware';

/**
 * Available modal types
 */
export type ModalType = 
  | 'settings'
  | 'providerConfig'
  | 'mangaUpload'
  | 'analysisProgress'
  | 'anchorDetail'
  | 'branchDetail'
  | 'characterDetail'
  | 'confirmDelete'
  | 'exportOptions'
  | null;

/**
 * Toast notification type
 */
export interface Toast {
  id: string;
  type: 'success' | 'error' | 'warning' | 'info';
  message: string;
  duration?: number;
  action?: {
    label: string;
    onClick: () => void;
  };
}

/**
 * Sidebar panel types
 */
export type SidebarPanel = 'library' | 'timeline' | 'characters' | 'branches' | 'settings';

/**
 * UI state interface
 */
export interface UIState {
  // Sidebar state
  sidebarOpen: boolean;
  sidebarPanel: SidebarPanel;
  sidebarWidth: number;
  
  // Modal state
  activeModal: ModalType;
  modalData: Record<string, unknown> | null;
  
  // Toast notifications
  toasts: Toast[];
  
  // Loading states
  globalLoading: boolean;
  loadingMessage: string;
  
  // Actions
  setSidebarOpen: (open: boolean) => void;
  setSidebarPanel: (panel: SidebarPanel) => void;
  setSidebarWidth: (width: number) => void;
  toggleSidebar: () => void;
  
  openModal: (modal: ModalType, data?: Record<string, unknown>) => void;
  closeModal: () => void;
  
  addToast: (toast: Omit<Toast, 'id'>) => void;
  removeToast: (id: string) => void;
  clearToasts: () => void;
  
  setGlobalLoading: (loading: boolean, message?: string) => void;
  
  reset: () => void;
}

/**
 * Generate unique ID for toasts
 */
const generateId = (): string => {
  return `${Date.now()}-${Math.random().toString(36).substring(2, 11)}`;
};

/**
 * Default UI state
 */
const defaultState: Omit<
  UIState,
  | 'setSidebarOpen'
  | 'setSidebarPanel'
  | 'setSidebarWidth'
  | 'toggleSidebar'
  | 'openModal'
  | 'closeModal'
  | 'addToast'
  | 'removeToast'
  | 'clearToasts'
  | 'setGlobalLoading'
  | 'reset'
> = {
  sidebarOpen: true,
  sidebarPanel: 'library',
  sidebarWidth: 280,
  activeModal: null,
  modalData: null,
  toasts: [],
  globalLoading: false,
  loadingMessage: '',
};

/**
 * UI store (not persisted - transient state only)
 */
export const useUIStore = create<UIState>()(
  devtools(
    (set, get) => ({
      ...defaultState,
      
      setSidebarOpen: (sidebarOpen) => {
        set({ sidebarOpen }, false, 'setSidebarOpen');
      },
      
      setSidebarPanel: (sidebarPanel) => {
        set({ sidebarPanel }, false, 'setSidebarPanel');
      },
      
      setSidebarWidth: (sidebarWidth) => {
        // Clamp width between min and max
        const clampedWidth = Math.max(200, Math.min(400, sidebarWidth));
        set({ sidebarWidth: clampedWidth }, false, 'setSidebarWidth');
      },
      
      toggleSidebar: () => {
        set({ sidebarOpen: !get().sidebarOpen }, false, 'toggleSidebar');
      },
      
      openModal: (activeModal, modalData = null) => {
        set({ activeModal, modalData }, false, 'openModal');
      },
      
      closeModal: () => {
        set({ activeModal: null, modalData: null }, false, 'closeModal');
      },
      
      addToast: (toast) => {
        const id = generateId();
        const newToast: Toast = { ...toast, id };
        set(
          { toasts: [...get().toasts, newToast] },
          false,
          'addToast'
        );
        
        // Auto-remove toast after duration
        const duration = toast.duration ?? 5000;
        if (duration > 0) {
          setTimeout(() => {
            get().removeToast(id);
          }, duration);
        }
      },
      
      removeToast: (id) => {
        set(
          { toasts: get().toasts.filter((t) => t.id !== id) },
          false,
          'removeToast'
        );
      },
      
      clearToasts: () => {
        set({ toasts: [] }, false, 'clearToasts');
      },
      
      setGlobalLoading: (globalLoading, loadingMessage = '') => {
        set({ globalLoading, loadingMessage }, false, 'setGlobalLoading');
      },
      
      reset: () => {
        set(defaultState, false, 'resetUI');
      },
    }),
    {
      name: 'UIStore',
      enabled: process.env.NODE_ENV === 'development',
    }
  )
);

/**
 * Convenience hook for toast notifications
 */
export const useToast = () => {
  const addToast = useUIStore((state) => state.addToast);
  
  return {
    success: (message: string, duration?: number) =>
      addToast({ type: 'success', message, duration }),
    error: (message: string, duration?: number) =>
      addToast({ type: 'error', message, duration }),
    warning: (message: string, duration?: number) =>
      addToast({ type: 'warning', message, duration }),
    info: (message: string, duration?: number) =>
      addToast({ type: 'info', message, duration }),
  };
};
