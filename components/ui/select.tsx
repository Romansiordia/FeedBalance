import React, { createContext, useContext, useState, useEffect } from 'react';
import { ChevronDown } from 'lucide-react';

interface SelectContextProps {
  value: string;
  open: boolean;
  setOpen: (open: boolean) => void;
  selectedLabel: React.ReactNode;
  handleSelect: (value: string, label: React.ReactNode) => void;
}

const SelectContext = createContext<SelectContextProps | null>(null);

// Forward ref is not strictly needed here, but good practice for UI components.
const SelectItem = React.forwardRef<HTMLDivElement, { value: string; className?: string; children: React.ReactNode }>(({ value, className, children }, ref) => {
  const context = useContext(SelectContext);
  return (
    <div
      ref={ref}
      className={`relative flex w-full cursor-default select-none items-center rounded-sm py-1.5 pl-8 pr-2 text-sm outline-none hover:bg-gray-100 focus:bg-gray-100 data-[state=selected]:bg-gray-100/50 ${className}`}
      onClick={() => {
        context?.handleSelect(value, children);
      }}
      data-state={context?.value === value ? 'selected' : 'unselected'}
    >
      {children}
    </div>
  );
});
SelectItem.displayName = "SelectItem";

const Select: React.FC<{ value: string; onValueChange: (value: string) => void; children: React.ReactNode }> = ({ value, onValueChange, children }) => {
  const [open, setOpen] = useState(false);
  const [selectedLabel, setSelectedLabel] = useState<React.ReactNode>(null);

  useEffect(() => {
    let label: React.ReactNode = null;
    let found = false;

    const findLabelRecursive = (nodes: React.ReactNode) => {
      React.Children.forEach(nodes, node => {
        if (found || !React.isValidElement(node)) return;

        // FIX: Cast props to `any` to safely access properties on the child node, resolving TypeScript errors.
        if ((node.type as any).displayName === "SelectItem" && (node.props as any).value === value) {
          label = (node.props as any).children;
          found = true;
        } else if ((node.props as any).children) {
          findLabelRecursive((node.props as any).children);
        }
      });
    };

    if (value) {
      findLabelRecursive(children);
      setSelectedLabel(label);
    } else {
      setSelectedLabel(null); // Clear label if value is cleared
    }
  }, [value, children]);

  const handleSelect = (newValue: string, newLabel: React.ReactNode) => {
    onValueChange(newValue);
    setSelectedLabel(newLabel);
    setOpen(false);
  };

  return (
    <SelectContext.Provider value={{ value, open, setOpen, selectedLabel, handleSelect }}>
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
      aria-expanded={context?.open}
    >
      {children}
      <ChevronDown className="h-4 w-4 opacity-50" />
    </button>
  );
};

const SelectValue: React.FC<{ placeholder?: string }> = ({ placeholder }) => {
  const context = useContext(SelectContext);
  return <span>{context?.selectedLabel || placeholder}</span>;
};

const SelectContent: React.FC<{ className?: string; children: React.ReactNode }> = ({ className, children }) => {
  const context = useContext(SelectContext);
  if (!context?.open) return null;
  return (
    <div className={`absolute z-50 mt-1 w-full rounded-md border bg-white text-gray-900 shadow-lg ${className}`}>
      <div className="p-1">{children}</div>
    </div>
  );
};

export { Select, SelectTrigger, SelectValue, SelectContent, SelectItem };