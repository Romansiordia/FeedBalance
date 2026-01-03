
import React, { createContext, useContext } from 'react';

interface DialogContextProps {
  onOpenChange: (open: boolean) => void;
}

const DialogContext = createContext<DialogContextProps | null>(null);

const Dialog: React.FC<{ open: boolean; onOpenChange: (open: boolean) => void; children: React.ReactNode }> = ({ open, onOpenChange, children }) => {
  if (!open) return null;
  return (
    <DialogContext.Provider value={{ onOpenChange }}>
      <div className="fixed inset-0 z-50 bg-black/60" onClick={() => onOpenChange(false)}>
        <div
          className="fixed left-1/2 top-1/2 z-50 grid w-full -translate-x-1/2 -translate-y-1/2 scale-100 gap-4 border bg-white p-6 shadow-lg sm:rounded-lg"
          onClick={(e) => e.stopPropagation()}
        >
          {children}
        </div>
      </div>
    </DialogContext.Provider>
  );
};

const DialogContent: React.FC<{ className?: string; children: React.ReactNode }> = ({ className, children }) => {
  return <div className={`dialog-content-wrapper ${className}`}>{children}</div>;
};

const DialogHeader: React.FC<{ className?: string; children: React.ReactNode }> = ({ className, children }) => (
  <div className={`flex flex-col space-y-1.5 text-center sm:text-left ${className}`}>{children}</div>
);

const DialogTitle: React.FC<{ className?: string; children: React.ReactNode }> = ({ className, children }) => (
  <h2 className={`text-lg font-semibold leading-none tracking-tight ${className}`}>{children}</h2>
);

const DialogDescription: React.FC<{ className?: string; children: React.ReactNode }> = ({ className, children }) => (
  <p className={`text-sm text-gray-500 ${className}`}>{children}</p>
);

const DialogFooter: React.FC<{ className?: string; children: React.ReactNode }> = ({ className, children }) => (
  <div className={`flex flex-col-reverse sm:flex-row sm:justify-end sm:space-x-2 ${className}`}>{children}</div>
);

const DialogClose: React.FC<{ children: React.ReactNode; asChild?: boolean }> = ({ children }) => {
  const context = useContext(DialogContext);
  return <div onClick={() => context?.onOpenChange(false)}>{children}</div>;
};

export { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogClose };
