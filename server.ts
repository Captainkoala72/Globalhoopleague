import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";

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
      const response = await ai.models.generateContent({
        model: "gemini-3.5-flash",
        contents: prompt,
      });

      res.json({ text: response.text });
    } catch (error: any) {
      console.error("AI Generation Error:", error);
      res.status(500).json({ error: error.message });
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
      
      const response = await ai.models.generateContent({
        model: "gemini-3.5-flash",
        contents: prompt,
        config: {
          systemInstruction: "You are a sharp Vegas oddsmaker. Analyze the matchup stats, consider betting trends, and output ONLY a JSON object containing a raw predicted win probability for the Home Team. No extra reasoning.",
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
      console.error("AI Odds Generation Error:", error);
      res.status(500).json({ error: error.message });
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

      const response = await ai.models.generateContent({
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
      console.error("AI Screenshot Analysis Error:", error);
      res.status(500).json({ error: error.message });
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
