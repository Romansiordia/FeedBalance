import React from 'react';
import { Archive, BookMarked, ListChecks } from 'lucide-react';

interface SidebarProps {
  onOpenFormulationLibrary: () => void;
  onOpenIngredientLibrary: () => void;
  onOpenRequirementsLibrary: () => void;
}

const LOGO_BASE64 = `data:image/png;base64,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`;

const Sidebar: React.FC<SidebarProps> = ({
  onOpenFormulationLibrary,
  onOpenIngredientLibrary,
  onOpenRequirementsLibrary,
}) => {
  return (
    <aside className="fixed inset-y-0 left-0 z-40 w-64 bg-cyan-800 text-white shadow-xl">
      <div className="flex items-center justify-center p-4">
        <img src={LOGO_BASE64} alt="Balance-Feed Logo" className="h-10 w-auto" />
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
