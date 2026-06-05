import React, { useState } from "react";
import { useBetting } from "../context/BettingContext";
import { ChevronDown, ChevronUp } from "lucide-react";

export function MatchupCard({ matchup }: { matchup: any }) {
  const { addToBetSlip, betSlip } = useBetting();
  const [showAdvancedStats, setShowAdvancedStats] = useState(false);

  const isSelected = (oddsId: string) => {
    return betSlip.some((item: any) => item.selection.id === oddsId);
  };

  const handleOddsClick = (selection: any) => {
    addToBetSlip(matchup, selection);
  };
  const awayColor =
    matchup.awayTeam.conference === "USA" ? "bg-blue-600" : "bg-purple-700";
  const homeColor =
    matchup.homeTeam.conference === "USA" ? "bg-red-600" : "bg-gray-600";
  
  const awayColorCSS =
    matchup.awayTeam.conference === "USA" ? "#2563eb" : "#7e22ce";
  const homeColorCSS =
    matchup.homeTeam.conference === "USA" ? "#dc2626" : "#4b5563";

  const awayProbPct = (matchup.awayWinProb * 100).toFixed(1);
  const homeProbPct = (matchup.homeWinProb * 100).toFixed(1);

  // Stats to compare
  const compareStats = [
    { key: "offense", label: "Offensive Rtg", higherIsBetter: true },
    { key: "defense", label: "Defensive Rtg", higherIsBetter: true }, // Actually, defense higher may be better rating? Assuming rating.
    { key: "overall", label: "Overall Rtg", higherIsBetter: true },
    { key: "ppg", label: "Points/Game", higherIsBetter: true },
    { key: "oppg", label: "Opp Pts/Game", higherIsBetter: false },
    { key: "fgPct", label: "Field Goal %", higherIsBetter: true },
    { key: "threePtPct", label: "3-Point %", higherIsBetter: true },
    { key: "topg", label: "Turnovers/G", higherIsBetter: false },
  ];

  return (
    <div className="glass-card p-4 sm:p-5 flex flex-col gap-4 mb-4">
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

      <div className="pt-2 border-t border-white/5 mt-2">
        <button
          onClick={() => setShowAdvancedStats(!showAdvancedStats)}
          className="w-full flex items-center justify-center gap-2 text-xs font-bold text-white/50 hover:text-white transition-colors py-2 uppercase tracking-wide"
        >
          {showAdvancedStats ? "Hide Advanced Stats" : "Advanced Stats"}
          {showAdvancedStats ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
        </button>
        
        {showAdvancedStats && (
          <div className="mt-4 flex flex-col gap-3 animate-in slide-in-from-top-2 fade-in duration-300">
            {compareStats.map((stat) => {
              const awayVal = matchup.awayTeam.stats[stat.key];
              const homeVal = matchup.homeTeam.stats[stat.key];
              const total = awayVal + homeVal || 1;
              const awayPct = (awayVal / total) * 100;
              const homePct = (homeVal / total) * 100;

              let awayWins = false;
              let homeWins = false;

              if (awayVal !== homeVal) {
                if (stat.higherIsBetter) {
                  awayWins = awayVal > homeVal;
                  homeWins = homeVal > awayVal;
                } else {
                  awayWins = awayVal < homeVal;
                  homeWins = homeVal < awayVal;
                }
              }

              return (
                <div key={stat.key} className="flex flex-col gap-1 text-[10px] sm:text-xs">
                  <div className="flex justify-between items-center text-white/70 font-mono">
                    <span className={`font-bold ${awayWins ? 'text-white' : ''}`}>{Number.isInteger(awayVal) ? awayVal : awayVal.toFixed(1)}</span>
                    <span className="uppercase tracking-wider text-white/40">{stat.label}</span>
                    <span className={`font-bold ${homeWins ? 'text-white' : ''}`}>{Number.isInteger(homeVal) ? homeVal : homeVal.toFixed(1)}</span>
                  </div>
                  <div className="h-1 w-full bg-white/5 rounded-full flex overflow-hidden">
                    <div
                      style={{ width: `${awayPct}%`, backgroundColor: awayWins ? awayColorCSS : 'transparent' }}
                      className={`h-full opacity-80 ${!awayWins && !homeWins ? 'bg-white/30' : ''} ${!awayWins && homeWins ? 'bg-white/10' : ''}`}
                    ></div>
                    <div
                      style={{ width: `${homePct}%`, backgroundColor: homeWins ? homeColorCSS : 'transparent' }}
                      className={`h-full opacity-80 ${!awayWins && !homeWins ? 'bg-white/30' : ''} ${!homeWins && awayWins ? 'bg-white/10' : ''}`}
                    ></div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

function OddsButton({ selection, selected, onClick }: any) {
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
