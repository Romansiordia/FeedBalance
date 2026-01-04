import React, { useState, useEffect, useRef } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { v4 as uuidv4 } from 'uuid';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogClose, DialogDescription } from '../ui/dialog';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Textarea } from '../ui/textarea';
import { PlusCircle, Trash2, Edit3, BookOpen, Download, UploadCloud, Loader2, DollarSign } from 'lucide-react';
import { useToast } from "../../hooks/use-toast";
import { FeedIngredientSchema, type StoredFeedIngredient, type FeedIngredientFormValues, type ValidatedFeedIngredient } from '../../types';
import { saveIngredientToLibrary, removeIngredientFromLibrary, importIngredientsToLibrary } from '../../services/ingredientLibraryService';

interface IngredientLibraryDialogProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  onLibraryUpdate: (updatedLibrary: StoredFeedIngredient[]) => void;
  initialLibrary: StoredFeedIngredient[];
}

type NutrientFieldKey = keyof Omit<FeedIngredientFormValues, 'id' | 'name' | 'price' | 'otherNutrients'>;

const nutrientFieldsDisplayOrder: Array<{ name: keyof Omit<FeedIngredientFormValues, 'id' | 'name' | 'price' | 'otherNutrients'>, label: string, unit: string, placeholder?: string }> = [
  { name: 'protein', label: 'Proteína', unit: '%', placeholder: 'Ej: 22.0' },
  { name: 'humedad', label: 'Humedad', unit: '%', placeholder: 'Ej: 12.0' },
  { name: 'grasa', label: 'Grasa', unit: '%', placeholder: 'Ej: 5.0' },
  { name: 'fiber', label: 'Fibra', unit: '%', placeholder: 'Ej: 3.5' },
  { name: 'ceniza', label: 'Ceniza', unit: '%', placeholder: 'Ej: 6.0' },
  { name: 'almidon', label: 'Almidón', unit: '%', placeholder: 'Ej: 40.0' },
  { name: 'fdn', label: 'FDN', unit: '%', placeholder: 'Ej: 30.0' },
  { name: 'fda', label: 'FDA', unit: '%', placeholder: 'Ej: 15.0' },
  { name: 'energy', label: 'Energía General', unit: 'kcal/kg', placeholder: 'Ej: 3200' },
  { name: 'energiaAves', label: 'Energía Aves', unit: 'kcal/kg', placeholder: 'Ej: 3100' },
  { name: 'energiaCerdos', label: 'Energía Cerdos', unit: 'kcal/kg', placeholder: 'Ej: 3300' },
  { name: 'lactosa', label: 'Lactosa', unit: '%', placeholder: 'Ej: 0.5' },
  { name: 'calcio', label: 'Calcio', unit: '%', placeholder: 'Ej: 0.90' },
  { name: 'fosforo', label: 'Fósforo Total', unit: '%', placeholder: 'Ej: 0.70' },
  { name: 'fosforoFitico', label: 'Fósforo Fítico', unit: '%', placeholder: 'Ej: 0.25' },
  { name: 'zinc', label: 'Zinc', unit: '%', placeholder: 'Ej: 0.01' },
  { name: 'cobre', label: 'Cobre', unit: '%', placeholder: 'Ej: 0.001' },
  { name: 'hierro', label: 'Hierro', unit: '%', placeholder: 'Ej: 0.02' },
  { name: 'manganeso', label: 'Manganeso', unit: '%', placeholder: 'Ej: 0.01' },
  { name: 'cloro', label: 'Cloro', unit: '%', placeholder: 'Ej: 0.2' },
  { name: 'sodio', label: 'Sodio', unit: '%', placeholder: 'Ej: 0.15' },
  { name: 'azufre', label: 'Azufre', unit: '%', placeholder: 'Ej: 0.2' },
  { name: 'potasio', label: 'Potasio', unit: '%', placeholder: 'Ej: 0.8' },
  { name: 'magnesio', label: 'Magnesio', unit: '%', placeholder: 'Ej: 0.2' },
  { name: 'lisina', label: 'Lisina Total', unit: '%', placeholder: 'Ej: 1.10' },
  { name: 'lisinaDigestible', label: 'Lisina Digestible', unit: '%', placeholder: 'Ej: 0.95' },
  { name: 'metionina', label: 'Metionina Total', unit: '%', placeholder: 'Ej: 0.45' },
  { name: 'metioninaDigestible', label: 'Metionina Digestible', unit: '%', placeholder: 'Ej: 0.40' },
  { name: 'metCisTotal', label: 'Met+Cis Total', unit: '%', placeholder: 'Ej: 0.70' },
  { name: 'metCisDigestible', label: 'Met+Cis Digestible', unit: '%', placeholder: 'Ej: 0.65' },
  { name: 'triptofano', label: 'Triptófano Total', unit: '%', placeholder: 'Ej: 0.20' },
  { name: 'argininaTotal', label: 'Arginina Total', unit: '%', placeholder: 'Ej: 1.2' },
  { name: 'argininaDigestible', label: 'Arginina Digestible', unit: '%', placeholder: 'Ej: 1.1' },
  { name: 'leusinaTotal', label: 'Leucina Total', unit: '%', placeholder: 'Ej: 1.5' },
  { name: 'leusinaDigestible', label: 'Leucina Digestible', unit: '%', placeholder: 'Ej: 1.35' },
  { name: 'valina', label: 'Valina Total', unit: '%', placeholder: 'Ej: 0.70' },
  { name: 'valinaDigestible', label: 'Valina Digestible', unit: '%', placeholder: 'Ej: 0.65' },
  { name: 'treonina', label: 'Treonina Total', unit: '%', placeholder: 'Ej: 0.65' },
  // FIX: Corrected typo from 'isoleucina' to 'isoleusina' to match the type definition.
  { name: 'isoleusina', label: 'Isoleucina Total', unit: '%', placeholder: 'Ej: 0.60' },
];

const CSV_HEADERS = [
    'ID','Nombre', 'Precio',
    'Proteína (%)','Humedad (%)','Grasa (%)','Fibra (%)','Ceniza (%)','Almidón (%)',
    'FDN (%)', 'FDA (%)',
    'Energía General (kcal/kg)', 'Energía Aves (kcal/kg)', 'Energía Cerdos (kcal/kg)',
    'Lactosa (%)',
    'Calcio (%)','Fósforo Total (%)','Zinc (%)', 'Cobre (%)', 'Hierro (%)', 'Manganeso (%)', 'Cloro (%)', 'Sodio (%)', 'Azufre (%)', 'Potasio (%)', 'Magnesio (%)',
    'Fósforo Fítico (%)',
    'Lisina Total (%)', 'Lisina Digestible (%)',
    'Metionina Total (%)', 'Metionina Digestible (%)',
    'Met+Cis Total (%)', 'Met+Cis Digestible (%)',
    'Triptófano Total (%)', 
    'Arginina Total (%)', 'Arginina Digestible (%)',
    'Leucina Total (%)', 'Leucina Digestible (%)',
    'Valina Total (%)', 'Valina Digestible (%)',
    'Treonina Total (%)', 
    'Isoleucina Total (%)',
    'Otros Nutrientes',
];

const CSV_FIELD_MAPPING: (keyof StoredFeedIngredient | 'id')[] = [
    'id', 'name', 'price',
    'protein', 'humedad', 'grasa', 'fiber', 'ceniza', 'almidon',
    'fdn', 'fda',
    'energy', 'energiaAves', 'energiaCerdos',
    'lactosa',
    'calcio', 'fosforo', 'zinc', 'cobre', 'hierro', 'manganeso', 'cloro', 'sodio', 'azufre', 'potasio', 'magnesio',
    'fosforoFitico',
    'lisina', 'lisinaDigestible',
    'metionina', 'metioninaDigestible',
    'metCisTotal', 'metCisDigestible',
    'triptofano', 
    'argininaTotal', 'argininaDigestible',
    'leusinaTotal', 'leusinaDigestible',
    'valina', 'valinaDigestible',
    'treonina', 
    // FIX: Corrected typo from 'isoleucina' to 'isoleusina' to match the type definition.
    'isoleusina',
    'otherNutrients',
];

const formDefaultValues: FeedIngredientFormValues = {
    id: '', name: '', price: '',
    protein: '', humedad: '', grasa: '', fiber: '', ceniza: '', almidon: '',
    fdn: '', fda: '',
    energy: '', energiaAves: '', energiaCerdos: '',
    lactosa: '',
    calcio: '', fosforo: '', fosforoFitico: '',
    zinc: '', cobre: '', hierro: '', manganeso: '', cloro: '', sodio: '', azufre: '', potasio: '', magnesio: '',
    lisina: '', lisinaDigestible: '',
    metionina: '', metioninaDigestible: '',
    metCisTotal: '', metCisDigestible: '',
    triptofano: '', 
    argininaTotal: '', argininaDigestible: '',
    leusinaTotal: '', leusinaDigestible: '',
    valina: '', valinaDigestible: '',
    treonina: '', 
    // FIX: Corrected typo from 'isoleucina' to 'isoleusina' to match the type definition.
    isoleusina: '', 
    otherNutrients: '',
};


const IngredientLibraryDialog: React.FC<IngredientLibraryDialogProps> = ({ isOpen, onOpenChange, onLibraryUpdate, initialLibrary }) => {
  const [library, setLibrary] = useState<StoredFeedIngredient[]>(initialLibrary);
  const [isAdding, setIsAdding] = useState(false);
  const [editingIngredient, setEditingIngredient] = useState<StoredFeedIngredient | null>(null);
  const [isImporting, setIsImporting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  // FIX: Removed explicit generic from useForm to let types be inferred from defaultValues.
  // This resolves type conflicts between form state and the Zod schema resolver.
  const form = useForm({
    resolver: zodResolver(FeedIngredientSchema),
    // FIX: Cast defaultValues to `any` to resolve type mismatch between form state (strings for numbers) and schema type.
    defaultValues: formDefaultValues as any,
  });

  useEffect(() => {
    setLibrary(initialLibrary);
  }, [initialLibrary]);

  useEffect(() => {
    if (isAdding) {
        if (editingIngredient) {
            const editFormValues: Partial<FeedIngredientFormValues> = {};
            // FIX: Use Object.keys to ensure 'key' is a string and iterate over own properties,
            // which resolves type errors when trying to use 'key' for object indexing.
            for (const key of Object.keys(editingIngredient)) {
                const value = editingIngredient[key as keyof StoredFeedIngredient];
                if (value !== null && value !== undefined) {
                    (editFormValues as any)[key] = String(value);
                } else {
                    (editFormValues as any)[key] = '';
                }
            }
            form.reset(editFormValues as FeedIngredientFormValues);
        } else {
            form.reset({ ...formDefaultValues, id: uuidv4() });
        }
    }
  }, [editingIngredient, isAdding, form]);

  const handleShowAddForm = () => {
    setEditingIngredient(null);
    setIsAdding(true);
  };

  const handleShowEditForm = (ingredient: StoredFeedIngredient) => {
    setEditingIngredient(ingredient);
    setIsAdding(true);
  };
  
  // FIX: Changed 'data' parameter type to ValidatedFeedIngredient.
  // The zodResolver provides validated and coerced data to the submit handler.
  const handleFormSubmit = (data: ValidatedFeedIngredient) => {
    const validatedData = data;
    const updatedLibrary = saveIngredientToLibrary(validatedData);
    setLibrary(updatedLibrary);
    onLibraryUpdate(updatedLibrary);
    toast({
      title: `Ingrediente ${editingIngredient ? 'Actualizado' : 'Agregado'}`,
      description: `"${validatedData.name}" ha sido ${editingIngredient ? 'actualizado en' : 'agregado a'} tu biblioteca.`,
      variant: 'success'
    });
    setIsAdding(false);
    setEditingIngredient(null);
  };

  const handleDeleteIngredient = (id: string, name: string) => {
     if (window.confirm(`¿Estás seguro de que quieres eliminar "${name}"?`)) {
        const updatedLibrary = removeIngredientFromLibrary(id);
        setLibrary(updatedLibrary);
        onLibraryUpdate(updatedLibrary);
        toast({
        title: "Ingrediente Eliminado",
        description: `"${name}" ha sido eliminado de tu biblioteca.`,
        variant: "destructive"
        });
    }
  };

  const handleCancelForm = () => {
    setIsAdding(false);
    setEditingIngredient(null);
  };

  const handleDownloadCSV = () => {
    if (library.length === 0) {
      toast({ title: "Biblioteca Vacía", description: "No hay ingredientes para exportar.", variant: "destructive" });
      return;
    }
    let csvContent = "data:text/csv;charset=utf-8,";
    csvContent += CSV_HEADERS.join(',') + "\n";
    library.forEach(ing => {
      const row = CSV_FIELD_MAPPING.map(key => {
        const value = ing[key as keyof StoredFeedIngredient];
        if (String(key) === 'name' || String(key) === 'id' || String(key) === 'otherNutrients') {
            const stringValue = String(value || '');
            return `"${stringValue.replace(/"/g, '""')}"`;
        }
        if (value !== undefined && value !== null) {
            return String(value);
        }
        return '';
      });
      csvContent += row.join(',') + "\n";
    });

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    const date = new Date().toISOString().split('T')[0];
    link.setAttribute("download", `Balance_Ingredientes_${date}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast({ title: "Biblioteca Descargada", description: "Tu biblioteca de ingredientes ha sido descargada como CSV.", variant: 'success' });
  };

  const handleImportClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsImporting(true);
    const reader = new FileReader();

    reader.onload = async (e) => {
      const csvText = e.target?.result as string;
      if (!csvText) {
        toast({ title: "Error de Importación", description: "El archivo CSV está vacío o no se pudo leer.", variant: "destructive" });
        setIsImporting(false);
        return;
      }

      const lines = csvText.split(/\r\n|\n/).filter(line => line.trim() !== '');
      if (lines.length < 2) {
        toast({ title: "Error de Importación", description: "El archivo CSV no contiene datos o solo tiene encabezados.", variant: "destructive" });
        setIsImporting(false);
        return;
      }

      const headerLine = lines[0].split(',').map(h => h.trim().replace(/^"|"$/g, '')); 
      const expectedHeaders = CSV_HEADERS.map(h => h.trim().replace(/^"|"$/g, ''));
      if (JSON.stringify(headerLine) !== JSON.stringify(expectedHeaders)) {
         toast({ title: "Error de Cabeceras", description: "Las cabeceras del archivo CSV no coinciden con el formato esperado.", variant: "destructive" });
         setIsImporting(false);
         if (fileInputRef.current) fileInputRef.current.value = "";
         return;
      }
      
      const importedIngredients: StoredFeedIngredient[] = [];
      try {
        lines.slice(1).forEach(line => {
            const values = line.split(',');
            const ingredient: any = { id: uuidv4() };
            CSV_FIELD_MAPPING.forEach((key, index) => {
                const value = values[index]?.trim().replace(/^"|"$/g, '');
                if(value !== undefined && value !== '') {
                    if (key !== 'id' && key !== 'name' && key !== 'otherNutrients') {
                        ingredient[key] = parseFloat(value);
                    } else {
                        ingredient[key] = value;
                    }
                }
            });
            importedIngredients.push(ingredient as StoredFeedIngredient);
        });

        const newLibrary = importIngredientsToLibrary(importedIngredients);
        setLibrary(newLibrary);
        onLibraryUpdate(newLibrary);
        toast({ title: "Importación Completa", description: `${importedIngredients.length} ingredientes importados.` });
      } catch (err) {
        toast({ title: "Error de Importación", description: "Error al procesar los datos del CSV.", variant: "destructive" });
      } finally {
        setIsImporting(false);
        if (fileInputRef.current) fileInputRef.current.value = "";
      }
    };
    reader.readAsText(file);
  };

  if (!isOpen) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl h-[85vh] flex flex-col p-0">
        <DialogHeader className="p-6 pb-4 flex-shrink-0 border-b">
          <DialogTitle className="flex items-center gap-2">
            <BookOpen className="h-6 w-6 text-cyan-600" />
            Biblioteca de Ingredientes
          </DialogTitle>
          <DialogDescription>
            Administra los ingredientes que puedes usar en tus formulaciones.
          </DialogDescription>
        </DialogHeader>
        
        {isAdding ? (
            <form onSubmit={form.handleSubmit(handleFormSubmit)} className="flex-grow flex flex-col overflow-hidden">
                <div className="px-6 pt-4 flex-shrink-0">
                    <h3 className="text-lg font-semibold">{editingIngredient ? 'Editar Ingrediente' : 'Agregar Nuevo Ingrediente'}</h3>
                </div>
                <div className="flex-grow overflow-y-auto px-6 pt-4">
                    <div className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <Label htmlFor="name">Nombre del Ingrediente</Label>
                                <Input id="name" {...form.register('name')} placeholder="Ej: Maíz Amarillo" />
                                {/* FIX: Cast errors object to any to bypass incorrect type inference. */}
                                {form.formState.errors.name && <p className="text-sm text-red-600 mt-1">{(form.formState.errors.name as any).message}</p>}
                            </div>
                            <div>
                                <Label htmlFor="price">Precio (por unidad)</Label>
                                <div className="relative">
                                    <DollarSign className="absolute left-2 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                                    <Input id="price" type="number" step="any" {...form.register('price')} placeholder="Ej: 0.25" className="pl-7" />
                                </div>
                                {/* FIX: Cast errors object to any to bypass incorrect type inference. */}
                                {form.formState.errors.price && <p className="text-sm text-red-600 mt-1">{(form.formState.errors.price as any).message}</p>}
                            </div>
                        </div>

                        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                            {nutrientFieldsDisplayOrder.map(field => (
                                <div key={field.name}>
                                    <Label htmlFor={field.name}>{field.label}</Label>
                                    <div className="relative">
                                        <Input id={field.name} type="number" step="any" {...form.register(field.name as NutrientFieldKey)} placeholder={field.placeholder}/>
                                        <span className="absolute right-2 top-1/2 -translate-y-1/2 text-xs text-gray-400">{field.unit}</span>
                                    </div>
                                    {/* FIX: Cast errors object to any to bypass incorrect type inference. */}
                                    {form.formState.errors[field.name as NutrientFieldKey] && <p className="text-sm text-red-600 mt-1">{(form.formState.errors[field.name as NutrientFieldKey] as any)?.message}</p>}
                                </div>
                            ))}
                        </div>
                        <div>
                            <Label htmlFor="otherNutrients">Otros Nutrientes (Notas)</Label>
                            <Textarea id="otherNutrients" {...form.register('otherNutrients')} placeholder="Información adicional..." />
                        </div>
                    </div>
                </div>
                 <DialogFooter className="pt-4 px-6 pb-6 mt-auto border-t flex-shrink-0">
                    <Button type="button" variant="ghost" onClick={handleCancelForm}>Cancelar</Button>
                    <Button type="submit">{editingIngredient ? 'Actualizar' : 'Guardar'}</Button>
                </DialogFooter>
            </form>
        ) : (
            <div className="flex-grow flex flex-col overflow-hidden">
                <div className="flex justify-end gap-2 mb-4 px-6 pt-4 flex-shrink-0">
                    <input type="file" ref={fileInputRef} onChange={handleFileChange} accept=".csv" className="hidden"/>
                    <Button variant="outline" size="sm" onClick={handleImportClick} disabled={isImporting}>
                        {isImporting ? <Loader2 className="h-4 w-4 animate-spin mr-2"/> : <UploadCloud className="h-4 w-4 mr-2" />}
                        Importar CSV
                    </Button>
                    <Button variant="outline" size="sm" onClick={handleDownloadCSV}>
                        <Download className="h-4 w-4 mr-2" />
                        Exportar CSV
                    </Button>
                    <Button size="sm" onClick={handleShowAddForm}>
                        <PlusCircle className="h-4 w-4 mr-2" />
                        Agregar Ingrediente
                    </Button>
                </div>
                <div className="flex-grow overflow-y-auto px-6">
                    <div className="space-y-2">
                         {library.length > 0 ? (
                            library
                              .slice()
                              .sort((a, b) => a.name.localeCompare(b.name))
                              .map(ing => (
                                <div key={ing.id} className="flex items-center justify-between p-3 rounded-md border bg-gray-50/80 hover:bg-gray-100 transition-colors">
                                    <div className="flex-1 overflow-hidden">
                                        <p className="font-medium text-gray-800 truncate" title={ing.name}>{ing.name}</p>
                                        <div className="flex items-center gap-x-4 gap-y-1 flex-wrap text-sm text-gray-500 mt-1">
                                            <span><span className="font-semibold text-gray-600">Precio:</span> ${ing.price.toFixed(2)}</span>
                                            <span><span className="font-semibold text-gray-600">Proteína:</span> {ing.protein?.toFixed(2) ?? 'N/A'}%</span>
                                        </div>
                                    </div>
                                    <div className="flex items-center space-x-1 pl-2">
                                        <Button variant="ghost" size="icon" onClick={() => handleShowEditForm(ing)} title="Editar"><Edit3 className="h-4 w-4" /></Button>
                                        <Button variant="ghost" size="icon" onClick={() => handleDeleteIngredient(ing.id, ing.name)} title="Eliminar"><Trash2 className="h-4 w-4 text-red-500" /></Button>
                                    </div>
                                </div>
                            ))
                        ) : (
                            <div className="flex items-center justify-center h-full text-center text-gray-500">
                                <p>Tu biblioteca está vacía. <br/> Agrega un ingrediente o impórtalos desde un archivo CSV.</p>
                            </div>
                        )}
                    </div>
                </div>
                 <DialogFooter className="pt-4 px-6 pb-6 mt-auto border-t flex-shrink-0">
                    <DialogClose asChild>
                        <Button type="button" variant="outline">Cerrar</Button>
                    </DialogClose>
                </DialogFooter>
            </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default IngredientLibraryDialog;