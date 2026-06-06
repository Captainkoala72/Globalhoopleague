export const getCombinedStats = (team) => {
  const s = { ...team.stats };
  const p = team.playoffStats;

  const hasAllPlayoffStats = p && 
    p.ppg !== "" && p.ppg != null &&
    p.oppg !== "" && p.oppg != null &&
    p.fgPct !== "" && p.fgPct != null &&
    p.threePtPct !== "" && p.threePtPct != null &&
    p.wins !== "" && p.wins != null &&
    p.losses !== "" && p.losses != null;

  if (hasAllPlayoffStats) {
    s.ppg = Number(((Number(s.ppg) + Number(p.ppg)) / 2).toFixed(1));
    s.oppg = Number(((Number(s.oppg) + Number(p.oppg)) / 2).toFixed(1));
    s.fgPct = Number(((Number(s.fgPct) + Number(p.fgPct)) / 2).toFixed(1));
    s.threePtPct = Number(((Number(s.threePtPct) + Number(p.threePtPct)) / 2).toFixed(1));
    s.wins = Number(s.wins) + Number(p.wins);
    s.losses = Number(s.losses) + Number(p.losses);
  }
  
  return s;
};

export function calculateMarketOdds(homeTeam, awayTeam, weights) {
  const calcPower = (t) => {
    const combined = getCombinedStats(t);
    
    // Star Rating Score: Math around 0-100 logic. 5.0 avg -> 100
    const starScore =
      ((combined.offense + combined.defense + combined.overall) / 3) * 20;
    // Averages score: normalized loosely around ~50 for typical teams
    let avgScore = 50 + (combined.ppg - combined.oppg) * 2.5;
    avgScore += (combined.fgPct - 45) * 1.5;
    avgScore += (combined.threePtPct - 35) * 1.5;
    avgScore -= ((combined.topg || 12) - 12) * 2;
    avgScore = Math.max(0, Math.min(100, avgScore));

    // Record score: 0-100 based on win pct
    const winTotal = combined.wins + combined.losses;
    const winPct = winTotal > 0 ? combined.wins / winTotal : 0.5;
    const recScore = winPct * 100;

    // Apply normalized weights
    const sumW = weights.starRatings + weights.seasonAverages + weights.record;
    const effWStar = sumW > 0 ? weights.starRatings / sumW : 0.33;
    const effWAvg = sumW > 0 ? weights.seasonAverages / sumW : 0.33;
    const effWRec = sumW > 0 ? weights.record / sumW : 0.33;
    return starScore * effWStar + avgScore * effWAvg + recScore * effWRec;
  };

  // Add home court flat bump (treating the 0-100 slider as up to +15 max flat power score advantage)
  const homeCourtBoost = (weights.homeCourt / 100) * 15;
  const homePower = calcPower(homeTeam) + homeCourtBoost;
  const awayPower = calcPower(awayTeam);
  const diff = homePower - awayPower;

  // Spread = - (Diff / roughly 2.5)
  // This maps a reasonable power diff to typical point spreads in basketball
  let rawSpread = -(diff / 2.5);
  // Round to nearest 0.5 point so we get .5 hooks
  rawSpread = Math.round(rawSpread * 2) / 2;
  // Default to -1.0 if perfectly matched to prevent total push setups in basic mode
  if (rawSpread === 0) rawSpread = -1;
  else if (Number.isInteger(rawSpread)) {
    // If it's a whole number, nudge it to a .5 hook to avoid pushes (e.g. -4 => -4.5)
    rawSpread += rawSpread < 0 ? -0.5 : 0.5;
  }

  const homeSpreadNum = rawSpread;
  const awaySpreadNum = -rawSpread;

  const homeSpdLabel = `${homeSpreadNum > 0 ? "+" : ""}${homeSpreadNum}`;
  const awaySpdLabel = `${awaySpreadNum > 0 ? "+" : ""}${awaySpreadNum}`;

  // Win probability mapping: let's roughly say 1 pt of spread = ~3.2% probability away from 50%
  let homeWinProb = 0.5 + -homeSpreadNum * 0.032;
  homeWinProb = Math.max(0.01, Math.min(0.99, homeWinProb)); // Clamp between 0.01 and 0.99
  const awayWinProb = 1 - homeWinProb;

  const toAmerican = (prob) => {
    // Adding vigorous juice of about +2.5% per side
    const implied = Math.min(0.99, prob + 0.025);
    if (implied > 0.5) {
      return Math.round(-(implied / (1 - implied)) * 100);
    } else {
      return Math.round(((1 - implied) / implied) * 100);
    }
  };

  const homeMlNum = toAmerican(homeWinProb);
  const awayMlNum = toAmerican(awayWinProb);
  const homeMlLabel = `${homeMlNum > 0 ? "+" : ""}${homeMlNum}`;
  const awayMlLabel = `${awayMlNum > 0 ? "+" : ""}${awayMlNum}`;

  const getOddsId = (team, type) =>
    `${homeTeam.id}-${awayTeam.id}-${team.id}-${type}`;

  const moneylineHome = {
    id: getOddsId(homeTeam, "ml"),
    type: "moneyline",
    teamId: homeTeam.id,
    label: homeMlLabel,
    americanOdds: homeMlNum,
  };

  const moneylineAway = {
    id: getOddsId(awayTeam, "ml"),
    type: "moneyline",
    teamId: awayTeam.id,
    label: awayMlLabel,
    americanOdds: awayMlNum,
  };

  const spreadHome = {
    id: getOddsId(homeTeam, "spread"),
    type: "spread",
    teamId: homeTeam.id,
    label: homeSpdLabel,
    americanOdds: -110, // standard juice
  };

  const spreadAway = {
    id: getOddsId(awayTeam, "spread"),
    type: "spread",
    teamId: awayTeam.id,
    label: awaySpdLabel,
    americanOdds: -110, // standard juice
  };

  return {
    moneylineHome,
    moneylineAway,
    spreadHome,
    spreadAway,
    homeWinProb,
    awayWinProb,
  };
}
