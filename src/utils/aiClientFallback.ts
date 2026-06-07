import { GoogleGenAI } from "@google/genai";

export async function askForApiKeyAndGenerate(
  prompt: string,
  type: "odds" | "news"
): Promise<any> {
  const envKey = import.meta.env.VITE_GEMINI_API_KEY;
  let storedKey = localStorage.getItem("GEMINI_API_KEY") || envKey;

  if (!storedKey) {
    const userKey = window.prompt(
      "Your site is explicitly hosted without the server backend. Please enter a Gemini API Key to run generation strictly on your local browser (You are an Admin). This will be saved locally:"
    );
    if (!userKey) {
      throw new Error("No API Key provided for client-side generation fallback.");
    }
    storedKey = userKey;
    localStorage.setItem("GEMINI_API_KEY", storedKey);
  }

  const ai = new GoogleGenAI({ apiKey: storedKey });

  if (type === "odds") {
    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: prompt,
      config: {
        systemInstruction: "You are a sharp Vegas oddsmaker. You must approach every matchup with an absolute mathematical baseline of 0-0. Do not automatically favor the away team or assume an implicit advantage. Evaluate home-court advantage strictly as a defined, isolated metric value (e.g., +2.5 to +3 points to the point spread for the home team, or a minor percentage bump to win probability), rather than letting it or any hidden bias skew the overall calculation mechanics. Analyze the matchup stats, consider betting trends, and output ONLY a JSON object containing a raw predicted win probability for the Home Team. No extra reasoning.",
        responseMimeType: "application/json",
        responseSchema: {
          type: "OBJECT",
          properties: {
            homeWinProb: {
              type: "NUMBER",
              description: "Predicted win probability for the Home Team as a decimal between 0.01 and 0.99"
            }
          },
          required: ["homeWinProb"]
        }
      }
    });
    return JSON.parse(response.text || "{}");
  } else {
    // News fallback
    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: prompt,
    });
    return { text: response.text };
  }
}
