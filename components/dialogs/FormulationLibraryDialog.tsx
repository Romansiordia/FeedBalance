
import React, { useState, useEffect, useRef } from 'react';
import type { SavedFormulation } from '../../types';
import { loadFormulationLibrary, removeFormulationFromLibrary, exportFormulationsToCSV, importFormulationsFromJSON } from '../../services/formulationLibraryService';
import DietOutputDisplay from '../DietOutputDisplay';
import { Trash2, Eye, Archive, Loader2, UploadCloud, FileText } from 'lucide-react';

interface FormulationLibraryDialogProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  onLibraryUpdate: (updatedLibrary: SavedFormulation[]) => void;
}

const FormulationLibraryDialog: React.FC<FormulationLibraryDialogProps> = ({ isOpen, onOpenChange, onLibraryUpdate }) => {
  const [library, setLibrary] = useState<SavedFormulation[]>([]);
  const [selectedFormulation, setSelectedFormulation] = useState<SavedFormulation | null>(null);
  const [isDetailViewOpen, setIsDetailViewOpen] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      setLibrary(loadFormulationLibrary());
    }
  }, [isOpen]);
  
  const handleDelete = (id: string, name: string) => {
    if (window.confirm(`¿Estás seguro de que quieres eliminar la formulación "${name}"?`)) {
      const updatedLibrary = removeFormulationFromLibrary(id);
      setLibrary(updatedLibrary);
      onLibraryUpdate(updatedLibrary);
    }
  };

  const handleExport = () => {
    const csvData = exportFormulationsToCSV();
    const blob = new Blob([csvData], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", "balance-formulations.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };
  
  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (file.type !== "application/json") {
        alert("Por favor, selecciona un archivo JSON (.json) para importar.");
        if (fileInputRef.current) fileInputRef.current.value = '';
        return;
    }

    setIsImporting(true);
    const reader = new FileReader();
    reader.onload = async (e) => {
      const jsonText = e.target?.result as string;
      const result = importFormulationsFromJSON(jsonText);
      if (result.success) {
        setLibrary(result.updatedLibrary);
        onLibraryUpdate(result.updatedLibrary);
        alert(result.message);
      } else {
        alert(`Error de importación: ${result.message}`);
      }
      setIsImporting(false);
    };
    reader.readAsText(file);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  if (!isOpen) return null;

  return (
    <>
      <div className="fixed inset-0 bg-black bg-opacity-50 z-40 flex justify-center items-center" onClick={() => onOpenChange(false)}>
        <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full p-6 m-4" onClick={e => e.stopPropagation()}>
          <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2 mb-4"><Archive className="text-cyan-600"/> Biblioteca de Dietas</h2>
          <div className="flex justify-end gap-2 mb-4">
              <input type="file" ref={fileInputRef} onChange={handleFileChange} accept=".json" className="hidden"/>
              <button onClick={() => fileInputRef.current?.click()} disabled={isImporting} className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 border border-gray-300 rounded-md hover:bg-gray-200 flex items-center gap-2">
                {isImporting ? <Loader2 className="h-4 w-4 animate-spin"/> : <UploadCloud className="h-4 w-4" />} Importar JSON
              </button>
              <button onClick={handleExport} disabled={library.length === 0} className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 border border-gray-300 rounded-md hover:bg-gray-200 flex items-center gap-2">
                <FileText className="h-4 w-4" /> Exportar CSV
              </button>
          </div>
          <div className="max-h-[60vh] overflow-y-auto border rounded-md">
            {library.length > 0 ? (
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Nombre</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Animal</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Fecha</th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Acciones</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {library.map(item => (
                    <tr key={item.id}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{item.name}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{item.animalProfile.animalType}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{new Date(item.dateSaved).toLocaleDateString()}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium space-x-2">
                        <button onClick={() => { setSelectedFormulation(item); setIsDetailViewOpen(true); }} className="text-cyan-600 hover:text-cyan-800"><Eye /></button>
                        <button onClick={() => handleDelete(item.id, item.name)} className="text-red-600 hover:text-red-900"><Trash2 /></button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : <p className="text-center text-gray-500 py-8">La biblioteca está vacía.</p>}
          </div>
          <div className="mt-6 flex justify-end">
            <button onClick={() => onOpenChange(false)} className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50">Cerrar</button>
          </div>
        </div>
      </div>
      
      {isDetailViewOpen && selectedFormulation && (
        <div className="fixed inset-0 bg-black bg-opacity-75 z-50 flex justify-center items-center" onClick={() => setIsDetailViewOpen(false)}>
            <div className="bg-gray-50 rounded-lg shadow-xl max-w-5xl w-full p-6 m-4 max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
                <DietOutputDisplay diet={selectedFormulation.formulationResult} />
                <div className="mt-6 flex justify-end">
                    <button onClick={() => setIsDetailViewOpen(false)} className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50">Cerrar Detalles</button>
                </div>
            </div>
        </div>
      )}
    </>
  );
};

export default FormulationLibraryDialog;