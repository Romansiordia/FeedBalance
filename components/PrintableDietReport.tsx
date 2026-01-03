
import React from 'react';
import type { FormulateDietOutput, AnimalProfile } from '../types';

// Helper functions duplicated from DietOutputDisplay for use here, avoiding complex dependencies.
const formatNutrientName = (name: string): string => {
  const nameMapping: Record<string, string> = {
    protein: "Proteína", humedad: "Humedad", grasa: "Grasa", fiber: "Fibra Cruda",
    ceniza: "Ceniza", almidon: "Almidón", fdn: "FDN", fda: "FDA", energy: "Energía General",
    energiaAves: "Energía Aves", energiaCerdos: "Energía Cerdos", lactosa: "Lactosa",
    calcio: "Calcio", fosforo: "Fósforo Total", fosforoFitico: "Fósforo Fítico",
    zinc: "Zinc", cobre: "Cobre", hierro: "Hierro", manganeso: "Manganeso",
    cloro: "Cloro", sodio: "Sodio", azufre: "Azufre", potasio: "Potasio", magnesio: "Magnesio",
    lisina: "Lisina Total", lisinaDigestible: "Lisina Digestible", metionina: "Metionina Total",
    metioninaDigestible: "Metionina Digestible", metCisTotal: "Met+Cis Total",
    metCisDigestible: "Met+Cis Digestible", triptofano: "Triptófano Total",
    argininaTotal: "Arginina Total", argininaDigestible: "Arginina Digestible",
    leusinaTotal: "Leucina Total", leusinaDigestible: "Leucina Digestible",
    valina: "Valina Total", valinaDigestible: "Valina Digestible",
    treonina: "Treonina Total", isoleusina: "Isoleucina Total",
  };
  return nameMapping[name] || name.charAt(0).toUpperCase() + name.slice(1);
};

const getNutrientUnit = (name: string): string => {
  if (name.toLowerCase().includes("energy") || name.toLowerCase().includes("energía")) return "kcal/kg";
  return "%";
};


interface PrintableDietReportProps {
  diet: FormulateDietOutput;
  animalProfile: AnimalProfile;
}

const PrintableDietReport = React.forwardRef<HTMLDivElement, PrintableDietReportProps>(({ diet, animalProfile }, ref) => {
  const chemicalCompositionData = diet.chemicalComposition ? Object.entries(diet.chemicalComposition)
    .map(([key, value]) => ({
      nutrient: formatNutrientName(key),
      value: typeof value === 'number' ? value.toFixed(2) : String(value),
      unit: getNutrientUnit(key),
    }))
    .filter(item => typeof item.value !== 'undefined' && item.value !== null && item.value !== '' && item.value !== 'NaN')
    : [];

  const today = new Date();

  const styles = {
    page: {
      padding: '20mm', fontFamily: "'Inter', sans-serif", fontSize: '10pt',
      color: '#333333', width: '210mm', minHeight: '297mm', boxSizing: 'border-box' as const,
    },
    header: {
      textAlign: 'center' as const, marginBottom: '15mm', borderBottom: '1px solid #cccccc',
      paddingBottom: '5mm',
    },
    h1: { fontSize: '20pt', margin: '0 0 5px 0', color: '#0891b2', fontWeight: '700' },
    h2: { fontSize: '16pt', margin: '0 0 10px 0', color: '#4f4f4f', fontWeight: '600' },
    metaInfo: { fontSize: '8pt', color: '#666666', marginBottom: '10mm' },
    section: {
      marginBottom: '10mm', padding: '5mm', border: '1px solid #dddddd',
      borderRadius: '3px', backgroundColor: '#f9f9f9', pageBreakInside: 'avoid' as const,
    },
    sectionTitle: {
      fontSize: '12pt', fontWeight: 'bold' as const, marginBottom: '5mm',
      color: '#0891b2', borderBottom: '1px solid #eeeeee', paddingBottom: '2mm',
    },
    table: { width: '100%', borderCollapse: 'collapse' as const, fontSize: '9pt' },
    th: {
      textAlign: 'left' as const, padding: '2mm 1.5mm', borderBottom: '1px solid #cccccc',
      backgroundColor: '#e9ecef', fontWeight: 'bold' as const,
    },
    td: { padding: '2mm 1.5mm', borderBottom: '1px dotted #eeeeee' },
    tdRight: { padding: '2mm 1.5mm', borderBottom: '1px dotted #eeeeee', textAlign: 'right' as const },
    pre: {
      whiteSpace: 'pre-wrap' as const, wordWrap: 'break-word' as const, backgroundColor: '#f0f0f0',
      padding: '3mm', borderRadius: '3px', fontSize: '9pt', border: '1px solid #e0e0e0',
      fontFamily: "'Inter', sans-serif",
    },
    footer: {
      marginTop: '15mm', paddingTop: '5mm', borderTop: '1px solid #cccccc',
      textAlign: 'center' as const, fontSize: '8pt', color: '#666666',
    }
  };

  return (
    <div ref={ref} style={styles.page}>
      <header style={styles.header}>
        <h1 style={styles.h1}>Balance-Feed</h1>
        <h2 style={styles.h2}>Reporte de Formulación de Dieta</h2>
        <p style={styles.metaInfo}>Generado el: {today.toLocaleDateString('es-ES')} a las {today.toLocaleTimeString('es-ES')}</p>
      </header>

      <section style={styles.section}>
        <h3 style={styles.sectionTitle}>1. Perfil del Animal</h3>
        <table style={styles.table}>
          <tbody>
            <tr>
              <td style={{...styles.td, fontWeight: 'bold', width: '35%'}}>Tipo de Animal:</td>
              <td style={styles.td}>{animalProfile.animalType ? animalProfile.animalType.charAt(0).toUpperCase() + animalProfile.animalType.slice(1) : 'N/A'}</td>
            </tr>
            <tr>
              <td style={{...styles.td, fontWeight: 'bold'}}>Etapa de Crecimiento:</td>
              <td style={styles.td}>{animalProfile.growthStage || 'N/A'}</td>
            </tr>
            <tr>
              <td style={{...styles.td, fontWeight: 'bold'}}>Nivel de Producción Objetivo:</td>
              <td style={styles.td}>{animalProfile.targetProductionLevel || 'N/A'}</td>
            </tr>
          </tbody>
        </table>
      </section>

      <section style={styles.section}>
        <h3 style={styles.sectionTitle}>2. Composición de Ingredientes de la Dieta</h3>
        {diet.dietComposition && diet.dietComposition.length > 0 ? (
          <table style={styles.table}>
            <thead>
              <tr>
                <th style={styles.th}>Ingrediente</th>
                <th style={{...styles.th, textAlign: 'right' as const}}>Porcentaje (%)</th>
              </tr>
            </thead>
            <tbody>
              {diet.dietComposition.map((item, index) => (
                <tr key={index}>
                  <td style={styles.td}>{item.ingredient}</td>
                  <td style={styles.tdRight}>{item.percentage.toFixed(2)}%</td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <p style={{color: '#555555', padding: '2mm 1.5mm'}}>No hay datos de composición de ingredientes disponibles.</p>
        )}
      </section>

      <section style={styles.section}>
        <h3 style={styles.sectionTitle}>3. Composición Química de la Dieta</h3>
        {chemicalCompositionData.length > 0 ? (
          <table style={styles.table}>
            <thead>
              <tr>
                <th style={styles.th}>Nutriente</th>
                <th style={{...styles.th, textAlign: 'right' as const}}>Valor</th>
                <th style={{...styles.th, textAlign: 'right' as const}}>Unidad</th>
              </tr>
            </thead>
            <tbody>
              {chemicalCompositionData.map((item) => (
                <tr key={item.nutrient}>
                  <td style={styles.td}>{item.nutrient}</td>
                  <td style={styles.tdRight}>{item.value}</td>
                  <td style={styles.tdRight}>{item.unit}</td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <p style={{color: '#555555', padding: '2mm 1.5mm'}}>No hay datos de composición química disponibles.</p>
        )}
      </section>
      
      <section style={styles.section}>
        <h3 style={styles.sectionTitle}>4. Análisis Nutricional General y Observaciones</h3>
        {diet.nutritionalAnalysis ? (
          <pre style={styles.pre}>
            {diet.nutritionalAnalysis}
          </pre>
        ) : (
          <p style={{color: '#555555', padding: '2mm 1.5mm'}}>No hay análisis nutricional general disponible.</p>
        )}
      </section>

      <footer style={styles.footer}>
        <p>Reporte generado por Balance-Feed - Formulación de Dietas Animales Potenciada por IA</p>
        <p>&copy; {new Date().getFullYear()}</p>
      </footer>
    </div>
  );
});

PrintableDietReport.displayName = 'PrintableDietReport';

export default PrintableDietReport;
