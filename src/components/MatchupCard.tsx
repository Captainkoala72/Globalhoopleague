import React, { useState } from "react";
import { useBetting } from "../context/BettingContext";
import { ChevronDown, ChevronUp } from "lucide-react";
import { TeamLogo } from "./TeamLogo";
import { getCombinedStats } from "../utils/oddsEngine";

export function MatchupCard({ matchup }: { matchup: any }) {
  const { addToBetSlip, betSlip, placedBets } = useBetting();
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

  // Time Locks & "Live" UI
  const isLive = new Date() >= new Date(matchup.startTime);
  
  const formatStartTime = (isoString: string) => {
    try {
      const d = new Date(isoString);
      if (isNaN(d.getTime())) return isoString;
      const monthDay = new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric' }).format(d);
      const timeFmt = new Intl.DateTimeFormat('en-US', { hour: 'numeric', minute: '2-digit', hour12: true }).format(d);
      return `${monthDay} • ${timeFmt}`;
    } catch (e) {
      return isoString;
    }
  };

  const formattedStartTime = formatStartTime(matchup.startTime);
  
  // One Bet Per Market
  const hasPlacedBet = placedBets.some((bet: any) => bet.matchupId === matchup.id);

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
    <div className="glass-card p-4 sm:p-5 flex flex-col gap-4 mb-4 relative overflow-hidden bg-gradient-to-b from-white/5 to-transparent border border-white/10 rounded-2xl">
      {/* Header Info */}
      <div className="flex justify-between items-center text-[10px] font-bold text-white/40 uppercase tracking-widest border-b border-white/5 pb-3">
        <span>Week {matchup.week || "?"}</span>
        <span>
          {isLive ? (
            <span className="text-red-500 font-bold flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse"></span>
              Live • {formattedStartTime.split(' • ')[1] || formattedStartTime}
            </span>
          ) : (
            formattedStartTime
          )}
        </span>
      </div>

      <div className="flex flex-col gap-6 relative mt-1">
        {/* Teams Layout: Split Columns */}
        <div className="flex justify-between items-start">
          {/* Away Team Column */}
          <div className="flex flex-col items-center gap-2 flex-1 relative">
            <div className="relative">
               <TeamLogo teamName={matchup.awayTeam.name} className="w-16 h-16 sm:w-20 sm:h-20 drop-shadow-xl" />
            </div>
            <span className="text-sm sm:text-lg font-black uppercase italic text-center leading-tight text-white mt-1">
              {matchup.awayTeam.name}
            </span>
            <span className="text-[10px] sm:text-xs font-bold text-white/40 uppercase tracking-widest">
              {getCombinedStats(matchup.awayTeam).wins || 0}-{getCombinedStats(matchup.awayTeam).losses || 0}
            </span>
          </div>

          <div className="flex flex-col items-center justify-center px-1 sm:px-4 self-stretch pt-6">
            <span className="text-white/20 font-black italic text-lg sm:text-2xl uppercase">@</span>
          </div>

          {/* Home Team Column */}
          <div className="flex flex-col items-center gap-2 flex-1 relative">
            <div className="relative">
               <TeamLogo teamName={matchup.homeTeam.name} className="w-16 h-16 sm:w-20 sm:h-20 drop-shadow-xl" />
            </div>
            <span className="text-sm sm:text-lg font-black uppercase italic text-center leading-tight text-white mt-1">
              {matchup.homeTeam.name}
            </span>
            <span className="text-[10px] sm:text-xs font-bold text-white/40 uppercase tracking-widest">
              {getCombinedStats(matchup.homeTeam).wins || 0}-{getCombinedStats(matchup.homeTeam).losses || 0}
            </span>
          </div>
        </div>

        {/* Probability Visualizer Bar */}
        <div className="flex flex-col gap-1 w-full z-10 px-0 sm:px-8 mt-2">
          <div className="flex justify-between text-[10px] font-bold uppercase tracking-widest text-[#c1ff00]">
            <span>{awayProbPct}% Win</span>
            <span>{homeProbPct}% Win</span>
          </div>
          <div className="h-1.5 w-full bg-white/5 rounded-full flex overflow-hidden">
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

        {/* Vertical Betting Grid */}
        {!isLive && !hasPlacedBet && (
          <div className="flex flex-col gap-2 mt-2 px-0 sm:px-4">
            {/* Spread Row */}
            <div className="flex justify-between items-center gap-2 bg-black/40 rounded-xl p-2 sm:p-3 border border-white/5">
              <div className="flex-1 flex justify-start">
                 <OddsButton
                   selection={matchup.spreadAway}
                   selected={isSelected(matchup.spreadAway.id)}
                   onClick={() => handleOddsClick(matchup.spreadAway)}
                   className="w-full"
                 />
              </div>
              <div className="flex flex-col items-center justify-center shrink-0 w-16 sm:w-24">
                 <span className="text-[9px] sm:text-[10px] font-bold uppercase tracking-widest text-white/30 hidden sm:block">Spread</span>
                 <span className="text-[9px] font-bold uppercase tracking-widest text-white/30 sm:hidden">SPR</span>
              </div>
              <div className="flex-1 flex justify-end">
                 <OddsButton
                   selection={matchup.spreadHome}
                   selected={isSelected(matchup.spreadHome.id)}
                   onClick={() => handleOddsClick(matchup.spreadHome)}
                   className="w-full"
                 />
              </div>
            </div>

            {/* Moneyline Row */}
            <div className="flex justify-between items-center gap-2 bg-black/40 rounded-xl p-2 sm:p-3 border border-white/5">
              <div className="flex-1 flex justify-start">
                 <OddsButton
                   selection={matchup.moneylineAway}
                   selected={isSelected(matchup.moneylineAway.id)}
                   onClick={() => handleOddsClick(matchup.moneylineAway)}
                   className="w-full"
                 />
              </div>
              <div className="flex flex-col items-center justify-center shrink-0 w-16 sm:w-24">
                 <span className="text-[9px] sm:text-[10px] font-bold uppercase tracking-widest text-white/30 hidden sm:block">Moneyline</span>
                 <span className="text-[9px] font-bold uppercase tracking-widest text-white/30 sm:hidden">ML</span>
              </div>
              <div className="flex-1 flex justify-end">
                 <OddsButton
                   selection={matchup.moneylineHome}
                   selected={isSelected(matchup.moneylineHome.id)}
                   onClick={() => handleOddsClick(matchup.moneylineHome)}
                   className="w-full"
                 />
              </div>
            </div>
          </div>
        )}

        {/* Status Banner */}
        {(isLive || hasPlacedBet) && (
          <div className="w-full mt-2 px-0 sm:px-4">
            {isLive ? (
              <div className="flex items-center gap-2 py-3 sm:py-4 border border-red-500/20 bg-red-500/10 rounded-xl w-full justify-center text-red-500 font-bold uppercase text-xs sm:text-sm tracking-widest">
                <span className="w-2.5 h-2.5 rounded-full bg-red-500 animate-pulse shadow-[0_0_8px_rgba(239,68,68,0.8)]"></span>
                Match Is Live
              </div>
            ) : (
              <div className="flex items-center gap-2 py-3 sm:py-4 border border-[#c1ff00]/20 bg-[#c1ff00]/10 rounded-xl w-full justify-center text-[#c1ff00] font-bold uppercase text-xs sm:text-sm tracking-widest">
                <span>✓</span> Bet Placed on Matchup
              </div>
            )}
          </div>
        )}
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
              const combinedAway = getCombinedStats(matchup.awayTeam);
              const combinedHome = getCombinedStats(matchup.homeTeam);
              const awayVal = combinedAway[stat.key];
              const homeVal = combinedHome[stat.key];
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
                    <span className={`font-bold ${awayWins ? 'text-white' : ''}`}>{Number.isInteger(awayVal) ? awayVal : Number(awayVal).toFixed(1)}</span>
                    <span className="uppercase tracking-wider text-white/40">{stat.label}</span>
                    <span className={`font-bold ${homeWins ? 'text-white' : ''}`}>{Number.isInteger(homeVal) ? homeVal : Number(homeVal).toFixed(1)}</span>
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

function OddsButton({ selection, selected, onClick, className = "" }: any) {
  return (
    <button
      onClick={onClick}
      className={`btn-odds px-2 py-2 sm:py-3 rounded max-w-[140px] text-center group flex flex-col items-center justify-center ${selected ? "active" : ""} ${className}`}
    >
      <div
        className={`text-[10px] sm:text-xs font-bold uppercase ${selected ? "text-black" : "text-white/60"}`}
      >
        {selection.type === "spread" ? selection.label : "Moneyline"}
      </div>
      <div
        className={`font-mono font-bold text-sm sm:text-base ${selected ? "text-black" : "text-[#c1ff00]"}`}
      >
        {(selection.americanOdds > 0 ? "+" : "") + selection.americanOdds}
      </div>
    </button>
  );
}
