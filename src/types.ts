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