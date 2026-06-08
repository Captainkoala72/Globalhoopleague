import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";
import fs from "fs";
import { initializeApp } from "firebase/app";
import { getFirestore, doc, getDoc } from "firebase/firestore";

// Initialize Firebase for Backend Use
const configPath = path.resolve(process.cwd(), "firebase-applet-config.json");
const config = JSON.parse(fs.readFileSync(configPath, "utf8"));

const firebaseApp = initializeApp({
  apiKey: config.apiKey,
  authDomain: config.authDomain,
  projectId: config.projectId,
  storageBucket: config.storageBucket,
  messagingSenderId: config.messagingSenderId,
  appId: config.appId,
});

const db = getFirestore(firebaseApp, config.firestoreDatabaseId);

const DEFAULT_SYSTEM_PROMPT = "You are a sharp Vegas oddsmaker. You must approach every matchup with an absolute mathematical baseline of 0-0. Do not automatically favor the away team or assume an implicit advantage. Evaluate home-court advantage strictly as a defined, isolated metric value (e.g., +2.5 to +3 points to the point spread for the home team, or a minor percentage bump to win probability), rather than letting it or any hidden bias skew the overall calculation mechanics. Analyze the matchup stats, consider betting trends, and output ONLY a JSON object containing a raw predicted win probability for the Home Team. No extra reasoning.";

// Resilient API Call Wrapper with exponential retry backoff and alternative model fallbacks
async function callGeminiResiliently(
  ai: GoogleGenAI,
  params: {
    model: string;
    contents: any;
    config?: any;
  },
  retries = 3,
  delayMs = 800
): Promise<any> {
  let attempt = 0;
  const modelsToTry = [params.model, "gemini-flash-latest", "gemini-3.1-flash-lite"];
  
  for (const currentModel of modelsToTry) {
    let currentDelay = delayMs;
    for (let ruleAttempt = 0; ruleAttempt < retries; ruleAttempt++) {
      try {
        console.log(`[Gemini Resilient Call] Invoking ${currentModel}, Attempt ${ruleAttempt + 1}`);
        const response = await ai.models.generateContent({
          ...params,
          model: currentModel,
        });
        if (response && response.text) {
          return response;
        }
        throw new Error("Empty response or text attribute missing in Gemini response");
      } catch (error: any) {
        console.warn(`[Gemini Resilient Call] Failed (model: ${currentModel}, attempt: ${ruleAttempt + 1}):`, error.message || error);
        
        const errorStr = (typeof error === "object" ? JSON.stringify(error) : error.message) || "";
        const isTransient = errorStr.includes("503") || errorStr.includes("UNAVAILABLE") || errorStr.includes("demand") || errorStr.includes("quota") || errorStr.includes("exhausted");
        
        if (ruleAttempt < retries - 1 && isTransient) {
          console.log(`[Gemini Resilient Call] Backing off for ${currentDelay}ms before retry...`);
          await new Promise((resolve) => setTimeout(resolve, currentDelay));
          currentDelay *= 1.5;
        } else {
          break; // Fall out of retry loop to try the next model
        }
      }
    }
  }
  
  // Final exact attempt fallback to propagate the system-level error cleanly
  console.log(`[Gemini Resilient Call] Exhausted fallbacks, running final direct call to ${params.model}`);
  return await ai.models.generateContent(params);
}

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json({ limit: "50mb" }));
  app.use(express.urlencoded({ limit: "50mb", extended: true }));

  // API routes FIRST
  app.post("/api/generate-news", async (req, res) => {
    try {
      const { prompt } = req.body;
      const ai = new GoogleGenAI({ 
        apiKey: process.env.GEMINI_API_KEY,
        httpOptions: {
            headers: { 'User-Agent': 'aistudio-build' }
        }
      });
      const response = await callGeminiResiliently(ai, {
        model: "gemini-3.5-flash",
        contents: prompt,
      });

      res.json({ text: response.text });
    } catch (error: any) {
      console.error("AI Generation Error in /api/generate-news:", error);
      res.status(500).json({ error: error.message || "Failed to generate news" });
    }
  });

  app.post("/api/generate-odds", async (req, res) => {
    try {
      const { prompt } = req.body;
      const ai = new GoogleGenAI({
        apiKey: process.env.GEMINI_API_KEY,
        httpOptions: {
          headers: { 'User-Agent': 'aistudio-build' }
        }
      });
      
      // Dynamic Firestore fetch with fallback guardrail
      let systemInstruction = DEFAULT_SYSTEM_PROMPT;
      try {
        const docRef = doc(db, "config", "aiSettings");
        const docSnap = await getDoc(docRef);
        if (docSnap.exists() && docSnap.data().systemPrompt) {
          systemInstruction = docSnap.data().systemPrompt;
        }
      } catch (err) {
        console.warn("Firestore fetch error in dynamic OddsCalculator backend, using baseline fallback:", err);
      }
      
      const response = await callGeminiResiliently(ai, {
        model: "gemini-3.5-flash",
        contents: prompt,
        config: {
          systemInstruction: systemInstruction,
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

      res.json(JSON.parse(response.text));
    } catch (error: any) {
      console.error("AI Odds Generation Error in /api/generate-odds:", error);
      res.status(500).json({ error: error.message || "Failed to generate odds" });
    }
  });

  app.post("/api/analyze-match-screenshot", async (req, res) => {
    try {
      const { imageBase64, mimeType } = req.body;
      const ai = new GoogleGenAI({
        apiKey: process.env.GEMINI_API_KEY,
        httpOptions: {
          headers: { 'User-Agent': 'aistudio-build' }
        }
      });
      
      const promptText = `Analyze the provided basketball post-game summary screenshot. Extract the data into a strict JSON object.

Data to Extract:
- teams: Extract the home and away team abbreviations and their updated records.
- quarterScores: Extract the exact points scored by both teams in Q1, Q2, Q3, Q4, and the Final score.
- teamStats: Extract Field Goals (makes/attempts and percentage), 3-Pointers, Rebounds, Assists, Steals, and Blocks for both teams.
- topPerformers: Extract the names, stats, and positions of the highlighted players. Ensure the system correctly registers the 'Guard' position, recognizing it acts as a hybrid role that can play either PG or SG. Note any special markers like '*Career High'.
- gameNarrative: Based on the quarter scores, generate a short string defining the game flow (e.g., "Massive 4th Quarter Comeback by [Team]", "Wire-to-Wire Blowout", "Defensive Grind").

CRITICAL INSTRUCTION: You must strictly extract only the textual stats visible in the image. Do NOT include, echo, or regurgitate raw image data, base64 strings, or file syntax anywhere in your JSON output. Keep your text values concise.`;

      const response = await callGeminiResiliently(ai, {
        model: "gemini-3.5-flash",
        contents: {
          parts: [
            { inlineData: { data: imageBase64, mimeType } },
            { text: promptText }
          ]
        },
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: "OBJECT",
            properties: {
              teams: {
                type: "OBJECT",
                properties: {
                  home: { type: "STRING" },
                  away: { type: "STRING" },
                  homeRecord: { type: "STRING" },
                  awayRecord: { type: "STRING" }
                }
              },
              quarterScores: {
                type: "OBJECT",
                properties: {
                  home: { type: "ARRAY", items: { type: "NUMBER" } },
                  away: { type: "ARRAY", items: { type: "NUMBER" } },
                  homeFinal: { type: "NUMBER" },
                  awayFinal: { type: "NUMBER" }
                }
              },
              teamStats: {
                type: "OBJECT",
                properties: {
                  home: { 
                    type: "OBJECT", 
                    properties: {
                      fg: { type: "STRING" },
                      fgPct: { type: "STRING" },
                      threePt: { type: "STRING" },
                      threePtPct: { type: "STRING" },
                      rebounds: { type: "STRING" },
                      assists: { type: "STRING" },
                      steals: { type: "STRING" },
                      blocks: { type: "STRING" },
                      turnovers: { type: "STRING" }
                    }
                  },
                  away: { 
                    type: "OBJECT", 
                    properties: {
                      fg: { type: "STRING" },
                      fgPct: { type: "STRING" },
                      threePt: { type: "STRING" },
                      threePtPct: { type: "STRING" },
                      rebounds: { type: "STRING" },
                      assists: { type: "STRING" },
                      steals: { type: "STRING" },
                      blocks: { type: "STRING" },
                      turnovers: { type: "STRING" }
                    }
                  }
                }
              },
              topPerformers: {
                type: "ARRAY",
                items: {
                  type: "OBJECT",
                  properties: {
                    name: { type: "STRING" },
                    stats: { type: "STRING" },
                    position: { type: "STRING" },
                    notes: { type: "STRING" }
                  }
                }
              },
              gameNarrative: { type: "STRING" }
            },
            required: ["teams", "quarterScores", "teamStats", "topPerformers", "gameNarrative"]
          }
        }
      });

      res.json(JSON.parse(response.text));
    } catch (error: any) {
      console.error("AI Screenshot Analysis Error in /api/analyze-match-screenshot:", error);
      res.status(500).json({ error: error.message || "Failed to analyze match screenshot" });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
