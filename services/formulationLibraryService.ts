
import type { SavedFormulation, FormulateDietOutput, ValidatedFeedIngredient } from '../types';
import { v4 as uuidv4 } from 'uuid';

const FORMULATION_LIBRARY_STORAGE_KEY = 'agriBalanceFormulationLibrary';

export const loadFormulationLibrary = (): SavedFormulation[] => {
  if (typeof window !== 'undefined') {
    try {
      const storedLibrary = localStorage.getItem(FORMULATION_LIBRARY_STORAGE_KEY);
      if (storedLibrary) {
        const parsedLibrary = JSON.parse(storedLibrary) as SavedFormulation[];
        return parsedLibrary.map(formulation => ({
          ...formulation,
          id: formulation.id || uuidv4(), 
          dateSaved: formulation.dateSaved || new Date().toISOString(), 
        }));
      }
      return [];
    } catch (error) {
      console.error("Error loading formulation library from localStorage:", error);
      return [];
    }
  }
  return [];
};

export const saveFormulationToLibrary = (formulation: Omit<SavedFormulation, 'id' | 'dateSaved'>): SavedFormulation[] => {
  if (typeof window === 'undefined') return [];

  const library = loadFormulationLibrary();
  
  const newSavedFormulation: SavedFormulation = {
    ...formulation,
    id: uuidv4(),
    dateSaved: new Date().toISOString(),
  };

  library.unshift(newSavedFormulation); 

  try {
    localStorage.setItem(FORMULATION_LIBRARY_STORAGE_KEY, JSON.stringify(library));
  } catch (error) {
    console.error("Error saving formulation to localStorage:", error);
  }
  return library;
};

export const removeFormulationFromLibrary = (id: string): SavedFormulation[] => {
  if (typeof window === 'undefined') return [];
  
  let library = loadFormulationLibrary();
  library = library.filter(item => item.id !== id);
  try {
    localStorage.setItem(FORMULATION_LIBRARY_STORAGE_KEY, JSON.stringify(library));
  } catch (error) {
    console.error("Error removing formulation from localStorage:", error);
  }
  return library;
};

const escapeCSVField = (field: any): string => {
  if (field === null || typeof field === 'undefined') {
    return '';
  }
  const stringField = String(field);
  if (stringField.includes(',') || stringField.includes('"') || stringField.includes('\n')) {
    return `"${stringField.replace(/"/g, '""')}"`;
  }
  return stringField;
};

const getChemicalCompositionKeys = (library: SavedFormulation[]): (keyof FormulateDietOutput['chemicalComposition'])[] => {
    const allKeys = new Set<keyof FormulateDietOutput['chemicalComposition']>();
    library.forEach(formulation => {
        if (formulation.formulationResult && formulation.formulationResult.chemicalComposition) {
            (Object.keys(formulation.formulationResult.chemicalComposition) as (keyof FormulateDietOutput['chemicalComposition'])[]).forEach(key => {
                allKeys.add(key);
            });
        }
    });
    const preferredOrder: (keyof FormulateDietOutput['chemicalComposition'])[] = [
        'protein', 'humedad', 'grasa', 'fiber', 'ceniza', 'almidon', 'energy',
        'energiaAves', 'energiaCerdos',
        'calcio', 'fosforo', 'sodio', 'cloro',
        'lisina', 'metionina', 'metCisTotal', 'treonina', 'triptofano',
        'valina', 'isoleusina', 'leusinaTotal'
      ];
    return Array.from(allKeys).sort((a, b) => {
        const indexA = preferredOrder.indexOf(a);
        const indexB = preferredOrder.indexOf(b);
        if (indexA !== -1 && indexB !== -1) return indexA - indexB;
        if (indexA !== -1) return -1;
        if (indexB !== -1) return 1;
        const stringA = String(a);
        const stringB = String(b);
        return stringA.localeCompare(stringB);
    });
};


export const exportFormulationsToCSV = (): string => {
  const library = loadFormulationLibrary();
  if (library.length === 0) return "";

  const chemicalCompositionKeys = getChemicalCompositionKeys(library);

  const headers = [
    'ID Formulación', 'Nombre Formulación', 'Fecha Guardado',
    'Perfil Animal: Tipo', 'Perfil Animal: Etapa Crecimiento', 'Perfil Animal: Nivel Producción',
    'Restricciones Usadas',
    'Ingredientes Usados (JSON)',
    'Resultado - Composición Dieta (JSON)',
    ...chemicalCompositionKeys.map(key => `Química - ${String(key)}`),
    'Resultado - Análisis Costos: Ingredientes (JSON)',
    'Resultado - Análisis Costos: Total',
    'Resultado - Análisis Nutricional General'
  ];

  let csvContent = headers.map(escapeCSVField).join(',') + '\n';

  library.forEach(formulation => {
    const row: string[] = [];
    const fr = formulation.formulationResult;
    
    row.push(escapeCSVField(formulation.id));
    row.push(escapeCSVField(formulation.name));
    row.push(escapeCSVField(formulation.dateSaved));
    row.push(escapeCSVField(formulation.animalProfile.animalType));
    row.push(escapeCSVField(formulation.animalProfile.growthStage));
    row.push(escapeCSVField(formulation.animalProfile.targetProductionLevel));
    row.push(escapeCSVField(formulation.constraintsUsed || ''));
    row.push(escapeCSVField(JSON.stringify(formulation.feedIngredientsUsed)));
    row.push(escapeCSVField(JSON.stringify(fr.dietComposition)));

    chemicalCompositionKeys.forEach(key => {
        const value = fr.chemicalComposition?.[key];
        const formattedValue = (typeof value === 'number') ? value.toFixed(2) : String(value ?? '');
        row.push(escapeCSVField(formattedValue));
    });

    row.push(escapeCSVField(fr.costAnalysis ? JSON.stringify(fr.costAnalysis.ingredientCosts) : '[]'));
    row.push(escapeCSVField(fr.costAnalysis ? fr.costAnalysis.totalDietCost.toFixed(2) : ''));
    row.push(escapeCSVField(fr.nutritionalAnalysis.replace(/\n/g, ' ')));

    csvContent += row.join(',') + '\n';
  });

  return csvContent;
};


export const importFormulationsFromJSON = (jsonString: string): { success: boolean; message: string; updatedLibrary: SavedFormulation[] } => {
  if (typeof window === 'undefined') {
    return { success: false, message: "La importación solo es posible en el navegador.", updatedLibrary: [] };
  }

  let importedFormulations: any[];
  try {
    importedFormulations = JSON.parse(jsonString);
    if (!Array.isArray(importedFormulations)) {
      throw new Error("El archivo JSON no contiene un array de formulaciones.");
    }
  } catch (error) {
    return { success: false, message: error instanceof Error ? error.message : "Error al parsear el archivo JSON.", updatedLibrary: loadFormulationLibrary() };
  }

  const currentLibrary = loadFormulationLibrary();
  const libraryMap = new Map<string, SavedFormulation>(currentLibrary.map(f => [f.id, f]));

  let importedCount = 0;
  let updatedCount = 0;

  importedFormulations.forEach(importedForm => {
    if (typeof importedForm !== 'object' || importedForm === null || !importedForm.id || typeof importedForm.name !== 'string') {
      console.warn("Formulación importada ignorada por falta de ID, nombre o formato incorrecto:", importedForm);
      return;
    }

    const formulationToAdd: SavedFormulation = {
        id: importedForm.id,
        name: importedForm.name,
        dateSaved: importedForm.dateSaved || new Date().toISOString(),
        animalProfile: importedForm.animalProfile || { animalType: "", growthStage: "", targetProductionLevel: "" },
        feedIngredientsUsed: importedForm.feedIngredientsUsed || [],
        constraintsUsed: importedForm.constraintsUsed,
        formulationResult: importedForm.formulationResult || { dietComposition: [], chemicalComposition: {}, nutritionalAnalysis: "" }
    };

    if (libraryMap.has(formulationToAdd.id)) {
      updatedCount++;
    } else {
      importedCount++;
    }
    libraryMap.set(formulationToAdd.id, formulationToAdd);
  });

  const newLibrary = Array.from(libraryMap.values()).sort((a, b) => new Date(b.dateSaved).getTime() - new Date(a.dateSaved).getTime());

  try {
    localStorage.setItem(FORMULATION_LIBRARY_STORAGE_KEY, JSON.stringify(newLibrary));
  } catch (error) {
    return { success: false, message: "Error al guardar la biblioteca importada.", updatedLibrary: currentLibrary };
  }

  return { 
    success: true, 
    message: `Importación completada. ${importedCount} formulaciones añadidas, ${updatedCount} actualizadas.`, 
    updatedLibrary: newLibrary 
  };
};