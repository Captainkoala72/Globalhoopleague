export interface ParsedTeamStats {
  fg: string;
  threePt: string;
  ft: string;
  rebounds: number;
  assists: number;
  fouls: number;
  steals: number;
  turnovers: number;
  blocks: number;
  pts: number;
}

export interface ParsedBoxScore {
  away: string;
  home: string;
  quarterScores: {
    away: number[];
    home: number[];
    awayFinal: number;
    homeFinal: number;
  };
  teamStats: {
    away: ParsedTeamStats | null;
    home: ParsedTeamStats | null;
  };
  rawText: string;
}

export function parseBoxScore(rawText: string): ParsedBoxScore {
  const lines = rawText.split('\n').map(l => l.trim());

  let away = "";
  let home = "";
  const quarterScores = {
    away: [] as number[],
    home: [] as number[],
    awayFinal: 0,
    homeFinal: 0,
  };

  const totalsLines: string[] = [];
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (line.match(/^VISITOR:\s*(.*)/i)) {
      away = line.match(/^VISITOR:\s*(.*)/i)?.[1] || "";
    } else if (line.match(/^HOME:\s*(.*)/i)) {
      home = line.match(/^HOME:\s*(.*)/i)?.[1] || "";
    } else if (line.includes("SCORE BY PERIOD")) {
      const vLine = lines[i+1]?.trim().split(/\s+/);
      const hLine = lines[i+2]?.trim().split(/\s+/);
      
      if (vLine && vLine.length >= 3) {
        quarterScores.awayFinal = parseInt(vLine[vLine.length - 1], 10) || 0;
      }
      if (hLine && hLine.length >= 3) {
        quarterScores.homeFinal = parseInt(hLine[hLine.length - 1], 10) || 0;
      }
    } else if (/^TOTALS?\s+/i.test(line)) {
      totalsLines.push(line);
    }
  }

  // Simple heuristic: The first TOTALS line is Visitor, the second is Home.
  // We'll parse the fractions (FG, 3P, FT) and the numbers following them.
  const extractStats = (totalsLine: string): ParsedTeamStats | null => {
    // Strip "TOTALS" and split by spaces
    const parts = totalsLine.replace(/^TOTALS?\s+/i, "").trim().split(/\s+/);
    const fg = parts[0] || "0/0";
    const threePt = parts[1] || "0/0";
    const ft = parts[2] || "0/0";

    // Assuming layout: FGM-A 3PM-A FTM-A OREB DREB REB AST PF STL TO BLK PTS
    // Or FGM-A 3PM-A FTM-A REB AST PF STL TO BLK PTS
    // We'll rely on Gemini to fix any deep discrepancies but we'll try to map the last few correctly.
    // If we count from the back: PTS, BLK, TO, STL, PF, AST, REB
    const len = parts.length;
    return {
      fg,
      threePt,
      ft,
      pts: parseInt(parts[len - 1] || "0", 10),
      blocks: parseInt(parts[len - 2] || "0", 10),
      turnovers: parseInt(parts[len - 3] || "0", 10),
      steals: parseInt(parts[len - 4] || "0", 10),
      fouls: parseInt(parts[len - 5] || "0", 10),
      assists: parseInt(parts[len - 6] || "0", 10),
      rebounds: parseInt(parts[len - 7] || "0", 10),
    };
  };

  return {
    away,
    home,
    quarterScores,
    teamStats: {
      away: totalsLines.length > 0 ? extractStats(totalsLines[0]) : null,
      home: totalsLines.length > 1 ? extractStats(totalsLines[1]) : null,
    },
    rawText
  };
}
