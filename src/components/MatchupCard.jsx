import React from "react";
import { useBetting } from "../context/BettingContext";

export function MatchupCard({ matchup }) {
  const { addToBetSlip, betSlip } = useBetting();

  const isSelected = (oddsId) => {
    return betSlip.some((item) => item.selection.id === oddsId);
  };

  const handleOddsClick = (selection) => {
    addToBetSlip(matchup, selection);
  };
  const awayColor =
    matchup.awayTeam.conference === "USA" ? "bg-blue-600" : "bg-purple-700";
  const homeColor =
    matchup.homeTeam.conference === "USA" ? "bg-red-600" : "bg-gray-600";

  const awayProbPct = (matchup.awayWinProb * 100).toFixed(1);
  const homeProbPct = (matchup.homeWinProb * 100).toFixed(1);

  return (
    <div className="glass-card p-4 sm:p-5 flex flex-col gap-5 mb-4">
      <div className="flex justify-between items-center text-[10px] font-bold text-white/30 uppercase tracking-widest">
        <span>{matchup.awayTeam.conference} Conference</span>
        <span className="text-[#c1ff00]">Live • {matchup.startTime}</span>
      </div>

      <div className="flex flex-col gap-6">
        {/* Away Team Row */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-0">
          <div className="flex items-center gap-3">
            <div
              className={`w-8 h-8 rounded ${awayColor} flex items-center justify-center font-bold text-white shrink-0`}
            >
              {matchup.awayTeam.name.substring(0, 2).toUpperCase()}
            </div>
            <span className="text-base sm:text-lg font-bold uppercase italic text-white truncate max-w-[150px] sm:max-w-[200px]">
              {matchup.awayTeam.name}
            </span>
          </div>
          <div className="flex gap-2 self-start sm:self-auto">
            <OddsButton
              selection={matchup.spreadAway}
              selected={isSelected(matchup.spreadAway.id)}
              onClick={() => handleOddsClick(matchup.spreadAway)}
            />

            <OddsButton
              selection={matchup.moneylineAway}
              selected={isSelected(matchup.moneylineAway.id)}
              onClick={() => handleOddsClick(matchup.moneylineAway)}
            />
          </div>
        </div>

        {/* Probability Visualizer Bar */}
        <div className="flex flex-col gap-1 w-full mt-[-10px] mb-[-10px] z-10 px-0 sm:px-11">
          <div className="flex justify-between text-[10px] font-bold uppercase tracking-widest text-[#c1ff00]">
            <span>{awayProbPct}% Win Prob</span>
            <span>{homeProbPct}% Win Prob</span>
          </div>
          <div className="h-1.5 w-full bg-white/10 rounded-full flex overflow-hidden">
            <div
              className={`${awayColor}`}
              style={{ width: `${matchup.awayWinProb * 100}%` }}
            ></div>
            <div
              className={`${homeColor}`}
              style={{ width: `${matchup.homeWinProb * 100}%` }}
            ></div>
          </div>
        </div>

        {/* Home Team Row */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-0">
          <div className="flex items-center gap-3">
            <div
              className={`w-8 h-8 rounded ${homeColor} flex items-center justify-center font-bold text-white shrink-0`}
            >
              {matchup.homeTeam.name.substring(0, 2).toUpperCase()}
            </div>
            <span className="text-base sm:text-lg font-bold uppercase italic text-white truncate max-w-[150px] sm:max-w-[200px]">
              {matchup.homeTeam.name}
            </span>
          </div>
          <div className="flex gap-2 self-start sm:self-auto">
            <OddsButton
              selection={matchup.spreadHome}
              selected={isSelected(matchup.spreadHome.id)}
              onClick={() => handleOddsClick(matchup.spreadHome)}
            />

            <OddsButton
              selection={matchup.moneylineHome}
              selected={isSelected(matchup.moneylineHome.id)}
              onClick={() => handleOddsClick(matchup.moneylineHome)}
            />
          </div>
        </div>
      </div>
    </div>
  );
}

function OddsButton({ selection, selected, onClick }) {
  return (
    <button
      onClick={onClick}
      className={`btn-odds px-2 sm:px-4 py-2 sm:py-3 rounded w-20 sm:w-24 text-center group flex flex-col items-center justify-center ${selected ? "active" : ""}`}
    >
      <div
        className={`text-[9px] sm:text-[10px] font-bold uppercase ${selected ? "text-black" : "text-white/40"}`}
      >
        {selection.type === "spread" ? "Spread" : "Money"}
      </div>
      <div
        className={`font-mono font-bold text-xs sm:text-sm ${selected ? "text-black" : "text-white"}`}
      >
        {selection.type === "spread"
          ? selection.label
          : (selection.americanOdds > 0 ? "+" : "") + selection.americanOdds}
      </div>
    </button>
  );
}
