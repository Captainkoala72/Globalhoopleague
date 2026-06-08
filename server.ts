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
      const payload = req.body;
      const { homeTeamData, awayTeamData, headToHeadHistory, coachPlaystyles, sliderWeights } = payload;
      
      const ai = new GoogleGenAI({
        apiKey: process.env.GEMINI_API_KEY,
        httpOptions: {
          headers: { 'User-Agent': 'aistudio-build' }
        }
      });

      const isWeek1 = homeTeamData?.wins === 0 && homeTeamData?.losses === 0;
      
      let systemInstruction = `You are an expert, highly analytical Vegas oddsmaker.
The Neutral Baseline Rule: You must approach every matchup with an absolute 0-0 mathematical baseline. There must be zero implicit bias toward the Away or Home team. Home court advantage must strictly be applied as an isolated, modular boost based on the frontend slider weight.

Factor Weighing Instructions: Evaluate the matchup using the provided data points:
- Compare the rolling percentages (FG%, 3PT%, FTM%, TOT%, A%, PF%, ST%, TO%, BS%).
- Read the recent narrative arrays to adjust probabilities for clutch comebacks, 3rd-quarter chokes, and consistent standout/weak player performances.
- Compare the Coach Playstyles to determine tactical advantages (e.g., a fast-paced coach vs. a slow defensive coach).

You must output a strictly formatted JSON object with no extra reasoning text outside of the thinkingLog parameter.`;

      if (isWeek1) {
        systemInstruction += `

CRITICAL CONTEXT: This is Week 1 of a new season. The team's rolling percentage stats and narrative arrays are currently 0 or empty. You MUST completely ignore the lack of season stats. Base your entire calculation on the provided Coach Playstyles, the calculated Star Ratings, and the Historical Head-to-Head trends.`;
      }
      
      const prompt = `Analyze this exact matchup payload and generate strict odds based on these factors.\n\nPayload: ${JSON.stringify(payload, null, 2)}`;
      
      const response = await ai.models.generateContent({
        model: "gemini-3.5-flash",
        contents: prompt,
        config: {
          systemInstruction,
          responseMimeType: "application/json",
          responseSchema: {
            type: "OBJECT",
            properties: {
              homeWinProb: {
                type: "NUMBER",
                description: "Predicted win probability for the Home Team as a number between 0 and 100."
              },
              moneylinePick: {
                type: "STRING",
                description: "Team abbreviation for the moneyline pick."
              },
              homeMoneyline: {
                type: "STRING",
                description: "Strictly formatted American moneyline odds string for the home team (e.g., '-110', '+150')."
              },
              awayMoneyline: {
                type: "STRING",
                description: "Strictly formatted American moneyline odds string for the away team (e.g., '-110', '+150')."
              },
              spreadPick: {
                type: "STRING",
                description: "Team abbreviation for the spread pick."
              },
              spreadValue: {
                type: "STRING",
                description: "Point spread value for the pick (e.g., '-4.5', '+4.5')."
              },
              thinkingLog: {
                type: "STRING",
                description: "A detailed 4-to-5 paragraph explanation of exactly how you weighed the stats, narratives, and head-to-head history to reach these numbers."
              }
            },
            required: ["homeWinProb", "moneylinePick", "homeMoneyline", "awayMoneyline", "spreadPick", "spreadValue", "thinkingLog"]
          }
        }
      });
      
      const resultObj = JSON.parse(response.text || "{}");
      res.json(resultObj);
    } catch (error: any) {
      console.error("AI Odds Generation Error:", error);
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/analyze-boxscore", async (req, res) => {
    try {
      const { parsedStats, rawText } = req.body;
      const ai = new GoogleGenAI({
        apiKey: process.env.GEMINI_API_KEY,
        httpOptions: {
          headers: { 'User-Agent': 'aistudio-build' }
        }
      });
      
      const promptText = `Analyze this parsed basketball game data and raw box score text. Return a strict JSON object evaluating the following qualitative factors.

Parsed Stats: ${JSON.stringify(parsedStats)}
Raw Box Score Text:
${rawText}`;

      const response = await ai.models.generateContent({
        model: "gemini-3.5-flash", // Match existing model in project
        contents: promptText,
        config: {
          systemInstruction: "Analyze this parsed basketball game data and raw box score text. Return a strict JSON object evaluating the following qualitative factors:\ngameNarrative: A short, descriptive string of the game flow (e.g., 'Wire-to-wire blowout', 'Defensive grind').\nclutchTeam: The abbreviation of the team if they executed a significant 4th-quarter comeback to win, otherwise null.\nchokedTeam: The abbreviation of the team if they held a strong lead in the 1st half but suffered a major collapse to lose, otherwise null.\npacing: Evaluate the team tracking tempo. Return 'Fast' if the total score is exceptionally high for a 12-minute game, or 'Slow' if it was a low-possession, half-court game.\ntopPerformers: An array of strings containing player names who had highly efficient, standout games (look for high points, assists, or positive +/- impact).\nweakPerformers: An array of strings containing player names who struggled significantly (low efficiency, high turnovers, or highly negative +/- impact).",
          responseMimeType: "application/json",
          responseSchema: {
            type: "OBJECT",
            properties: {
              gameNarrative: { type: "STRING" },
              clutchTeam: { type: "STRING" },
              chokedTeam: { type: "STRING" },
              pacing: { type: "STRING" },
              topPerformers: { type: "ARRAY", items: { type: "STRING" } },
              weakPerformers: { type: "ARRAY", items: { type: "STRING" } },
            }
          }
        }
      });

      res.json(JSON.parse(response.text || "{}"));
    } catch (error: any) {
      console.error("AI Box Score Analysis Error:", error);
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
