import React, { useState, useEffect, useMemo } from 'react';
import { useForm, useFieldArray, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { v4 as uuidv4 } from 'uuid';
import { AgriBalanceFormSchema, type AgriBalanceFormValues, AnimalTypes, type AnimalType, type FeedIngredientFormValues, type StoredFeedIngredient, type ValidatedFeedIngredient, type NutritionalRequirementProfile, FeedIngredientSchema } from '../types';
import { formulateDiet, suggestIngredients } from '../services/geminiService';
import { loadIngredientLibrary } from '../services/ingredientLibraryService';
import { loadNutritionalRequirementsLibrary } from '../services/nutritionalRequirementsService';
import { useAppState } from '../context/AppStateContext';

import Sidebar from '../components/layout/Sidebar';
import Header from '../components/layout/Header';
import IngredientLibraryDialog from '../components/dialogs/IngredientLibraryDialog';
import FormulationLibraryDialog from '../components/dialogs/FormulationLibraryDialog';
// FIX: Changed to a named import as the module does not have a default export.
import { NutritionalRequirementsLibraryDialog } from '../components/dialogs/NutritionalRequirementsLibraryDialog';
import SelectRequirementsDialog from '../components/dialogs/SelectRequirementsDialog';
import ResultsPage from './ResultsPage';
import { Button } from '../components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { ScrollArea } from '../components/ui/scroll-area';

import { PlusCircle, Trash2, Calculator, Loader2, AlertTriangle, Lightbulb, Upload, Library, BookMarked, ListChecks, DollarSign, Beaker, KeyRound } from 'lucide-react';

const defaultIngredientValues: Omit<FeedIngredientFormValues, 'id' | 'name' | 'price'> = {
  protein: '', humedad: '', grasa: '', fiber: '', ceniza: '', almidon: '',
  fdn: '', fda: '', energy: '', energiaAves: '', energiaCerdos: '', lactosa: '',
  calcio: '', fosforo: '', fosforoFitico: '', zinc: '', cobre: '', hierro: '',
  manganeso: '', cloro: '', sodio: '', azufre: '', potasio: '', magnesio: '',
  lisina: '', lisinaDigestible: '', metionina: '', metioninaDigestible: '',
  metCisTotal: '', metCisDigestible: '', triptofano: '', argininaTotal: '',
  argininaDigestible: '', leusinaTotal: '', leusinaDigestible: '', valina: '',
  valinaDigestible: '', treonina: '', isoleusina: '', otherNutrients: ''
};

const FormulationPage: React.FC = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingSuggestions, setIsLoadingSuggestions] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [suggestedIngredientNames, setSuggestedIngredientNames] = useState<string[]>([]);
  
  const { formState: appFormState, setFormState, setLastFormulation, isResultsOpen, setIsResultsOpen } = useAppState();

  const [isIngredientLibraryOpen, setIsIngredientLibraryOpen] = useState(false);
  const [ingredientLibrary, setIngredientLibrary] = useState<StoredFeedIngredient[]>([]);
  
  const [isFormulationLibraryOpen, setIsFormulationLibraryOpen] = useState(false);

  const [isNutritionalRequirementsLibraryOpen, setIsNutritionalRequirementsLibraryOpen] = useState(false);
  const [nutritionalRequirementsLibrary, setNutritionalRequirementsLibrary] = useState<NutritionalRequirementProfile[]>([]);
  const [isSelectRequirementsDialogOpen, setIsSelectRequirementsDialogOpen] = useState(false);
  
  const isApiKeySet = useMemo(() => {
    try {
      // Vite exposes client-side env variables using `import.meta.env`
      // and they must be prefixed with VITE_.
      // FIX: Cast to `any` to bypass TypeScript error when `vite/client` types are not available.
      return !!((import.meta as any).env.VITE_API_KEY && (import.meta as any).env.VITE_API_KEY.length > 0);
    } catch (e) {
      // This might happen in environments where import.meta.env is not defined.
      return false;
    }
  }, []);
  
  // FIX: Removed explicit generic from useForm to let types be inferred from defaultValues.
  // This resolves type conflicts between form state (which can contain strings for number fields) and the Zod schema.
  const form = useForm({
    resolver: zodResolver(AgriBalanceFormSchema),
    // FIX: Cast defaultValues to `any` to resolve type mismatch between form state (which can have empty strings for numbers) and the final validated type.
    defaultValues: (appFormState || {
      animalProfile: { animalType: "", growthStage: '', targetProductionLevel: '' },
      feedIngredients: [{ id: uuidv4(), name: '', price: '', ...defaultIngredientValues }],
      constraints: '',
    }) as any,
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "feedIngredients",
  });
  
  useEffect(() => {
    const subscription = form.watch((value) => {
      setFormState(value as AgriBalanceFormValues);
    });
    return () => subscription.unsubscribe();
  }, [form, setFormState]);

  useEffect(() => {
    setIngredientLibrary(loadIngredientLibrary());
    setNutritionalRequirementsLibrary(loadNutritionalRequirementsLibrary());
  }, []);

  const handleIngredientLibraryUpdate = (updatedLibrary: StoredFeedIngredient[]) => {
    setIngredientLibrary(updatedLibrary);
  };

  // FIX: Updated the 'data' parameter type to AgriBalanceFormValues, which is the validated type returned by the zodResolver.
  const onSubmit = async (data: AgriBalanceFormValues) => {
    setIsLoading(true);
    setError(null);

    const apiIngredients: ValidatedFeedIngredient[] = data.feedIngredients.map(ing => {
        const validated = AgriBalanceFormSchema.shape.feedIngredients.element.parse(ing);
        return validated;
    });

    try {
      const result = await formulateDiet({
        animalType: data.animalProfile.animalType,
        growthStage: data.animalProfile.growthStage,
        targetProductionLevel: data.animalProfile.targetProductionLevel,
        feedIngredients: apiIngredients,
        constraints: data.constraints,
      });
      setLastFormulation({
        formulationResult: result,
        animalProfile: data.animalProfile,
        feedIngredientsUsed: apiIngredients,
        constraintsUsed: data.constraints,
      });
      setIsResultsOpen(true);
    } catch (e) {
      const errorMessage = e instanceof Error ? e.message : "Ocurrió un error desconocido.";
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSuggestIngredients = async () => {
    const animalProfile = form.getValues("animalProfile");
    if (!animalProfile.animalType || !animalProfile.growthStage) {
      alert("Por favor, selecciona un tipo de animal e ingresa una etapa de crecimiento.");
      return;
    }
    setIsLoadingSuggestions(true);
    setError(null);
    try {
      const result = await suggestIngredients({
        animalType: animalProfile.animalType,
        growthStage: animalProfile.growthStage,
      });
      setSuggestedIngredientNames(result.suggestedIngredients || []);
    } catch (e) {
       const errorMessage = e instanceof Error ? e.message : "Ocurrió un error desconocido.";
       setError(errorMessage);
    } finally {
      setIsLoadingSuggestions(false);
    }
  };

  const addSuggestedIngredientToForm = (name: string) => {
    // FIX: Cast the appended object to 'any' to resolve a type mismatch.
    // The form state allows strings for number fields, which differs from the strictly-typed schema.
    append({ id: uuidv4(), name, price: 0, ...defaultIngredientValues } as any);
  };
  
  const handleSelectIngredientFromLibrary = (ingredientId: string) => {
    if (!ingredientId) return;

    const libIngredient = ingredientLibrary.find(ing => ing.id === ingredientId);

    if (libIngredient) {
      const formValues: FeedIngredientFormValues = Object.entries(libIngredient).reduce((acc, [key, value]) => {
        // @ts-ignore
        acc[key] = value !== undefined && value !== null ? String(value) : '';
        return acc;
      }, { id: uuidv4() } as FeedIngredientFormValues);
      
      // FIX: Parse the string-based form values with the Zod schema to coerce and validate types before appending.
      const validatedIngredient = FeedIngredientSchema.parse(formValues);
      append(validatedIngredient);
    }
  };

  const handleApplyRequirementsProfile = (profile: NutritionalRequirementProfile) => {
    form.setValue("animalProfile.animalType", profile.animalType as AnimalType);
    form.setValue("animalProfile.growthStage", profile.growthStageDescription);
    form.setValue("animalProfile.targetProductionLevel", profile.profileDisplayName);

    let constraintsText = `Requerimientos del perfil "${profile.profileDisplayName}":\n`;
    Object.entries(profile.nutrients).forEach(([nutrientName, details]) => {
        constraintsText += `- ${nutrientName}: `;
        if (details.target !== undefined) constraintsText += `objetivo ${details.target}${details.unit} `;
        if (details.min !== undefined) constraintsText += `mín ${details.min}${details.unit} `;
        if (details.max !== undefined) constraintsText += `máx ${details.max}${details.unit} `;
        constraintsText += '\n';
    });

    const existingConstraints = form.getValues("constraints");
    form.setValue("constraints", existingConstraints ? `${existingConstraints}\n\n${constraintsText}` : constraintsText);
    setIsSelectRequirementsDialogOpen(false);
  };
  
  if (isResultsOpen) {
    return <ResultsPage />;
  }

  return (
    <div className="min-h-screen w-full bg-slate-50">
      <Sidebar 
        onOpenFormulationLibrary={() => setIsFormulationLibraryOpen(true)}
        onOpenIngredientLibrary={() => setIsIngredientLibraryOpen(true)}
        onOpenRequirementsLibrary={() => setIsNutritionalRequirementsLibraryOpen(true)}
      />

      <div className="pl-64">
        <Header title="Formulador de Dietas" />
        <main className="p-8 max-w-5xl mx-auto">
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
              <div className="p-6 bg-white rounded-lg shadow-md border border-gray-200">
                  <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2 mb-2"><Beaker className="text-cyan-600"/> 1. Perfil del Animal</h2>
                  <p className="text-sm text-gray-500 mb-4">Especifica el tipo de animal, etapa y producción.</p>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div>
                      <label htmlFor="animalType" className="block text-sm font-medium text-gray-700 mb-1">Tipo de Animal</label>
                      <Controller
                      control={form.control}
                      name="animalProfile.animalType"
                      render={({ field }) => (
                        <select {...field} id="animalType" className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-cyan-500 focus:border-cyan-500 sm:text-sm rounded-md">
                          <option value="" disabled>Selecciona tipo...</option>
                          {AnimalTypes.map(type => {
                            return (
                              <option key={type} value={type}>
                                  {type.charAt(0).toUpperCase() + type.slice(1)}
                              </option>
                            );
                          })}
                        </select>
                      )}
                      />
                      {form.formState.errors.animalProfile?.animalType && <p className="text-sm text-red-600 mt-1">{form.formState.errors.animalProfile.animalType.message}</p>}
                    </div>
                    <div>
                      <label htmlFor="growthStage" className="block text-sm font-medium text-gray-700 mb-1">Etapa de Crecimiento</label>
                      <input id="growthStage" {...form.register("animalProfile.growthStage")} placeholder="Ej: Iniciador, Engorde" className="mt-1 focus:ring-cyan-500 focus:border-cyan-500 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md" />
                      {form.formState.errors.animalProfile?.growthStage && <p className="text-sm text-red-600 mt-1">{form.formState.errors.animalProfile.growthStage.message}</p>}
                    </div>
                    <div>
                      <label htmlFor="targetProductionLevel" className="block text-sm font-medium text-gray-700 mb-1">Nivel de Producción</label>
                      <input id="targetProductionLevel" {...form.register("animalProfile.targetProductionLevel")} placeholder="Ej: Alta producción" className="mt-1 focus:ring-cyan-500 focus:border-cyan-500 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md" />
                      {form.formState.errors.animalProfile?.targetProductionLevel && <p className="text-sm text-red-600 mt-1">{form.formState.errors.animalProfile.targetProductionLevel.message}</p>}
                    </div>
                  </div>
                  <div className="mt-4">
                      <Button type="button" size="sm" onClick={() => setIsSelectRequirementsDialogOpen(true)}>
                          <Upload className="h-4 w-4 mr-2" /> Cargar Requerimientos
                      </Button>
                  </div>
              </div>

              <div className="p-6 bg-white rounded-lg shadow-md border border-gray-200">
                  <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2 mb-2"><BookMarked className="text-cyan-600"/> 2. Ingredientes</h2>
                  <p className="text-sm text-gray-500 mb-4">Lista los ingredientes disponibles y su precio por unidad.</p>
                  <div className="flex flex-wrap gap-2 mb-4">
                      <Button type="button" size="sm" onClick={handleSuggestIngredients} disabled={isLoadingSuggestions || !isApiKeySet}>
                        {isLoadingSuggestions ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Lightbulb className="h-4 w-4 mr-2" />}
                        Sugerir por IA
                      </Button>
                      <Select onValueChange={handleSelectIngredientFromLibrary} value="">
                          <SelectTrigger className="h-9 w-auto px-3 rounded-md border-gray-300 text-sm font-medium text-gray-700 hover:bg-gray-100 data-[state=open]:bg-gray-100">
                              <div className="flex items-center gap-2">
                                  <Library className="h-4 w-4" />
                                  <SelectValue placeholder="Agregar desde Biblioteca" />
                              </div>
                          </SelectTrigger>
                          <SelectContent>
                              {ingredientLibrary.length > 0 ? (
                                  <ScrollArea className="h-[250px]">
                                      {ingredientLibrary
                                          .slice()
                                          .sort((a, b) => a.name.localeCompare(b.name))
                                          .map(ing => (
                                              <SelectItem key={ing.id} value={ing.id}>
                                                  {ing.name}
                                              </SelectItem>
                                          ))}
                                  </ScrollArea>
                              ) : (
                                  <div className="p-2 text-sm text-gray-500 text-center">La biblioteca está vacía.</div>
                              )}
                          </SelectContent>
                      </Select>
                  </div>
                  {suggestedIngredientNames.length > 0 && (
                  <div className="mb-4 p-3 border rounded-md bg-cyan-50 border-cyan-200">
                      <h4 className="font-semibold text-sm mb-2 text-cyan-800">Sugeridos por IA:</h4>
                      <div className="flex flex-wrap gap-2">
                      {suggestedIngredientNames.map(name => (
                          <button key={name} type="button" onClick={() => addSuggestedIngredientToForm(name)} className="px-2 py-1 text-xs font-medium text-cyan-700 bg-white border border-cyan-300 rounded-full hover:bg-cyan-100 flex items-center gap-1">
                              <PlusCircle className="h-3 w-3" /> {name}
                          </button>
                      ))}
                      </div>
                  </div>
                  )}
                  <div className="max-h-80 overflow-y-auto space-y-4 pr-2">
                      {fields.map((item, index) => (
                      <div key={item.id} className="p-4 border rounded-md bg-gray-50 relative">
                          <button type="button" onClick={() => remove(index)} className="absolute top-2 right-2 text-gray-400 hover:text-red-500">
                              <Trash2 className="h-4 w-4" />
                          </button>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              <div>
                                  <label htmlFor={`feedIngredients.${index}.name`} className="block text-sm font-medium text-gray-700 mb-1">Nombre</label>
                                  <input {...form.register(`feedIngredients.${index}.name`)} placeholder="Ej: Maíz" className="mt-1 focus:ring-cyan-500 focus:border-cyan-500 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md" />
                                  {form.formState.errors.feedIngredients?.[index]?.name && <p className="text-sm text-red-600 mt-1">{form.formState.errors.feedIngredients[index]?.name?.message}</p>}
                              </div>
                              <div>
                                  <label htmlFor={`feedIngredients.${index}.price`} className="block text-sm font-medium text-gray-700 mb-1">Precio</label>
                                  <div className="relative">
                                      <DollarSign className="absolute left-2 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                                      <input type="number" step="any" {...form.register(`feedIngredients.${index}.price`)} placeholder="0.25" className="pl-7 mt-1 focus:ring-cyan-500 focus:border-cyan-500 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md" />
                                  </div>
                                  {form.formState.errors.feedIngredients?.[index]?.price && <p className="text-sm text-red-600 mt-1">{form.formState.errors.feedIngredients[index]?.price?.message}</p>}
                              </div>
                          </div>
                      </div>
                      ))}
                  </div>
                   {form.formState.errors.feedIngredients?.root && <p className="text-sm text-red-600 mt-2">{form.formState.errors.feedIngredients.root.message}</p>}
                   <Button type="button" variant="outline" size="sm" onClick={() => append({ id: uuidv4(), name: '', price: 0, ...defaultIngredientValues } as any)} className="mt-4">
                      <PlusCircle className="h-4 w-4 mr-2" /> Agregar Ingrediente
                  </Button>
              </div>

              <div className="p-6 bg-white rounded-lg shadow-md border border-gray-200">
                  <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2 mb-2"><ListChecks className="text-cyan-600"/> 3. Restricciones (Opcional)</h2>
                  <p className="text-sm text-gray-500 mb-4">Especifica límites (mín/máx) u otras condiciones para la formulación.</p>
                  <textarea {...form.register("constraints")} placeholder="Ej: Máx 10% harina de soja, Mín 1% lisina" rows={4} className="mt-1 focus:ring-cyan-500 focus:border-cyan-500 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md"/>
              </div>

               {error && (
                  <div className="rounded-md bg-red-50 p-4">
                      <div className="flex">
                          <div className="flex-shrink-0"><AlertTriangle className="h-5 w-5 text-red-400" /></div>
                          <div className="ml-3">
                              <h3 className="text-sm font-medium text-red-800">Error en la Formulación</h3>
                              <div className="mt-2 text-sm text-red-700"><p>{error}</p></div>
                          </div>
                      </div>
                  </div>
              )}
              
              {!isApiKeySet && (
                 <div className="rounded-md bg-yellow-50 p-4">
                    <div className="flex">
                        <div className="flex-shrink-0"><KeyRound className="h-5 w-5 text-yellow-400" /></div>
                        <div className="ml-3">
                            <h3 className="text-sm font-medium text-yellow-800">Configuración Requerida</h3>
                            <div className="mt-2 text-sm text-yellow-700">
                                <p>La API Key de Google AI no está configurada. Para que la IA funcione, añádela como una variable de entorno llamada <strong>VITE_API_KEY</strong> en la configuración de tu proyecto en Vercel y realiza un nuevo despliegue.</p>
                            </div>
                        </div>
                    </div>
                </div>
              )}

              <div className="flex justify-end pt-4">
                  <Button type="submit" disabled={isLoading || !isApiKeySet} size="lg">
                      {isLoading ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : <Calculator className="mr-2 h-5 w-5" />}
                      Formular Dieta
                  </Button>
              </div>
          </form>
        </main>
      </div>


      <IngredientLibraryDialog isOpen={isIngredientLibraryOpen} onOpenChange={setIsIngredientLibraryOpen} onLibraryUpdate={handleIngredientLibraryUpdate} initialLibrary={ingredientLibrary} />
      <FormulationLibraryDialog isOpen={isFormulationLibraryOpen} onOpenChange={setIsFormulationLibraryOpen} onLibraryUpdate={() => {}} />
      <NutritionalRequirementsLibraryDialog isOpen={isNutritionalRequirementsLibraryOpen} onOpenChange={setIsNutritionalRequirementsLibraryOpen} />
      <SelectRequirementsDialog isOpen={isSelectRequirementsDialogOpen} onOpenChange={setIsSelectRequirementsDialogOpen} profiles={nutritionalRequirementsLibrary} onProfileSelect={handleApplyRequirementsProfile} />
      
    </div>
  );
};

export default FormulationPage;