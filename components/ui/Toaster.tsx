
import React from 'react';
import { useToastState } from '../../hooks/use-toast';
import { CheckCircle, XCircle, AlertTriangle, Info } from 'lucide-react';

const icons = {
  success: <CheckCircle className="h-5 w-5 text-green-500" />,
  error: <XCircle className="h-5 w-5 text-red-500" />,
  destructive: <AlertTriangle className="h-5 w-5 text-red-500" />,
  info: <Info className="h-5 w-5 text-blue-500" />,
};

const borderColors = {
    success: 'border-green-500',
    error: 'border-red-500',
    destructive: 'border-red-500',
    info: 'border-blue-500',
}

export function Toaster() {
  const toasts = useToastState();

  return (
    <div className="fixed top-0 right-0 z-50 p-4 space-y-2 w-full max-w-sm print:hidden">
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className={`bg-white rounded-lg shadow-lg p-4 border-l-4 ${borderColors[toast.type]}`}
        >
          <div className="flex items-start">
            <div className="flex-shrink-0">{icons[toast.type]}</div>
            <div className="ml-3 w-0 flex-1 pt-0.5">
              <p className="text-sm font-medium text-gray-900">{toast.title}</p>
              {toast.description && (
                <p className="mt-1 text-sm text-gray-500">{toast.description}</p>
              )}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
