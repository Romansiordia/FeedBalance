
import React, { useState, useRef } from 'react';
import { useAppState } from '../context/AppStateContext';
import { saveFormulationToLibrary } from '../services/formulationLibraryService';
import DietOutputDisplay from '../components/DietOutputDisplay';
import PrintableDietReport from '../components/PrintableDietReport';
import { ArrowLeft, Save, CheckCircle, AlertTriangle, Printer } from 'lucide-react';
import { Button } from '../components/ui/button';

const ResultsPage: React.FC = () => {
    const { lastFormulation, setIsResultsOpen } = useAppState();
    const reportRef = useRef<HTMLDivElement>(null);

    const generateDefaultName = () => {
        if (!lastFormulation) return '';
        const { animalType, growthStage } = lastFormulation.animalProfile;
        const date = new Date().toLocaleDateString('es-ES');
        const capitalizedAnimalType = animalType.charAt(0).toUpperCase() + animalType.slice(1);
        return `${capitalizedAnimalType} - ${growthStage} (${date})`;
    };
    
    const [formulationName, setFormulationName] = useState(generateDefaultName());
    const [saveStatus, setSaveStatus] = useState<'idle' | 'success' | 'error'>('idle');

    const handlePrint = () => {
        const node = reportRef.current;
        if (!node) {
            console.error("Printable report component not found.");
            return;
        }

        const reportHtml = node.innerHTML;
        const printDocumentStr = `
            <!DOCTYPE html>
            <html>
                <head>
                    <title>Reporte de Formulación</title>
                    <link rel="preconnect" href="https://fonts.googleapis.com">
                    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
                    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet">
                    <script>
                        function triggerPrint() {
                            window.focus();
                            window.print();
                        }

                        // Wait for fonts to be ready before printing to ensure correct rendering
                        if (document.fonts && document.fonts.ready) {
                            document.fonts.ready.then(triggerPrint).catch(function(e) {
                                console.error('Font loading failed, printing anyway.', e);
                                triggerPrint(); // Print even if fonts fail
                            });
                        } else {
                            // Fallback for older browsers
                            window.onload = triggerPrint;
                        }
                    </script>
                </head>
                <body>
                    ${reportHtml}
                </body>
            </html>
        `;

        const iframe = document.createElement('iframe');
        iframe.style.position = 'absolute';
        iframe.style.width = '0';
        iframe.style.height = '0';
        iframe.style.border = '0';
        iframe.setAttribute('title', 'Contenido de impresión');
        
        document.body.appendChild(iframe);
        iframe.srcdoc = printDocumentStr; // Use srcdoc to load the content
        
        // Cleanup after print dialog closes
        const handleAfterPrint = () => {
            if (document.body.contains(iframe)) {
                document.body.removeChild(iframe);
            }
            window.removeEventListener('afterprint', handleAfterPrint);
        };
        window.addEventListener('afterprint', handleAfterPrint);

        // Fallback cleanup in case the event doesn't fire
        setTimeout(handleAfterPrint, 3000);
    };

    if (!lastFormulation) {
        return (
            <div className="flex flex-col items-center justify-center h-screen bg-gray-100">
                <AlertTriangle className="h-12 w-12 text-yellow-500 mb-4" />
                <h2 className="text-2xl font-bold text-gray-800 mb-2">No Hay Resultados</h2>
                <p className="text-gray-600 mb-6">No se encontraron resultados de formulación. Por favor, vuelve y formula una dieta.</p>
                <Button
                    onClick={() => setIsResultsOpen(false)}
                >
                    <ArrowLeft className="h-4 w-4 mr-2" /> Volver
                </Button>
            </div>
        );
    }
    
    const handleSave = () => {
        if (!formulationName.trim()) {
            alert("Por favor, introduce un nombre para la formulación.");
            return;
        }

        if (!lastFormulation) {
            setSaveStatus('error');
            alert('Error: No hay datos de formulación para guardar.');
            console.error("Save failed: lastFormulation is null.");
            return;
        }

        try {
            saveFormulationToLibrary({
                ...lastFormulation,
                name: formulationName.trim(),
            });
            setSaveStatus('success');
        } catch (e) {
            setSaveStatus('error');
            console.error("Failed to save formulation:", e);
        }
    };


    return (
        <>
            <div className="print:hidden min-h-screen bg-slate-50 p-4 md:p-8">
                <header className="max-w-5xl mx-auto mb-6 flex justify-between items-center">
                    <h1 className="text-3xl font-bold text-cyan-700">Resultados de la Formulación</h1>
                    <Button
                        onClick={() => setIsResultsOpen(false)}
                        variant="outline"
                    >
                        <ArrowLeft className="h-4 w-4 mr-2" /> Volver a Balance-Feed
                    </Button>
                </header>
                
                <main className="max-w-5xl mx-auto space-y-6">
                     <div className="bg-white p-6 rounded-lg shadow-md border border-gray-200">
                        <h2 className="text-xl font-semibold text-gray-800 mb-4">Guardar y Exportar</h2>
                        <div className="flex flex-col sm:flex-row gap-4 items-center">
                            <input
                                type="text"
                                value={formulationName}
                                onChange={(e) => setFormulationName(e.target.value)}
                                placeholder="Nombre para esta formulación"
                                className="flex-grow focus:ring-cyan-500 focus:border-cyan-500 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md"
                                disabled={saveStatus === 'success'}
                            />
                            <div className="flex gap-2 w-full sm:w-auto">
                                <Button
                                    onClick={handleSave}
                                    disabled={!formulationName.trim() || saveStatus === 'success'}
                                >
                                {saveStatus === 'success' ? <><CheckCircle className="h-5 w-5 mr-2" /> Guardado</> : <><Save className="h-5 w-5 mr-2" /> Guardar</>}
                                </Button>
                                <Button
                                    onClick={handlePrint}
                                    variant="outline"
                                >
                                    <Printer className="h-5 w-5 mr-2" /> Imprimir Reporte
                                </Button>
                            </div>
                        </div>
                         {saveStatus === 'success' && <p className="text-sm text-green-600 mt-2">¡Formulación guardada en la biblioteca!</p>}
                         {saveStatus === 'error' && <p className="text-sm text-red-600 mt-2">Error al guardar. Inténtalo de nuevo.</p>}
                    </div>

                    <DietOutputDisplay diet={lastFormulation.formulationResult} />
                </main>
            </div>
             {/* This component is rendered off-screen so its content can be grabbed for printing */}
            <div className="absolute -left-[9999px] top-auto">
                {lastFormulation && (
                    <PrintableDietReport 
                        ref={reportRef} 
                        diet={lastFormulation.formulationResult} 
                        animalProfile={lastFormulation.animalProfile} 
                    />
                )}
            </div>
        </>
    );
};

export default ResultsPage;
