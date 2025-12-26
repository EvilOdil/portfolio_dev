import { GoogleGenAI } from "@google/genai";

const API_KEY = process.env.API_KEY || '';

// Initialize safely. If no key, we just won't make calls.
const ai = API_KEY ? new GoogleGenAI({ apiKey: API_KEY }) : null;

export const getRaceCommentary = async (speed: number, distance: number, isStopped: boolean): Promise<string> => {
  if (!ai) return "AI Offline (No Key)";

  try {
    const prompt = `
      You are a sarcastic and high-energy futuristic race engineer talking to a driver over the radio.
      Current Status:
      - Speed: ${Math.round(speed)} units/hr (Max is 60)
      - Distance Traveled: ${Math.round(distance)} units
      - Is Stopped: ${isStopped}

      Task: Give a very short, 1-sentence reaction. 
      If stopped, tell them to move. If fast, cheer. If slow, mock them gently.
      Keep it under 15 words.
    `;

    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview', // Fast model for real-time-ish feels
      contents: prompt,
      config: {
        maxOutputTokens: 50,
        temperature: 0.9,
      }
    });

    return response.text?.trim() || "Radio static...";
  } catch (error) {
    console.error("Gemini Error:", error);
    return "Connection lost...";
  }
};
