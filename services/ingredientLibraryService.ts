
import type { StoredFeedIngredient, ValidatedFeedIngredient } from '../types';
import { v4 as uuidv4 } from 'uuid';
import { PREDEFINED_INGREDIENTS } from './ingredient-data';

const LIBRARY_STORAGE_KEY = 'agriBalanceIngredientLibrary';

export const loadIngredientLibrary = (): StoredFeedIngredient[] => {
  if (typeof window !== 'undefined') {
    try {
      const storedLibrary = localStorage.getItem(LIBRARY_STORAGE_KEY);
      if (storedLibrary) {
        return JSON.parse(storedLibrary) as StoredFeedIngredient[];
      }
      // If no library in localStorage, initialize with predefined data and save it
      localStorage.setItem(LIBRARY_STORAGE_KEY, JSON.stringify(PREDEFINED_INGREDIENTS));
      return PREDEFINED_INGREDIENTS;
    } catch (error) {
      console.error("Error loading ingredient library from localStorage:", error);
      return PREDEFINED_INGREDIENTS; 
    }
  }
  return PREDEFINED_INGREDIENTS;
};

export const saveIngredientToLibrary = (ingredient: ValidatedFeedIngredient): StoredFeedIngredient[] => {
  if (typeof window === 'undefined') return [];

  const library = loadIngredientLibrary();
  const ingredientId = ingredient.id || uuidv4();
  
  const ingredientToStore: StoredFeedIngredient = {
    ...ingredient,
    id: ingredientId,
  };
  
  const existingIndex = library.findIndex(item => item.id === ingredientId);

  if (existingIndex > -1) {
    library[existingIndex] = ingredientToStore;
  } else {
    library.push(ingredientToStore);
  }

  try {
    localStorage.setItem(LIBRARY_STORAGE_KEY, JSON.stringify(library));
  } catch (error) {
    console.error("Error saving ingredient library to localStorage:", error);
  }
  return library;
};

export const removeIngredientFromLibrary = (id: string): StoredFeedIngredient[] => {
  if (typeof window === 'undefined') return [];
  
  let library = loadIngredientLibrary();
  library = library.filter(item => item.id !== id);
  try {
    localStorage.setItem(LIBRARY_STORAGE_KEY, JSON.stringify(library));
  } catch (error) {
    console.error("Error removing ingredient from localStorage:", error);
  }
  return library;
};

export const importIngredientsToLibrary = (importedIngredients: StoredFeedIngredient[]): StoredFeedIngredient[] => {
  if (typeof window === 'undefined') return [];

  const currentLibrary = loadIngredientLibrary();
  const libraryMap = new Map<string, StoredFeedIngredient>(currentLibrary.map(ing => [ing.id, ing]));

  importedIngredients.forEach(importedIng => {
    libraryMap.set(importedIng.id, importedIng); // Overwrites existing or adds new
  });

  const newLibrary = Array.from(libraryMap.values());

  try {
    localStorage.setItem(LIBRARY_STORAGE_KEY, JSON.stringify(newLibrary));
  } catch (error) {
    console.error("Error saving imported ingredients to localStorage:", error);
  }

  return newLibrary;
};
