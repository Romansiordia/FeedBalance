
import { GoogleGenAI, Type } from "@google/genai";
import type { FormulateDietInput, FormulateDietOutput, SuggestIngredientsInput, SuggestIngredientsOutput, ValidatedFeedIngredient } from '../types';

let aiInstance: GoogleGenAI | null = null;

const getAiClient = (): GoogleGenAI => {
    // FIX: Vercel requires environment variables to be prefixed with NEXT_PUBLIC_ to be exposed to the browser.
    const API_KEY = process.env.NEXT_PUBLIC_API_KEY;

    if (!API_KEY) {
        throw new Error("La API Key de Google AI no está configurada. Por favor, añádela como una variable de entorno llamada NEXT_PUBLIC_API_KEY en la configuración de tu proyecto en Vercel.");
    }

    if (!aiInstance) {
        aiInstance = new GoogleGenAI({ apiKey: API_KEY });
    }
    return aiInstance;
};

const chemicalCompositionSchema = {
    type: Type.OBJECT,
    properties: {
        protein: { type: Type.NUMBER, nullable: true },
        humedad: { type: Type.NUMBER, nullable: true },
        grasa: { type: Type.NUMBER, nullable: true },
        fiber: { type: Type.NUMBER, nullable: true },
        ceniza: { type: Type.NUMBER, nullable: true },
        almidon: { type: Type.NUMBER, nullable: true },
        fdn: { type: Type.NUMBER, nullable: true },
        fda: { type: Type.NUMBER, nullable: true },
        energy: { type: Type.NUMBER, nullable: true },
        energiaAves: { type: Type.NUMBER, nullable: true },
        energiaCerdos: { type: Type.NUMBER, nullable: true },
        lactosa: { type: Type.NUMBER, nullable: true },
        calcio: { type: Type.NUMBER, nullable: true },
        fosforo: { type: Type.NUMBER, nullable: true },
        fosforoFitico: { type: Type.NUMBER, nullable: true },
        zinc: { type: Type.NUMBER, nullable: true },
        cobre: { type: Type.NUMBER, nullable: true },
        hierro: { type: Type.NUMBER, nullable: true },
        manganeso: { type: Type.NUMBER, nullable: true },
        cloro: { type: Type.NUMBER, nullable: true },
        sodio: { type: Type.NUMBER, nullable: true },
        azufre: { type: Type.NUMBER, nullable: true },
        potasio: { type: Type.NUMBER, nullable: true },
        magnesio: { type: Type.NUMBER, nullable: true },
        lisina: { type: Type.NUMBER, nullable: true },
        lisinaDigestible: { type: Type.NUMBER, nullable: true },
        metionina: { type: Type.NUMBER, nullable: true },
        metioninaDigestible: { type: Type.NUMBER, nullable: true },
        metCisTotal: { type: Type.NUMBER, nullable: true },
        metCisDigestible: { type: Type.NUMBER, nullable: true },
        triptofano: { type: Type.NUMBER, nullable: true },
        argininaTotal: { type: Type.NUMBER, nullable: true },
        argininaDigestible: { type: Type.NUMBER, nullable: true },
        leusinaTotal: { type: Type.NUMBER, nullable: true },
        leusinaDigestible: { type: Type.NUMBER, nullable: true },
        valina: { type: Type.NUMBER, nullable: true },
        valinaDigestible: { type: Type.NUMBER, nullable: true },
        treonina: { type: Type.NUMBER, nullable: true },
        isoleusina: { type: Type.NUMBER, nullable: true },
    }
};


const dietOutputSchema = {
    type: Type.OBJECT,
    properties: {
        dietComposition: {
            type: Type.ARRAY,
            items: {
                type: Type.OBJECT,
                properties: {
                    ingredient: { type: Type.STRING },
                    percentage: { type: Type.NUMBER }
                },
                required: ["ingredient", "percentage"]
            }
        },
        chemicalComposition: chemicalCompositionSchema,
        costAnalysis: {
            type: Type.OBJECT,
            properties: {
                ingredientCosts: {
                    type: Type.ARRAY,
                    items: {
                        type: Type.OBJECT,
                        properties: {
                            ingredient: { type: Type.STRING },
                            percentage: { type: Type.NUMBER },
                            pricePerUnit: { type: Type.NUMBER },
                            costContribution: { type: Type.NUMBER }
                        },
                        required: ["ingredient", "percentage", "pricePerUnit", "costContribution"]
                    }
                },
                totalDietCost: { type: Type.NUMBER }
            },
            required: ["ingredientCosts", "totalDietCost"]
        },
        nutritionalAnalysis: { type: Type.STRING }
    },
    required: ["dietComposition", "chemicalComposition", "costAnalysis", "nutritionalAnalysis"]
};

// Get all possible nutrient keys to ensure a consistent data structure is sent to the AI
const nutrientKeys = Object.keys(chemicalCompositionSchema.properties) as Array<keyof typeof chemicalCompositionSchema.properties>;

const generateIngredientJSON = (ingredients: ValidatedFeedIngredient[]): string => {
    const serializableIngredients = ingredients.map(ing => {
        // Create a complete ingredient object with all nutrient keys
        const completeIng: Record<string, any> = {
            name: ing.name,
            price: ing.price,
            otherNutrients: ing.otherNutrients || "",
        };

        for (const key of nutrientKeys) {
            // Use the ingredient's value if available, otherwise default to 0.
            // This prevents sparse objects and provides a consistent structure for the AI.
            completeIng[key] = ing[key as keyof ValidatedFeedIngredient] ?? 0;
        }

        return completeIng;
    });
    return JSON.stringify(serializableIngredients, null, 2);
};


export const formulateDiet = async (input: FormulateDietInput): Promise<FormulateDietOutput> => {
    const ai = getAiClient();
    const ingredientDetailsJSON = generateIngredientJSON(input.feedIngredients);
    
    const prompt = `
    You are Balance, a world-class AI nutritionist specializing in animal diet formulation. Your task is to create an optimal, cost-effective diet based on the provided data. You must generate a single, complete, and valid JSON object that strictly adheres to the provided JSON schema. Do not output any other text, explanations, or markdown.

    **Follow this exact process:**

    1.  **Analyze Requirements:** Scrutinize the animal profile and the formulation constraints to understand the nutritional targets (e.g., minimum protein, specific energy levels, maximum fiber).
    2.  **Optimize Composition:** Determine the ideal percentage for each available ingredient to meet the nutritional requirements at the lowest possible cost. This is an optimization problem. The sum of all ingredient percentages in \`dietComposition\` **must equal exactly 100**.
    3.  **Calculate Final Profile:** Based on the optimized \`dietComposition\`, compute the final \`chemicalComposition\` of the diet. This is a weighted average of the nutrients from each ingredient.
    4.  **Analyze Costs:** Calculate the \`costAnalysis\`, including the cost contribution of each ingredient and the \`totalDietCost\` for 100 units of the diet.
    5.  **Summarize:** Write a brief, professional \`nutritionalAnalysis\` explaining the key characteristics of the formulated diet.
    6.  **Format Output:** Combine all results into a single JSON object that validates against the required schema.

    **Input Data:**

    1.  **Animal Profile:**
        *   Animal Type: ${input.animalType}
        *   Growth Stage: ${input.growthStage}
        *   Target Production Level: ${input.targetProductionLevel}

    2.  **Available Ingredients (JSON format):**
        \`\`\`json
        ${ingredientDetailsJSON}
        \`\`\`

    3.  **Formulation Constraints & Goals:**
        *   ${input.constraints || "Optimize for the lowest cost while meeting standard nutritional requirements for the specified animal profile."}

    Now, generate the JSON output.
    `;

    try {
        const response = await ai.models.generateContent({
            model: 'gemini-3-flash-preview',
            contents: prompt,
            config: {
                responseMimeType: "application/json",
                responseSchema: dietOutputSchema,
                temperature: 0.3,
            }
        });
        
        const jsonText = response.text.trim();
        return JSON.parse(jsonText) as FormulateDietOutput;
    } catch (error) {
        console.error("Error in Gemini API call for formulateDiet:", error);
        let detailedMessage = "No se pudo obtener una respuesta válida de la IA. El modelo puede estar sobrecargado o la entrada no es válida.";
        if (error instanceof Error) {
            const lowerCaseError = error.message.toLowerCase();
            if (lowerCaseError.includes('api key not valid') || lowerCaseError.includes('permission denied') || lowerCaseError.includes('api_key')) {
                detailedMessage = "La clave API de Google AI no es válida o no tiene los permisos necesarios. Verifica la clave en la variable de entorno NEXT_PUBLIC_API_KEY de tu proyecto en Vercel.";
            } else if (lowerCaseError.includes('deadline exceeded')) {
                detailedMessage = "La solicitud a la IA tardó demasiado en responder (timeout). Inténtalo de nuevo en unos momentos.";
            } else if (lowerCaseError.includes('400')) {
                detailedMessage = "La solicitud a la IA fue malformada. Revisa los datos de los ingredientes. Si el problema persiste, podría ser un error temporal de la IA.";
            }
        }
        throw new Error(detailedMessage);
    }
};

export const suggestIngredients = async (input: SuggestIngredientsInput): Promise<SuggestIngredientsOutput> => {
    const ai = getAiClient();
    const prompt = `
    Based on the following animal profile, suggest a list of 5 to 10 common and effective feed ingredients.
    - Animal Type: ${input.animalType}
    - Growth Stage: ${input.growthStage}

    Provide the response as a JSON object with a single key "suggestedIngredients" which is an array of strings. For example: {"suggestedIngredients": ["Corn", "Soybean Meal", ...]}.
    `;

    try {
        const response = await ai.models.generateContent({
            model: 'gemini-3-flash-preview',
            contents: prompt,
             config: {
                responseMimeType: "application/json",
                responseSchema: {
                    type: Type.OBJECT,
                    properties: {
                        suggestedIngredients: {
                            type: Type.ARRAY,
                            items: { type: Type.STRING }
                        }
                    },
                    required: ["suggestedIngredients"]
                }
            }
        });
        
        const jsonText = response.text.trim();
        return JSON.parse(jsonText) as SuggestIngredientsOutput;

    } catch (error) {
        console.error("Error in Gemini API call for suggestIngredients:", error);
        let detailedMessage = "No se pudieron obtener sugerencias de ingredientes de la IA.";
        if (error instanceof Error) {
             const lowerCaseError = error.message.toLowerCase();
            if (lowerCaseError.includes('api key not valid') || lowerCaseError.includes('permission denied') || lowerCaseError.includes('api_key')) {
                detailedMessage = "La clave API de Google AI no es válida. Verifica la clave en la variable de entorno NEXT_PUBLIC_API_KEY de tu proyecto en Vercel.";
            }
        }
        throw new Error(detailedMessage);
    }
};
