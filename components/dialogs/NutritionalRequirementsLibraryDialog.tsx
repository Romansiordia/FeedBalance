
import React, { useState, useEffect } from 'react';
import { useForm, useFieldArray, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { v4 as uuidv4 } from 'uuid';

import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogClose, DialogDescription } from '../ui/dialog';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Textarea } from '../ui/textarea';
import { ScrollArea } from '../ui/scroll-area';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../ui/Table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { ListChecks, Info, PlusCircle, Trash2, Edit3, Save, XCircle } from 'lucide-react';
import { useToast } from "../../hooks/use-toast";

// FIX: Add NutrientRequirementValue to imports to be used for type casting.
import type { NutritionalRequirementProfile, NutritionalRequirementProfileFormValues, NutrientEntryFormValues, AnimalType, NutrientRequirementValue } from '../../types';
import { AnimalTypes, NutritionalRequirementProfileFormSchema } from '../../types';
import { 
    loadNutritionalRequirementsLibrary, 
    saveNutritionalRequirementProfile, 
    removeNutritionalRequirementProfile,
    convertProfileToFormValues
} from '../../services/nutritionalRequirementsService';

interface NutritionalRequirementsLibraryDialogProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
}

const defaultNutrientEntry: Omit<NutrientEntryFormValues, 'fieldId'> = {
  nutrientName: '',
  // FIX: Changed empty strings to `undefined` to match the expected type `number | undefined`.
  target: undefined,
  // FIX: Changed empty strings to `undefined` to match the expected type `number | undefined`.
  min: undefined,
  // FIX: Changed empty strings to `undefined` to match the expected type `number | undefined`.
  max: undefined,
  unit: '%',
};

const NutritionalRequirementsLibraryDialog: React.FC<NutritionalRequirementsLibraryDialogProps> = ({ isOpen, onOpenChange }) => {
  const [library, setLibrary] = useState<NutritionalRequirementProfile[]>([]);
  const [selectedProfileForView, setSelectedProfileForView] = useState<NutritionalRequirementProfile | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingProfile, setEditingProfile] = useState<NutritionalRequirementProfile | null>(null);
  const { toast } = useToast();

  const form = useForm<NutritionalRequirementProfileFormValues>({
    resolver: zodResolver(NutritionalRequirementProfileFormSchema),
    defaultValues: {
      profileDisplayName: '',
      animalType: '' as AnimalType,
      growthStageDescription: '',
      notes: '',
      nutrientEntries: [{ ...defaultNutrientEntry, fieldId: uuidv4() }],
    },
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "nutrientEntries",
  });

  useEffect(() => {
    if (isOpen) {
      const loadedLibrary = loadNutritionalRequirementsLibrary();
      setLibrary(loadedLibrary);
      if(loadedLibrary.length > 0 && !selectedProfileForView) {
        setSelectedProfileForView(loadedLibrary[0]);
      }
    }
  }, [isOpen, selectedProfileForView]);
  
  const handleAddNew = () => {
    setEditingProfile(null);
    form.reset({
      profileDisplayName: '',
      animalType: '' as AnimalType,
      growthStageDescription: '',
      notes: '',
      nutrientEntries: [{ ...defaultNutrientEntry, fieldId: uuidv4() }],
    });
    setIsFormOpen(true);
    setSelectedProfileForView(null); 
  };

  const handleEdit = (profile: NutritionalRequirementProfile) => {
    setEditingProfile(profile);
    form.reset(convertProfileToFormValues(profile));
    setIsFormOpen(true);
    setSelectedProfileForView(null);
  };

  const handleDelete = (id: string, name: string) => {
    if (window.confirm(`¿Estás seguro de que quieres eliminar el perfil "${name}"?`)) {
      const updatedLibrary = removeNutritionalRequirementProfile(id);
      setLibrary(updatedLibrary);
      toast({ title: "Perfil Eliminado", description: `El perfil "${name}" ha sido eliminado.`, variant: 'destructive' });
      if (selectedProfileForView?.id === id) {
        setSelectedProfileForView(updatedLibrary.length > 0 ? updatedLibrary[0] : null);
      }
      if (editingProfile?.id === id) {
        setIsFormOpen(false);
        setEditingProfile(null);
      }
    }
  };

  const handleFormSubmit = (data: NutritionalRequirementProfileFormValues) => {
    const updatedLibrary = saveNutritionalRequirementProfile(data);
    setLibrary(updatedLibrary);
    toast({
      title: editingProfile ? "Perfil Actualizado" : "Perfil Guardado",
      description: `El perfil "${data.profileDisplayName}" ha sido ${editingProfile ? 'actualizado' : 'guardado'}.`,
      variant: 'success'
    });
    setIsFormOpen(false);
    setEditingProfile(null);
    const savedProfile = updatedLibrary.find(p => p.id === data.id) || updatedLibrary[updatedLibrary.length - 1];
    setSelectedProfileForView(savedProfile);
  };

  const handleCancelForm = () => {
    setIsFormOpen(false);
    setEditingProfile(null);
    if (library.length > 0 && !selectedProfileForView) {
        setSelectedProfileForView(library[0]);
    }
  };

  const formatDisplayValue = (value?: number) => (value !== undefined ? value.toLocaleString() : 'N/A');

  if (!isOpen) return null;

  return (
    <Dialog open={isOpen} onOpenChange={(open) => { onOpenChange(open); if (!open) handleCancelForm(); }}>
        <DialogContent className="max-w-4xl min-h-[80vh] flex flex-col p-0">
        <DialogHeader className="p-6">
          <DialogTitle className="flex items-center gap-2">
            <ListChecks className="h-6 w-6 text-cyan-600" />
            Biblioteca de Requerimientos Nutricionales
          </DialogTitle>
          <DialogDescription>
            Gestiona y consulta perfiles de requerimientos nutricionales para diferentes especies y etapas.
          </DialogDescription>
        </DialogHeader>

        {isFormOpen ? (
          <form onSubmit={form.handleSubmit(handleFormSubmit)} className="flex-grow space-y-4 px-6 pb-6 overflow-y-auto">
            <h3 className="text-xl font-semibold mb-3">{editingProfile ? 'Editar Perfil Nutricional' : 'Agregar Nuevo Perfil Nutricional'}</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="profileDisplayName">Nombre del Perfil</Label>
                <Input id="profileDisplayName" {...form.register("profileDisplayName")} placeholder="Ej: Pollo Engorde - Finalizador" />
                {form.formState.errors.profileDisplayName && <p className="text-sm text-red-600 mt-1">{form.formState.errors.profileDisplayName.message}</p>}
              </div>
              <div>
                <Label htmlFor="animalTypeReq">Tipo de Animal</Label>
                <Controller
                    control={form.control}
                    name="animalType"
                    render={({ field }) => (
                    <Select onValueChange={field.onChange} value={field.value || ""} >
                        <SelectTrigger id="animalTypeReq">
                        <SelectValue placeholder="Selecciona tipo..." />
                        </SelectTrigger>
                        <SelectContent>
                        {AnimalTypes.map(type => (
                            <SelectItem key={type} value={type}>
                            {type.charAt(0).toUpperCase() + type.slice(1)}
                            </SelectItem>
                        ))}
                        </SelectContent>
                    </Select>
                    )}
                />
                {form.formState.errors.animalType && <p className="text-sm text-red-600 mt-1">{form.formState.errors.animalType.message}</p>}
              </div>
            </div>
            <div>
              <Label htmlFor="growthStageDescription">Descripción Etapa</Label>
              <Input id="growthStageDescription" {...form.register("growthStageDescription")} placeholder="Ej: 5-7 semanas" />
              {form.formState.errors.growthStageDescription && <p className="text-sm text-red-600 mt-1">{form.formState.errors.growthStageDescription.message}</p>}
            </div>
            <div>
              <Label htmlFor="notes">Notas Adicionales</Label>
              <Textarea id="notes" {...form.register("notes")} placeholder="Notas sobre el perfil, fuentes, etc." />
            </div>

            <h4 className="text-lg font-semibold mt-6 mb-2">Requerimientos de Nutrientes</h4>
            <div className="space-y-3 p-1 max-h-64 overflow-y-auto">
                {fields.map((field, index) => (
                  <div key={field.id} className="p-3 relative bg-gray-100 rounded-md border">
                    <button type="button" onClick={() => remove(index)} className="absolute top-1 right-1 text-gray-400 hover:text-red-500">
                      <Trash2 className="h-4 w-4" />
                    </button>
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-2 items-end">
                      <div className="md:col-span-2">
                        <Label>Nutriente</Label>
                        <Input {...form.register(`nutrientEntries.${index}.nutrientName`)} placeholder="Proteína Cruda" />
                      </div>
                      <div>
                        <Label>Objetivo</Label>
                        <Input {...form.register(`nutrientEntries.${index}.target`)} placeholder="18.5" />
                      </div>
                       <div>
                        <Label>Mínimo</Label>
                        <Input {...form.register(`nutrientEntries.${index}.min`)} placeholder="18.0" />
                      </div>
                      <div>
                        <Label>Máximo</Label>
                        <Input {...form.register(`nutrientEntries.${index}.max`)} placeholder="19.0" />
                      </div>
                      <div>
                        <Label>Unidad</Label>
                        <Input {...form.register(`nutrientEntries.${index}.unit`)} placeholder="%" />
                      </div>
                    </div>
                  </div>
                ))}
            </div>
            <Button type="button" variant="outline" size="sm" onClick={() => append({ ...defaultNutrientEntry, fieldId: uuidv4() })}>
              <PlusCircle className="mr-2 h-4 w-4" /> Agregar Nutriente
            </Button>
            
            <DialogFooter className="mt-6 pt-4 border-t sticky bottom-0 bg-white py-4 px-6 -mx-6">
              <Button type="button" variant="ghost" onClick={handleCancelForm}>Cancelar</Button>
              <Button type="submit">
                <Save className="mr-2 h-4 w-4" />
                {editingProfile ? 'Actualizar Perfil' : 'Guardar Perfil'}
              </Button>
            </DialogFooter>
          </form>
        ) : (
          <div className="flex-grow flex flex-col md:flex-row gap-4 overflow-hidden px-6 pb-6">
            <div className="flex-shrink-0 md:w-1/3 flex flex-col">
              <div className="flex justify-between items-center mb-2">
                <h4 className="font-semibold">Perfiles ({library.length})</h4>
                <Button onClick={handleAddNew} size="sm">
                    <PlusCircle className="mr-2 h-4 w-4" /> Nuevo
                </Button>
              </div>
              <ScrollArea className="border rounded-md flex-grow">
                <div className="p-1 space-y-1">
                {library.map((profile) => (
                  <button
                    key={profile.id}
                    className={`w-full text-left p-2 rounded-md ${selectedProfileForView?.id === profile.id ? "bg-cyan-100" : "hover:bg-gray-100"}`}
                    onClick={() => setSelectedProfileForView(profile)}
                  >
                       <span className="font-medium text-sm">{profile.profileDisplayName}</span>
                       <span className="block text-xs text-gray-500">{profile.animalType} - {profile.growthStageDescription}</span>
                  </button>
                ))}
                </div>
              </ScrollArea>
            </div>
            <div className="flex-grow md:w-2/3">
              {selectedProfileForView ? (
                <Card className="h-full flex flex-col">
                  <CardHeader>
                    <div className="flex justify-between items-start">
                        <div>
                            <CardTitle className="text-xl">{selectedProfileForView.profileDisplayName}</CardTitle>
                            <p className="text-sm text-gray-500">{selectedProfileForView.notes}</p>
                        </div>
                        <div className="flex gap-2 flex-shrink-0">
                            <Button variant="outline" size="sm" onClick={() => handleEdit(selectedProfileForView)}>
                                <Edit3 className="mr-1 h-4 w-4" /> Editar
                            </Button>
                        </div>
                    </div>
                  </CardHeader>
                  <CardContent className="flex-grow overflow-y-auto">
                    <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Nutriente</TableHead>
                            <TableHead className="text-right">Objetivo</TableHead>
                            <TableHead className="text-right">Mín/Máx</TableHead>
                            <TableHead className="text-right">Unidad</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {/* FIX: Cast `details` to NutrientRequirementValue to access its properties without type errors. */}
                          {Object.entries(selectedProfileForView.nutrients).map(([nutrientName, detailsValue]) => {
                            const details = detailsValue as NutrientRequirementValue;
                            return (
                              <TableRow key={nutrientName}>
                                <TableCell className="font-medium">{nutrientName}</TableCell>
                                <TableCell className="text-right">{formatDisplayValue(details.target)}</TableCell>
                                <TableCell className="text-right">{formatDisplayValue(details.min)} - {formatDisplayValue(details.max)}</TableCell>
                                <TableCell className="text-right">{details.unit}</TableCell>
                              </TableRow>
                            );
                          })}
                        </TableBody>
                      </Table>
                  </CardContent>
                </Card>
              ) : (
                 <div className="flex items-center justify-center h-full text-gray-500 border rounded-md">
                    <p>Selecciona un perfil para ver sus detalles.</p>
                </div>
              )}
            </div>
            <DialogFooter className="mt-auto pt-4 border-t -mx-6 px-6 pb-0">
                <DialogClose asChild>
                    <Button variant="outline">Cerrar</Button>
                </DialogClose>
            </DialogFooter>
          </div>
        )}
        </DialogContent>
    </Dialog>
  );
};

export default NutritionalRequirementsLibraryDialog;
