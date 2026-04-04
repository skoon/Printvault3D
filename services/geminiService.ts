
import { GoogleGenAI, Type } from "@google/genai";
import { electronStorage, isElectron } from "./electronStorage";

let ai: GoogleGenAI | null = null;

const getAI = async (): Promise<GoogleGenAI | null> => {
  if (ai) return ai;

  let apiKey = '';
  if (isElectron()) {
    apiKey = await electronStorage.getApiKey();
  } else {
    apiKey = import.meta.env.VITE_GEMINI_API_KEY || '';
  }

  if (!apiKey) return null;
  ai = new GoogleGenAI({ apiKey });
  return ai;
};

export const suggestTags = async (fileName: string): Promise<string[]> => {
  try {
    const instance = await getAI();
    if (!instance) return [];

    const response = await instance.models.generateContent({
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
    const instance = await getAI();
    if (!instance) return "";

    const response = await instance.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `Generate a brief, 1-sentence description for a 3D model file named "${fileName}" which has the following tags: ${tags.join(', ')}. Focus on what it likely is.`,
    });
    return response.text || "";
  } catch (error) {
    return "";
  }
};
