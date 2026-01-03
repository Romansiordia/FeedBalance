
import React, { createContext, useContext, useState, ReactNode } from 'react';
import type { AgriBalanceFormValues, SavedFormulation } from '../types';

interface AppState {
  formState: AgriBalanceFormValues | null;
  setFormState: (state: AgriBalanceFormValues) => void;
  lastFormulation: Omit<SavedFormulation, 'id' | 'name' | 'dateSaved'> | null;
  setLastFormulation: (formulation: Omit<SavedFormulation, 'id' | 'name' | 'dateSaved'> | null) => void;
  isResultsOpen: boolean;
  setIsResultsOpen: (isOpen: boolean) => void;
}

const AppStateContext = createContext<AppState | undefined>(undefined);

export const AppStateProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [formState, setFormState] = useState<AgriBalanceFormValues | null>(null);
  const [lastFormulation, setLastFormulation] = useState<Omit<SavedFormulation, 'id' | 'name' | 'dateSaved'> | null>(null);
  const [isResultsOpen, setIsResultsOpen] = useState(false);

  return (
    <AppStateContext.Provider value={{ formState, setFormState, lastFormulation, setLastFormulation, isResultsOpen, setIsResultsOpen }}>
      {children}
    </AppStateContext.Provider>
  );
};

export const useAppState = (): AppState => {
  const context = useContext(AppStateContext);
  if (context === undefined) {
    throw new Error('useAppState must be used within an AppStateProvider');
  }
  return context;
};
