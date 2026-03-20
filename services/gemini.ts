import { GoogleGenAI } from "@google/genai";

/**
 * Generates sales insights based on vending machine sales data.
 * Initializes the Gemini client inside the function to ensure the latest API key is used.
 */
export async function getSalesInsights(salesData: string) {
  // Always use this initialization pattern as per Google GenAI guidelines.
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY as string });

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `Analyze this water vending machine sales data and provide 3 brief actionable insights for the owner: ${salesData}. Keep it professional and concise.`,
      config: {
        systemInstruction: "You are a business analyst specializing in small-scale vending machine operations.",
        temperature: 0.7,
      }
    });
    // Access the .text property directly (do not call as a function).
    return response.text;
  } catch (error) {
    console.error("Gemini Insights Error:", error);
    return "Unable to generate insights at the moment. Please check your data manually.";
  }
}
