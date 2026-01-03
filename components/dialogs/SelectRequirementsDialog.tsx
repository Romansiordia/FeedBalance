
import React from 'react';
import type { NutritionalRequirementProfile } from '../../types';
import { ListChecks } from 'lucide-react';
import { Button } from '../ui/button';
import { ScrollArea } from '../ui/scroll-area';

interface SelectRequirementsDialogProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  profiles: NutritionalRequirementProfile[];
  onProfileSelect: (profile: NutritionalRequirementProfile) => void;
}

const SelectRequirementsDialog: React.FC<SelectRequirementsDialogProps> = ({ 
  isOpen, 
  onOpenChange, 
  profiles, 
  onProfileSelect 
}) => {
  if (!isOpen) return null;

  const handleSelect = (profile: NutritionalRequirementProfile) => {
    onProfileSelect(profile);
    onOpenChange(false); // Close dialog after selection
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-40 flex justify-center items-center" onClick={() => onOpenChange(false)}>
      <div className="bg-white rounded-lg shadow-xl max-w-lg w-full m-4 flex flex-col" onClick={e => e.stopPropagation()}>
        <div className="p-6">
          <h3 className="flex items-center gap-2 font-semibold text-lg text-gray-900">
            <ListChecks className="h-5 w-5 text-cyan-600" />
            Seleccionar Perfil de Requerimientos
          </h3>
          <p className="text-sm text-gray-500 mt-1">
            Elige un perfil para cargar sus requerimientos nutricionales en el campo de restricciones.
          </p>
        </div>

        <div className="px-6 pb-6 flex-grow">
          {profiles.length > 0 ? (
            <ScrollArea className="h-[300px] border rounded-md">
              <div className="p-2 space-y-1">
                {profiles.map((profile) => (
                  <Button
                    key={profile.id}
                    variant="ghost"
                    className="w-full justify-start text-left h-auto py-2"
                    onClick={() => handleSelect(profile)}
                  >
                    <div className="flex flex-col">
                        <span className="font-medium">{profile.profileDisplayName}</span>
                        <span className="text-xs text-gray-500">
                            {typeof profile.animalType === 'string' ? profile.animalType.charAt(0).toUpperCase() + profile.animalType.slice(1) : 'N/D'} - {profile.growthStageDescription}
                        </span>
                    </div>
                  </Button>
                ))}
              </div>
            </ScrollArea>
          ) : (
            <p className="text-center text-gray-500 py-8">
              No hay perfiles de requerimientos en la biblioteca. Agrégalos desde el gestor de "Requerimientos".
            </p>
          )}
        </div>
        
        <div className="p-4 bg-gray-50 rounded-b-lg flex justify-end">
            <Button variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
        </div>
      </div>
    </div>
  );
};

export default SelectRequirementsDialog;
