
import React from 'react';
import { AppStateProvider } from './context/AppStateContext';
import FormulationPage from './pages/FormulationPage';
import { Toaster } from './components/ui/Toaster';

function App() {
  return (
    <AppStateProvider>
      <div className="bg-slate-50 text-gray-900 min-h-screen">
        <FormulationPage />
        <Toaster />
      </div>
    </AppStateProvider>
  );
}

export default App;
