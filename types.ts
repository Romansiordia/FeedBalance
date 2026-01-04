import { z } from 'zod';

export const AnimalTypes = ["pigs", "laying hens", "broilers", "pets"] as const;
export type AnimalType = (typeof AnimalTypes)[number];

export interface AnimalProfile {
  animalType: AnimalType | "";
  growthStage: string;
  targetProductionLevel: string;
}

const optionalCoercedNumber = z.preprocess(
    // FIX: Replaced `z.coerce.number` with a manual coercion in `preprocess` followed by `z.number()`.
    // This pattern is more compatible with older Zod versions where `z.coerce.number` might not support error messages.
    (val) => {
        if (val === "" || val === null || val === undefined) return undefined;
        const num = Number(val);
        return isNaN(num) ? val : num; // Pass invalid string to trigger error from z.number
    },
    // FIX: Changed `required_error` to `invalid_type_error` to resolve Zod schema error.
    z.number({ invalid_type_error: "Debe ser un número" }).optional()
);

// For form validation and data structure
export const FeedIngredientSchema = z.object({
  id: z.string().optional(),
  name: z.string().min(1, "Nombre del ingrediente es requerido"),
  price: z.coerce.number().min(0, "Precio debe ser un valor no negativo").default(0),
  protein: optionalCoercedNumber,
  humedad: optionalCoercedNumber,
  grasa: optionalCoercedNumber,
  fiber: optionalCoercedNumber,
  ceniza: optionalCoercedNumber,
  almidon: optionalCoercedNumber,
  fdn: optionalCoercedNumber,
  fda: optionalCoercedNumber,
  energy: optionalCoercedNumber,
  energiaAves: optionalCoercedNumber,
  energiaCerdos: optionalCoercedNumber,
  lactosa: optionalCoercedNumber,
  calcio: optionalCoercedNumber,
  fosforo: optionalCoercedNumber,
  fosforoFitico: optionalCoercedNumber,
  zinc: optionalCoercedNumber,
  cobre: optionalCoercedNumber,
  hierro: optionalCoercedNumber,
  manganeso: optionalCoercedNumber,
  cloro: optionalCoercedNumber,
  sodio: optionalCoercedNumber,
  azufre: optionalCoercedNumber,
  potasio: optionalCoercedNumber,
  magnesio: optionalCoercedNumber,
  lisina: optionalCoercedNumber,
  lisinaDigestible: optionalCoercedNumber,
  metionina: optionalCoercedNumber,
  metioninaDigestible: optionalCoercedNumber,
  metCisTotal: optionalCoercedNumber,
  metCisDigestible: optionalCoercedNumber,
  triptofano: optionalCoercedNumber,
  argininaTotal: optionalCoercedNumber,
  argininaDigestible: optionalCoercedNumber,
  leusinaTotal: optionalCoercedNumber,
  leusinaDigestible: optionalCoercedNumber,
  valina: optionalCoercedNumber,
  valinaDigestible: optionalCoercedNumber,
  treonina: optionalCoercedNumber,
  isoleusina: optionalCoercedNumber,
  otherNutrients: z.string().optional(),
});
export type ValidatedFeedIngredient = z.infer<typeof FeedIngredientSchema>;

// This type is used for form values which can be string before coercion
export type FeedIngredientFormValues = {
    [K in keyof ValidatedFeedIngredient]: ValidatedFeedIngredient[K] extends number | undefined ? string | number : ValidatedFeedIngredient[K];
} & { id: string };

// This type represents a stored ingredient, with numeric values
export type StoredFeedIngredient = ValidatedFeedIngredient & { id: string };


export const AgriBalanceFormSchema = z.object({
  animalProfile: z.object({
    // FIX: Changed `required_error` to `invalid_type_error` to resolve the Zod error.
    // `invalid_type_error` is supported in this context.
    animalType: z.enum(AnimalTypes, { invalid_type_error: "Tipo de animal es requerido" }),
    growthStage: z.string().min(1, "Etapa de crecimiento es requerida"),
    targetProductionLevel: z.string().min(1, "Nivel de producción objetivo es requerido"),
  }),
  feedIngredients: z.array(FeedIngredientSchema).min(1, "Al menos un ingrediente es requerido"),
  constraints: z.string().optional(),
});

export type AgriBalanceFormValues = z.infer<typeof AgriBalanceFormSchema>;

// AI Flow types
export interface FormulateDietInput {
    animalType: AnimalType | "";
    growthStage: string;
    targetProductionLevel: string;
    feedIngredients: ValidatedFeedIngredient[];
    constraints?: string;
}

export type ChemicalComposition = Omit<StoredFeedIngredient, 'id' | 'name' | 'price' | 'otherNutrients'>;

export interface FormulateDietOutput {
    dietComposition: {
        ingredient: string;
        percentage: number;
    }[];
    chemicalComposition: ChemicalComposition;
    costAnalysis?: {
        ingredientCosts: {
            ingredient: string;
            percentage: number;
            pricePerUnit: number;
            costContribution: number;
        }[];
        totalDietCost: number;
    };
    nutritionalAnalysis: string;
}

export interface SuggestIngredientsInput {
    animalType: AnimalType | "";
    growthStage: string;
}

export interface SuggestIngredientsOutput {
    suggestedIngredients: string[];
}


// Structure for a saved formulation
export interface SavedFormulation {
  id: string;
  name: string;
  dateSaved: string; // ISO string
  animalProfile: AnimalProfile;
  feedIngredientsUsed: ValidatedFeedIngredient[];
  constraintsUsed?: string;
  formulationResult: FormulateDietOutput;
}

// Nutritional Requirements Library Types
export interface NutrientRequirementValue {
  target?: number;
  min?: number;
  max?: number;
  unit: string;
}

export interface NutritionalRequirementProfile {
  id:string;
  profileDisplayName: string;
  animalType: AnimalType | string;
  growthStageDescription: string;
  notes?: string;
  nutrients: Record<string, NutrientRequirementValue>;
}

// For form validation (using string for optional number fields to handle empty inputs)
export const NutrientEntrySchema = z.object({
  fieldId: z.string().uuid(), // For React key prop in useFieldArray
  nutrientName: z.string().min(1, "Nombre del nutriente es requerido"),
  target: optionalCoercedNumber,
  min: optionalCoercedNumber,
  max: optionalCoercedNumber,
  unit: z.string().min(1, "Unidad es requerida"),
});
// FIX: Redefined `NutrientEntryFormValues` to allow string values for number fields,
// which is necessary for form inputs and consistent with `FeedIngredientFormValues`.
type ValidatedNutrientEntry = z.infer<typeof NutrientEntrySchema>;
export type NutrientEntryFormValues = {
    [K in keyof ValidatedNutrientEntry]: ValidatedNutrientEntry[K] extends number | undefined ? string | number | undefined : ValidatedNutrientEntry[K]
};

export const NutritionalRequirementProfileFormSchema = z.object({
  id: z.string().optional(), // Present if editing
  profileDisplayName: z.string().min(1, "Nombre de perfil es requerido"),
  // FIX: Changed `required_error` to `invalid_type_error` to resolve the Zod error.
  animalType: z.enum(AnimalTypes, { invalid_type_error: "Tipo de animal es requerido" }),
  growthStageDescription: z.string().min(1, "Descripción de etapa es requerida"),
  notes: z.string().optional(),
  nutrientEntries: z.array(NutrientEntrySchema)
    .min(1, "Debe haber al menos un nutriente")
    .refine(entries => { // Ensure nutrient names are unique within a profile
      const names = entries.map(e => e.nutrientName);
      return new Set(names).size === names.length;
    }, { message: "Los nombres de los nutrientes deben ser únicos dentro de un perfil." }),
});
// FIX: Redefined `NutritionalRequirementProfileFormValues` to use the new `NutrientEntryFormValues`
// to ensure type consistency for form state.
type ValidatedNutritionalRequirementProfileFormValues = z.infer<typeof NutritionalRequirementProfileFormSchema>;
export type NutritionalRequirementProfileFormValues = Omit<ValidatedNutritionalRequirementProfileFormValues, 'nutrientEntries'> & {
  nutrientEntries: NutrientEntryFormValues[];
};