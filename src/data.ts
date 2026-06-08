import { calculateMarketOdds } from "./utils/oddsEngine";

const DEFAULT_STATS = {
  offense: 4.0,
  defense: 4.0,
  overall: 4.0,
  ppg: 105,
  oppg: 105,
  fgPct: 45,
  threePtPct: 35,
  topg: 12,
  wins: 10,
  losses: 10,
};

const DEFAULT_CURRENT_SEASON_STATS = {
  fgPct: 0,
  threePtPct: 0,
  ftPct: 0,
  rebounds: 0,
  assists: 0,
  fouls: 0,
  steals: 0,
  turnovers: 0,
  blocks: 0,
};

export const INITIAL_TEAMS = [
  {
    id: "t_nyh",
    name: "New York Hustlers",
    conference: "USA",
    stats: {
      ...DEFAULT_STATS,
      offense: 4.8,
      defense: 4.2,
      overall: 4.5,
      ppg: 112,
      oppg: 104,
      fgPct: 48,
      threePtPct: 38,
      wins: 15,
      losses: 5,
    },
    wins: 15,
    losses: 5,
    currentSeasonStats: { ...DEFAULT_CURRENT_SEASON_STATS },
  },
  {
    id: "t_dal",
    name: "Dallas Drillers",
    conference: "USA",
    stats: {
      ...DEFAULT_STATS,
      offense: 4.5,
      defense: 3.8,
      overall: 4.2,
      ppg: 108,
      oppg: 108,
      wins: 12,
      losses: 8,
    },
    wins: 12,
    losses: 8,
    currentSeasonStats: { ...DEFAULT_CURRENT_SEASON_STATS },
  },
  {
    id: "t_laa",
    name: "Los Angeles Aura",
    conference: "USA",
    stats: {
      ...DEFAULT_STATS,
      offense: 4.2,
      defense: 4.6,
      overall: 4.4,
      ppg: 102,
      oppg: 98,
      fgPct: 46,
      threePtPct: 34,
      wins: 14,
      losses: 6,
    },
    wins: 14,
    losses: 6,
    currentSeasonStats: { ...DEFAULT_CURRENT_SEASON_STATS },
  },
  {
    id: "t_mia",
    name: "Miami Makos",
    conference: "USA",
    stats: {
      ...DEFAULT_STATS,
      offense: 3.9,
      defense: 3.5,
      overall: 3.7,
      ppg: 101,
      oppg: 109,
      wins: 8,
      losses: 12,
    },
    wins: 8,
    losses: 12,
    currentSeasonStats: { ...DEFAULT_CURRENT_SEASON_STATS },
  },
  {
    id: "t_tok",
    name: "Tokyo Dragonflies",
    conference: "World",
    stats: {
      ...DEFAULT_STATS,
      offense: 4.1,
      defense: 4.4,
      overall: 4.3,
      ppg: 104,
      oppg: 101,
      wins: 13,
      losses: 7,
    },
    wins: 13,
    losses: 7,
    currentSeasonStats: { ...DEFAULT_CURRENT_SEASON_STATS },
  },
  {
    id: "t_par",
    name: "Paris Bastille",
    conference: "World",
    stats: {
      ...DEFAULT_STATS,
      offense: 4.6,
      defense: 4.0,
      overall: 4.3,
      ppg: 110,
      oppg: 105,
      wins: 11,
      losses: 9,
    },
    wins: 11,
    losses: 9,
    currentSeasonStats: { ...DEFAULT_CURRENT_SEASON_STATS },
  },
  {
    id: "t_bel",
    name: "Belgrade Griffins",
    conference: "World",
    stats: {
      ...DEFAULT_STATS,
      offense: 3.8,
      defense: 4.8,
      overall: 4.3,
      ppg: 98,
      oppg: 95,
      wins: 12,
      losses: 8,
    },
    wins: 12,
    losses: 8,
    currentSeasonStats: { ...DEFAULT_CURRENT_SEASON_STATS },
  },
  {
    id: "t_ist",
    name: "Istanbul Bears",
    conference: "World",
    stats: {
      ...DEFAULT_STATS,
      offense: 3.5,
      defense: 3.8,
      overall: 3.6,
      ppg: 99,
      oppg: 106,
      wins: 7,
      losses: 13,
    },
    wins: 7,
    losses: 13,
    currentSeasonStats: { ...DEFAULT_CURRENT_SEASON_STATS },
  },
];

// For backward compatibility while migrating
export const TEAMS = INITIAL_TEAMS;

export const INITIAL_WEIGHTS = {
  starRatings: 40,
  seasonAverages: 40,
  record: 20,
  homeCourt: 4, // up to 4 power score points
};

export const INITIAL_USER_BALANCE = 5000; // $Dimes

export const generateMatchups = (teams, weights) => {
  const matchups = [];
  const pairs = [
    [teams[0], teams[1]],
    [teams[2], teams[3]],
    [teams[4], teams[5]],
    [teams[6], teams[7]],
  ];

  pairs.forEach((pair, index) => {
    const homeTeam = pair[0];
    const awayTeam = pair[1];
    const odds = calculateMarketOdds(homeTeam, awayTeam, weights);
    const startTime = new Date();
    startTime.setHours(startTime.getHours() + index * 2 + 1);
    startTime.setMinutes(0);

    matchups.push({
      id: `m_${index}`,
      homeTeam,
      awayTeam,
      startTime: startTime.toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      }),
      ...odds,
    });
  });

  return matchups;
};
