import { GoogleGenAI, Type } from "@google/genai";
import { Provider } from '../types';

let ai: GoogleGenAI | undefined;

try {
  // Safely check for the API key in a way that works in both Node.js and browser environments.
  if (typeof process !== 'undefined' && process.env && process.env.API_KEY) {
    ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  } else {
    // In a browser environment or if the key is missing, `ai` will remain undefined.
    // The application will still run, and AI features will be gracefully disabled.
    console.warn(
      "Gemini API key not found. AI features will be disabled. " +
      "This is expected in a browser-only environment."
    );
  }
} catch (e) {
  // This catch block is a fallback for any other unexpected errors during initialization.
  console.error(
    "An unexpected error occurred while initializing the Gemini API client. AI features will be disabled. Error: ", e
  );
}

const responseSchema = {
  type: Type.OBJECT,
  properties: {
    plan: {
      type: Type.ARRAY,
      description: "Array of recommended provider objects. Include one for food, one for music, and one for decoration if possible within budget.",
      items: {
        type: Type.OBJECT,
        properties: {
          providerId: {
            type: Type.STRING,
            description: "The ID of the recommended provider.",
          },
          serviceId: {
            type: Type.STRING,
            description: "The ID of the recommended service from that provider.",
          },
        },
      },
    },
    justification: {
      type: Type.STRING,
      description: "A friendly and brief explanation of why these providers were chosen, mentioning how they fit the budget and location.",
    },
    totalCost: {
        type: Type.NUMBER,
        description: "The sum of the prices of all recommended services."
    }
  },
};


export const generatePartyPlan = async (budget: number, location: string, providers: Provider[]) => {
  if (!ai) {
    console.error("Gemini API client is not initialized.");
    throw new Error("El planificador con IA no está disponible en este momento. Por favor, inténtalo más tarde.");
  }

  const simplifiedProviders = providers.map(p => ({
    id: p.id,
    brandName: p.brandName,
    category: p.category,
    location: p.location,
    services: p.services.map(s => ({ id: s.id, name: s.name, price: s.price })),
  }));

  const prompt = `
    Eres "FestEasy AI", un asistente experto en planificación de fiestas. Tu objetivo es crear un paquete de fiesta increíble y coherente para un usuario, respetando su presupuesto y ubicación.

    **Tarea:**
    Analiza la siguiente lista de proveedores disponibles y crea un paquete de fiesta ideal.

    **Restricciones:**
    1.  **Presupuesto Máximo Total:** ${budget} MXN. El costo total del paquete no debe exceder esta cantidad.
    2.  **Ubicación del Evento:** "${location}". Prioriza proveedores que estén en la misma ciudad o cerca.
    3.  **Composición del Paquete:** El paquete debe incluir, si es posible dentro del presupuesto:
        - Un (1) proveedor de Comida.
        - Un (1) proveedor de Música.
        - Un (1) proveedor de Decoración.
    4.  **Selección Lógica:** Escoge los servicios más apropiados de cada proveedor para un paquete base.

    **Proveedores Disponibles (formato JSON):**
    ${JSON.stringify(simplifiedProviders, null, 2)}

    **Respuesta:**
    Devuelve tu recomendación en el formato JSON especificado.
  `;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema,
      },
    });

    const text = response.text.trim();
    // Assuming the response is a valid JSON string matching the schema.
    const parsedResponse = JSON.parse(text);
    return parsedResponse;

  } catch (error) {
    console.error("Error calling Gemini API:", error);
    throw new Error("No se pudo generar el plan de fiesta. Inténtalo de nuevo.");
  }
};