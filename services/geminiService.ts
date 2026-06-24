
import { GoogleGenAI, Type } from "@google/genai";
import { electronStorage, isElectron } from "./electronStorage";
import { httpStorage } from "./httpStorage";

let ai: GoogleGenAI | null = null;

const getAI = async (): Promise<GoogleGenAI | null> => {
  if (ai) return ai;

  // Electron only: key is stored locally and used directly in the renderer.
  // In web/Docker mode AI calls are proxied through the backend instead.
  if (!isElectron()) return null;
  const apiKey = await electronStorage.getApiKey();
  if (!apiKey) return null;
  ai = new GoogleGenAI({ apiKey });
  return ai;
};

export const suggestTags = async (fileName: string): Promise<string[]> => {
  // Web/Docker: proxy through the backend so the key never reaches the browser.
  if (!isElectron()) {
    return httpStorage.suggestTags(fileName);
  }
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
