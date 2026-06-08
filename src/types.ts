export interface CurrentSeasonStats {
  fgPct: number;
  threePtPct: number;
  ftPct: number;
  rebounds: number;
  assists: number;
  fouls: number;
  steals: number;
  turnovers: number;
  blocks: number;
}

export interface TeamStats {
  offense: number;
  defense: number;
  overall: number;
  ppg: number;
  oppg: number;
  fgPct: number;
  threePtPct: number;
  topg: number;
  wins: number;
  losses: number;
}

export interface Team {
  id: string;
  name: string;
  conference: string;
  stats: TeamStats;
  playoffStats?: Partial<TeamStats>;
  wins?: number;
  losses?: number;
  currentSeasonStats?: CurrentSeasonStats;
}

export interface Match {
  id: string;
  homeTeamId: string;
  awayTeamId: string;
  status: "scheduled" | "active" | "completed" | "settled" | "cancelled";
  date?: string;
  startTime?: string;
  week: number;
}

export interface Bet {
  id: string;
  userId: string;
  matchupId: string;
  status?: "active" | "won" | "lost" | "refunded";
  stake: number;
  payout: number;
  selection: any;
  matchupTitle: string;
  selectedTeamName: string;
  odds: number;
  timestamp: number;
}