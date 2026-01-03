
import React from 'react';
import type { FormulateDietOutput } from '../types';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './ui/Table';
import { IngredientPieChart } from './IngredientPieChart';
import { ClipboardList, FlaskConical, Percent, DollarSign } from 'lucide-react';

const formatNutrientName = (name: string): string => {
  const nameMapping: Record<string, string> = {
    protein: "Proteína",
    humedad: "Humedad",
    grasa: "Grasa",
    fiber: "Fibra Cruda",
    ceniza: "Ceniza",
    almidon: "Almidón",
    fdn: "FDN",
    fda: "FDA",
    energy: "Energía General",
    energiaAves: "Energía Aves",
    energiaCerdos: "Energía Cerdos",
    lactosa: "Lactosa",
    calcio: "Calcio",
    fosforo: "Fósforo Total",
    fosforoFitico: "Fósforo Fítico",
    zinc: "Zinc",
    cobre: "Cobre",
    hierro: "Hierro",
    manganeso: "Manganeso",
    cloro: "Cloro",
    sodio: "Sodio",
    azufre: "Azufre",
    potasio: "Potasio",
    magnesio: "Magnesio",
    lisina: "Lisina Total",
    lisinaDigestible: "Lisina Digestible",
    metionina: "Metionina Total",
    metioninaDigestible: "Metionina Digestible",
    metCisTotal: "Met+Cis Total",
    metCisDigestible: "Met+Cis Digestible",
    triptofano: "Triptófano Total",
    argininaTotal: "Arginina Total",
    argininaDigestible: "Arginina Digestible",
    leusinaTotal: "Leucina Total",
    leusinaDigestible: "Leucina Digestible",
    valina: "Valina Total",
    valinaDigestible: "Valina Digestible",
    treonina: "Treonina Total",
    isoleusina: "Isoleucina Total",
  };
  return nameMapping[name] || name.charAt(0).toUpperCase() + name.slice(1);
};


const getNutrientUnit = (name: string): string => {
  if (name.toLowerCase().includes("energy") || name.toLowerCase().includes("energía")) return "kcal/kg";
  return "%";
};

const DietOutputDisplay: React.FC<{ diet: FormulateDietOutput }> = ({ diet }) => {
  const chemicalCompositionData = diet.chemicalComposition ?
    Object.entries(diet.chemicalComposition)
      .filter(([, value]) => value !== undefined && value !== null)
      .map(([key, value]) => ({
        nutrient: formatNutrientName(key),
        value: typeof value === 'number' ? value.toFixed(2) : String(value),
        unit: getNutrientUnit(key),
      }))
    : [];

  return (
    <div className="w-full bg-white p-6 rounded-lg shadow-md border border-gray-200 space-y-8">
      <div className="flex items-center gap-3">
        <ClipboardList className="h-8 w-8 text-cyan-600" />
        <div>
          <h2 className="text-2xl font-bold text-gray-800">Resultados de la Dieta Formulada</h2>
          <p className="text-sm text-gray-500">Composición, análisis nutricional y de costos optimizados por IA.</p>
        </div>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div>
          <h3 className="text-lg font-semibold text-gray-700 mb-3 flex items-center gap-2">
            <FlaskConical className="h-5 w-5 text-cyan-500" /> Composición Química
          </h3>
          <div className="max-h-96 overflow-y-auto border rounded-md">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nutriente</TableHead>
                  <TableHead className="text-right">Valor</TableHead>
                  <TableHead className="text-right">Unidad</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {chemicalCompositionData.map((item) => (
                  <TableRow key={item.nutrient}>
                    <TableCell>{item.nutrient}</TableCell>
                    <TableCell className="text-right">{item.value}</TableCell>
                    <TableCell className="text-right">{item.unit}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </div>
        
        {diet.dietComposition && diet.dietComposition.length > 0 && (
          <div className="flex flex-col">
            <h3 className="text-lg font-semibold text-gray-700 mb-3 flex items-center gap-2">
              <Percent className="h-5 w-5 text-cyan-500" /> Composición de Ingredientes
            </h3>
            <div className="flex-grow">
              <IngredientPieChart data={diet.dietComposition} />
            </div>
          </div>
        )}
      </div>

      {diet.costAnalysis && (
        <div>
          <h3 className="text-lg font-semibold text-gray-700 mb-3 flex items-center gap-2">
            <DollarSign className="h-5 w-5 text-cyan-500" /> Análisis de Costos (100 unidades)
          </h3>
          <div className="border rounded-md">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Ingrediente</TableHead>
                  <TableHead className="text-right">%</TableHead>
                  <TableHead className="text-right">Precio/U</TableHead>
                  <TableHead className="text-right">Costo</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {diet.costAnalysis.ingredientCosts.map((item, index) => (
                  <TableRow key={index}>
                    <TableCell>{item.ingredient}</TableCell>
                    <TableCell className="text-right">{item.percentage.toFixed(2)}</TableCell>
                    <TableCell className="text-right">{item.pricePerUnit.toFixed(2)}</TableCell>
                    <TableCell className="text-right">{item.costContribution.toFixed(2)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
          <p className="mt-2 text-right font-semibold text-gray-800">
            Costo Total (100 unidades): ${diet.costAnalysis.totalDietCost.toFixed(2)}
          </p>
        </div>
      )}

      <div>
        <h3 className="text-lg font-semibold text-gray-700 mb-3">Análisis y Observaciones de IA</h3>
        <div className="p-4 rounded-md border bg-gray-50 max-h-48 overflow-y-auto">
          <pre className="text-sm text-gray-600 whitespace-pre-wrap font-sans">
            {diet.nutritionalAnalysis || "No hay análisis disponible."}
          </pre>
        </div>
      </div>
    </div>
  );
};

export default DietOutputDisplay;
