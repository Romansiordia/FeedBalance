import React, { createContext, useContext, useState } from 'react';
import { ChevronDown } from 'lucide-react';

interface SelectContextProps {
  value: string;
  onValueChange: (value: string) => void;
  open: boolean;
  setOpen: (open: boolean) => void;
  // FIX: Add children to the context to make them accessible in child components like SelectValue.
  children: React.ReactNode;
}

const SelectContext = createContext<SelectContextProps | null>(null);

const Select: React.FC<{ value: string; onValueChange: (value: string) => void; children: React.ReactNode }> = ({ value, onValueChange, children }) => {
  const [open, setOpen] = useState(false);
  return (
    // FIX: Pass children through the context provider's value.
    <SelectContext.Provider value={{ value, onValueChange, open, setOpen, children }}>
      <div className="relative">{children}</div>
    </SelectContext.Provider>
  );
};

const SelectTrigger: React.FC<{ id?: string; className?: string; children: React.ReactNode }> = ({ id, className, children }) => {
  const context = useContext(SelectContext);
  return (
    <button
      id={id}
      type="button"
      className={`flex h-10 w-full items-center justify-between rounded-md border border-gray-300 bg-white px-3 py-2 text-sm ring-offset-white placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 ${className}`}
      onClick={() => context?.setOpen(!context.open)}
    >
      {children}
      <ChevronDown className="h-4 w-4 opacity-50" />
    </button>
  );
};

const SelectValue: React.FC<{ placeholder?: string }> = ({ placeholder }) => {
    const context = useContext(SelectContext);
    // FIX: Use React.isValidElement as a type guard to safely access props on child elements, preventing runtime errors.
    const selectedChild = React.Children.toArray(context?.children).find(
      (child) => React.isValidElement(child) && child.props.value === context?.value
    );
    // FIX: Use React.isValidElement again to safely access the children prop for rendering.
    return <span>{React.isValidElement(selectedChild) ? selectedChild.props.children : placeholder}</span>;
  };

const SelectContent: React.FC<{ className?: string; children: React.ReactNode }> = ({ className, children }) => {
  const context = useContext(SelectContext);
  if (!context?.open) return null;
  return (
    <div className={`absolute z-50 mt-1 w-full rounded-md border bg-white text-gray-900 shadow-md ${className}`}>
      {children}
    </div>
  );
};

const SelectItem: React.FC<{ value: string; className?: string; children: React.ReactNode }> = ({ value, className, children }) => {
  const context = useContext(SelectContext);
  return (
    <div
      className={`relative flex w-full cursor-default select-none items-center rounded-sm py-1.5 pl-8 pr-2 text-sm outline-none hover:bg-gray-100 focus:bg-gray-100 ${className}`}
      onClick={() => {
        context?.onValueChange(value);
        context?.setOpen(false);
      }}
    >
      {children}
    </div>
  );
};

export { Select, SelectTrigger, SelectValue, SelectContent, SelectItem };
