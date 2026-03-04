
import { GoogleGenAI, Type } from "@google/genai";

const apiKey = typeof process !== 'undefined' && process.env ? process.env.API_KEY || process.env.GEMINI_API_KEY : import.meta.env.VITE_GEMINI_API_KEY;
const ai = new GoogleGenAI({ apiKey: apiKey || 'dummy-key-for-now' });

export const suggestTags = async (fileName: string): Promise<string[]> => {
  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `Based on the file name "${fileName}", suggest 3-5 short, relevant tags for 3D printing categorization. Output only as a JSON array of strings.`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: { type: Type.STRING }
        }
      }
    });

    const text = response.text;
    if (text) {
      return JSON.parse(text);
    }
  } catch (error) {
    console.error("AI Tag Suggestion Error:", error);
  }
  return [];
};

export const getSmartDescription = async (fileName: string, tags: string[]): Promise<string> => {
  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `Generate a brief, 1-sentence description for a 3D model file named "${fileName}" which has the following tags: ${tags.join(', ')}. Focus on what it likely is.`,
    });
    return response.text || "";
  } catch (error) {
    return "";
  }
};
