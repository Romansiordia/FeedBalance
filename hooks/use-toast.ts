
import React from 'react';

type ToastType = 'success' | 'error' | 'info' | 'destructive';

interface Toast {
  id: string;
  type: ToastType;
  title: string;
  description?: string;
}

interface ToastOptions {
  title: string;
  description?: string;
  variant?: ToastType;
}

type ToastFunction = (options: ToastOptions) => void;

let toasts: Toast[] = [];
const listeners: React.Dispatch<React.SetStateAction<Toast[]>>[] = [];

const toast: ToastFunction = ({ title, description, variant = 'info' }) => {
  const newToast: Toast = {
    id: String(Date.now()),
    type: variant,
    title,
    description,
  };
  toasts = [...toasts, newToast];
  listeners.forEach((listener) => listener(toasts));

  setTimeout(() => {
    toasts = toasts.filter((t) => t.id !== newToast.id);
    listeners.forEach((listener) => listener(toasts));
  }, 5000);
};

export const useToast = (): { toast: ToastFunction } => ({ toast });

export const useToastState = (): Toast[] => {
  const [state, setState] = React.useState<Toast[]>(toasts);

  React.useEffect(() => {
    listeners.push(setState);
    return () => {
      const index = listeners.indexOf(setState);
      if (index > -1) {
        listeners.splice(index, 1);
      }
    };
  }, [state]);

  return state;
};
