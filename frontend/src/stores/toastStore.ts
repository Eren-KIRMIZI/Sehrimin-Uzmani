import { create } from 'zustand';

export type ToastType = 'success' | 'error' | 'info' | 'warning';

export interface Toast {
  id: number;
  type: ToastType;
  message: string;
  duration: number;
}

interface ToastState {
  toasts: Toast[];
  push: (type: ToastType, message: string, duration?: number) => void;
  remove: (id: number) => void;
}

let nextToastId = 1;

export const useToastStore = create<ToastState>((set) => ({
  toasts: [],
  push: (type, message, duration = 4000) => {
    const id = nextToastId++;
    set((s) => ({ toasts: [...s.toasts, { id, type, message, duration }] }));
    if (duration > 0) {
      setTimeout(() => {
        set((s) => ({ toasts: s.toasts.filter(t => t.id !== id) }));
      }, duration);
    }
  },
  remove: (id) => set((s) => ({ toasts: s.toasts.filter(t => t.id !== id) })),
}));

// İmperatif kullanım: toast.success('Kaydedildi')
export const toast = {
  success: (message: string, duration?: number) => useToastStore.getState().push('success', message, duration),
  error: (message: string, duration?: number) => useToastStore.getState().push('error', message, duration ?? 5000),
  info: (message: string, duration?: number) => useToastStore.getState().push('info', message, duration),
  warning: (message: string, duration?: number) => useToastStore.getState().push('warning', message, duration),
};

// Mutation hatalarını tek satırda yakalamak için
export const toastApiError = (err: unknown, fallback = 'Bir hata oluştu') => {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const e = err as any;
  const detail = e?.response?.data?.detail || e?.message;
  toast.error(typeof detail === 'string' ? detail : fallback);
};
