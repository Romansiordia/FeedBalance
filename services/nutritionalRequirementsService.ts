
import { v4 as uuidv4 } from 'uuid';
import type { NutritionalRequirementProfile, NutritionalRequirementProfileFormValues, NutrientEntryFormValues, AnimalType } from '../types';

const PREDEFINED_LIBRARY: NutritionalRequirementProfile[] = [
  {
    id: 'broiler_starter_0_2w',
    profileDisplayName: 'Pollo Engorde - Iniciador (0-2 sem)',
    animalType: 'broilers',
    growthStageDescription: '0-2 semanas',
    notes: 'Requerimientos típicos para pollos de engorde en la fase de inicio.',
    nutrients: {
      'Energía Metabolizable Aves (kcal/kg)': { target: 3000, unit: 'kcal/kg' },
      'Proteína Cruda (%)': { min: 22, max: 23, unit: '%' },
      'Lisina Total (%)': { target: 1.25, unit: '%' },
      'Metionina Total (%)': { target: 0.55, unit: '%' },
      'Calcio (%)': { min: 0.9, max: 1.0, unit: '%' },
      'Fósforo Disponible (%)': { min: 0.45, max: 0.5, unit: '%' },
    }
  },
  {
    id: 'laying_hens_peak',
    profileDisplayName: 'Gallina Ponedora - Pico Postura',
    animalType: 'laying hens',
    growthStageDescription: 'Pico de producción (aprox. 25-50 semanas)',
    notes: 'Requerimientos para gallinas ponedoras durante su pico de producción.',
    nutrients: {
      'Energía Metabolizable Aves (kcal/kg)': { target: 2800, unit: 'kcal/kg' },
      'Proteína Cruda (%)': { min: 17, max: 18, unit: '%' },
      'Lisina Total (%)': { target: 0.85, unit: '%' },
      'Metionina Total (%)': { target: 0.40, unit: '%' },
      'Calcio (%)': { min: 3.8, max: 4.2, unit: '%' },
    }
  },
  {
    id: 'pig_starter_5_10kg',
    profileDisplayName: 'Cerdo Iniciador (5-10 kg)',
    animalType: 'pigs',
    growthStageDescription: '5-10 kg de peso vivo',
    notes: 'Requerimientos para lechones recién destetados.',
    nutrients: {
      'Energía Digestible Cerdos (kcal/kg)': { target: 3450, unit: 'kcal/kg' },
      'Proteína Cruda (%)': { min: 20, max: 22, unit: '%' },
      'Lisina Digestible SID (%)': { target: 1.35, unit: '%' },
      'Calcio (%)': { target: 0.80, unit: '%' },
    }
  },
];

const LIBRARY_STORAGE_KEY = 'agriBalanceNutritionalRequirementsLibrary';

export const loadNutritionalRequirementsLibrary = (): NutritionalRequirementProfile[] => {
  if (typeof window !== 'undefined') {
    try {
      const storedLibrary = localStorage.getItem(LIBRARY_STORAGE_KEY);
      if (storedLibrary) {
        return JSON.parse(storedLibrary) as NutritionalRequirementProfile[];
      } else {
        localStorage.setItem(LIBRARY_STORAGE_KEY, JSON.stringify(PREDEFINED_LIBRARY));
        return PREDEFINED_LIBRARY;
      }
    } catch (error) {
      console.error("Error loading nutritional requirements library from localStorage:", error);
      return PREDEFINED_LIBRARY;
    }
  }
  return PREDEFINED_LIBRARY;
};

export const saveNutritionalRequirementProfile = (profileData: NutritionalRequirementProfileFormValues): NutritionalRequirementProfile[] => {
    if (typeof window === 'undefined') return PREDEFINED_LIBRARY;
  
    const library = loadNutritionalRequirementsLibrary();
    
    const nutrientsRecord: Record<string, { target?: number; min?: number; max?: number; unit: string }> = {};
    profileData.nutrientEntries.forEach(entry => {
        // Ensure values are numbers or undefined
        // FIX: Removed comparison with empty string `''` as the value is already a number or undefined.
        const target = entry.target !== undefined && entry.target !== null ? Number(entry.target) : undefined;
        // FIX: Removed comparison with empty string `''` as the value is already a number or undefined.
        const min = entry.min !== undefined && entry.min !== null ? Number(entry.min) : undefined;
        // FIX: Removed comparison with empty string `''` as the value is already a number or undefined.
        const max = entry.max !== undefined && entry.max !== null ? Number(entry.max) : undefined;

        nutrientsRecord[entry.nutrientName] = {
            target: isNaN(target!) ? undefined : target,
            min: isNaN(min!) ? undefined : min,
            max: isNaN(max!) ? undefined : max,
            unit: entry.unit,
        };
    });

    if (profileData.id) { // Editing
      const index = library.findIndex(p => p.id === profileData.id);
      if (index !== -1) {
        library[index] = {
            ...library[index],
            profileDisplayName: profileData.profileDisplayName,
            animalType: profileData.animalType,
            growthStageDescription: profileData.growthStageDescription,
            notes: profileData.notes,
            nutrients: nutrientsRecord,
        };
      } else { // ID present but not found, treat as new
         library.push({
            id: uuidv4(),
            profileDisplayName: profileData.profileDisplayName,
            animalType: profileData.animalType,
            growthStageDescription: profileData.growthStageDescription,
            notes: profileData.notes,
            nutrients: nutrientsRecord,
        });
      }
    } else { // Adding new
        library.push({
            id: uuidv4(),
            profileDisplayName: profileData.profileDisplayName,
            animalType: profileData.animalType,
            growthStageDescription: profileData.growthStageDescription,
            notes: profileData.notes,
            nutrients: nutrientsRecord,
        });
    }
  
    try {
      localStorage.setItem(LIBRARY_STORAGE_KEY, JSON.stringify(library));
    } catch (error) {
      console.error("Error saving nutritional requirement profile to localStorage:", error);
    }
    return library;
  };
  

export const removeNutritionalRequirementProfile = (id: string): NutritionalRequirementProfile[] => {
  if (typeof window === 'undefined') return PREDEFINED_LIBRARY;
  
  let library = loadNutritionalRequirementsLibrary();
  library = library.filter(item => item.id !== id);
  try {
    localStorage.setItem(LIBRARY_STORAGE_KEY, JSON.stringify(library));
  } catch (error) {
    console.error("Error removing nutritional requirement profile from localStorage:", error);
  }
  return library;
};


// Helper to convert stored profile to form values
export const convertProfileToFormValues = (profile: NutritionalRequirementProfile): NutritionalRequirementProfileFormValues => {
    // FIX: The form expects string values for number inputs to handle empty fields gracefully.
    // The type `NutrientEntryFormValues` was updated to reflect this, so we now convert numbers to strings.
    const nutrientEntries: NutrientEntryFormValues[] = Object.entries(profile.nutrients).map(([name, value]) => ({
        fieldId: uuidv4(), // Generate a new fieldId for the form
        nutrientName: name,
        target: value.target !== undefined ? String(value.target) : '',
        min: value.min !== undefined ? String(value.min) : '',
        max: value.max !== undefined ? String(value.max) : '',
        unit: value.unit,
    }));

    return {
        id: profile.id,
        profileDisplayName: profile.profileDisplayName,
        animalType: profile.animalType as AnimalType,
        growthStageDescription: profile.growthStageDescription,
        notes: profile.notes || '',
        nutrientEntries: nutrientEntries,
    };
};
