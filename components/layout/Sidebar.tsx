import React from 'react';
import { Archive, BookMarked, ListChecks } from 'lucide-react';

interface SidebarProps {
  onOpenFormulationLibrary: () => void;
  onOpenIngredientLibrary: () => void;
  onOpenRequirementsLibrary: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({
  onOpenFormulationLibrary,
  onOpenIngredientLibrary,
  onOpenRequirementsLibrary,
}) => {
  return (
    <aside className="fixed inset-y-0 left-0 z-40 w-64 bg-cyan-800 text-white shadow-xl">
      <div className="flex items-center justify-center p-4">
        <img src="/logo.svg" alt="Balance-Feed Logo" className="h-10 w-auto" />
      </div>
      <nav className="mt-4 px-2 space-y-2">
        <button
          onClick={onOpenFormulationLibrary}
          className="w-full flex items-center px-3 py-2 text-sm font-medium rounded-md text-cyan-100 hover:bg-cyan-700 hover:text-white"
        >
          <Archive className="mr-3 h-5 w-5" />
          Dietas Guardadas
        </button>
        <button
          onClick={onOpenIngredientLibrary}
          className="w-full flex items-center px-3 py-2 text-sm font-medium rounded-md text-cyan-100 hover:bg-cyan-700 hover:text-white"
        >
          <BookMarked className="mr-3 h-5 w-5" />
          Ingredientes
        </button>
        <button
          onClick={onOpenRequirementsLibrary}
          className="w-full flex items-center px-3 py-2 text-sm font-medium rounded-md text-cyan-100 hover:bg-cyan-700 hover:text-white"
        >
          <ListChecks className="mr-3 h-5 w-5" />
          Requerimientos
        </button>
      </nav>
    </aside>
  );
};

export default Sidebar;
