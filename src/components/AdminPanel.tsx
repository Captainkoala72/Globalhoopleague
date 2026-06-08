import React, { useState, useEffect, useRef } from "react";
import { ChevronDown, ChevronUp, Upload } from "lucide-react";
import { useBetting } from "../context/BettingContext";
import {
  collection,
  doc,
  addDoc,
  updateDoc,
  getDocs,
  getDoc,
  writeBatch
} from "firebase/firestore";
import { db } from "../firebase";

import { settleMatch } from "../utils/settlementEngine";
import { analyzeMatchScreenshot } from "../utils/analyzeMatchScreenshot";

import { LeagueManagement } from "./LeagueManagement";

export function AdminPanel() {
  const [activeView, setActiveView] = useState("schedule");

  return (
    <div className="flex flex-col md:flex-row gap-8">
      <div className="w-full md:w-64 flex shrink-0 flex-col gap-2">
        <button
          onClick={() => setActiveView("schedule")}
          className={`px-4 py-3 text-left font-bold uppercase text-sm border-l-2 transition-all ${
            activeView === "schedule"
              ? "border-[#c1ff00] text-white bg-white/5"
              : "border-transparent text-white/40 hover:text-white hover:bg-white/5"
          }`}
        >
          Schedule Matches
        </button>
        <button
          onClick={() => setActiveView("calculator")}
          className={`px-4 py-3 text-left font-bold uppercase text-sm border-l-2 transition-all ${
            activeView === "calculator"
              ? "border-[#c1ff00] text-white bg-white/5"
              : "border-transparent text-white/40 hover:text-white hover:bg-white/5"
          }`}
        >
          Odds Calculator
        </button>
        <button
          onClick={() => setActiveView("settle")}
          className={`px-4 py-3 text-left font-bold uppercase text-sm border-l-2 transition-all ${
            activeView === "settle"
              ? "border-[#c1ff00] text-white bg-white/5"
              : "border-transparent text-white/40 hover:text-white hover:bg-white/5"
          }`}
        >
          Settle Matches
        </button>
        <button
          onClick={() => setActiveView("users")}
          className={`px-4 py-3 text-left font-bold uppercase text-sm border-l-2 transition-all ${
            activeView === "users"
              ? "border-[#c1ff00] text-white bg-white/5"
              : "border-transparent text-white/40 hover:text-white hover:bg-white/5"
          }`}
        >
          User Currency
        </button>
        <button
          onClick={() => setActiveView("league")}
          className={`px-4 py-3 text-left font-bold uppercase text-sm border-l-2 transition-all ${
            activeView === "league"
              ? "border-[#c1ff00] text-white bg-white/5"
              : "border-transparent text-white/40 hover:text-white hover:bg-white/5"
          }`}
        >
          League Management
        </button>
      </div>

      <div className="flex-1">
        {activeView === "schedule" && <ScheduleMatchesView />}
        {activeView === "calculator" && <OddsCalculatorView />}
        {activeView === "settle" && <SettleMatchesView />}
        {activeView === "users" && <UserCurrencyView />}
        {activeView === "league" && <LeagueManagement />}
      </div>
    </div>
  );
}

function ScheduleMatchesView() {
  const { teams } = useBetting();
  const [date, setDate] = useState("");
  const [week, setWeek] = useState<number | "">("");
  const [homeTeamId, setHomeTeamId] = useState("");
  const [awayTeamId, setAwayTeamId] = useState("");

  const handleCreate = async () => {
    if (!date || !homeTeamId || !awayTeamId || week === "") return alert("Fill all required fields");
    if (homeTeamId === awayTeamId)
      return alert("Home and away teams must be different");

    try {
      await addDoc(collection(db, "matches"), {
        awayTeamId,
        homeTeamId,
        status: "scheduled",
        date,
        week: Number(week),
      });
      alert("Match scheduled successfully!");
      setDate("");
      setWeek("");
      setHomeTeamId("");
      setAwayTeamId("");
    } catch (e) {
      console.error(e);
      alert("Failed to schedule match");
    }
  };

  return (
    <div className="glass-card p-6 md:p-8 space-y-8">
      <div>
        <h2 className="text-2xl font-black italic uppercase text-white mb-1">
          Schedule Match
        </h2>
        <p className="text-white/40 font-medium text-sm">
          Create an upcoming match to add to the simulation queue.
        </p>
      </div>

      <div className="space-y-6">
        <div className="space-y-4">
          <h3 className="text-sm font-bold uppercase tracking-widest text-[#c1ff00] border-b border-white/10 pb-2">
            General Information
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="flex flex-col gap-2">
              <label className="text-xs text-white/40 font-bold uppercase tracking-widest">
                Match Date / Time *
              </label>
              <input
                type="datetime-local"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full bg-black/40 border border-white/10 rounded-lg py-3 px-4 text-sm text-white focus:outline-none focus:border-[#c1ff00] transition-colors"
                required
              />
            </div>
            <div className="flex flex-col gap-2">
              <label className="text-xs text-white/40 font-bold uppercase tracking-widest">
                Week *
              </label>
              <input
                type="number"
                placeholder="e.g. 3"
                value={week}
                onChange={(e) => setWeek(e.target.value === "" ? "" : Number(e.target.value))}
                className="w-full bg-black/40 border border-white/10 rounded-lg py-3 px-4 text-sm text-white focus:outline-none focus:border-[#c1ff00] transition-colors placeholder:text-white/20"
                required
              />
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <h3 className="text-sm font-bold uppercase tracking-widest text-[#c1ff00] border-b border-white/10 pb-2">
            Team Selection
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-4 bg-white/5 rounded-xl border border-white/10">
            <div className="flex flex-col gap-2">
              <label className="text-xs text-white/40 font-bold uppercase tracking-widest flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-[#2563eb]"></span> Away Team *
              </label>
              <select
                value={awayTeamId}
                onChange={(e) => setAwayTeamId(e.target.value)}
                className="w-full bg-black/60 border border-white/10 rounded-lg py-3 px-4 text-sm text-white focus:outline-none focus:border-[#c1ff00] transition-colors appearance-none"
                required
              >
                <option value="">Select Away Team</option>
                {teams.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex flex-col gap-2">
              <label className="text-xs text-white/40 font-bold uppercase tracking-widest flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-[#dc2626]"></span> Home Team *
              </label>
              <select
                value={homeTeamId}
                onChange={(e) => setHomeTeamId(e.target.value)}
                className="w-full bg-black/60 border border-white/10 rounded-lg py-3 px-4 text-sm text-white focus:outline-none focus:border-[#c1ff00] transition-colors appearance-none"
                required
              >
                <option value="">Select Home Team</option>
                {teams.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.name}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>
      </div>

      <button
        onClick={handleCreate}
        className="w-full py-4 bg-[#c1ff00] text-black font-black uppercase italic rounded-xl text-lg hover:scale-[0.98] transition-all shadow-[0_0_15px_rgba(193,255,0,0.2)] mt-8"
      >
        Schedule Match
      </button>
    </div>
  );
}

function OddsCalculatorView() {
  const { teams, weights, updateWeights, scheduledMatchups } = useBetting();
  const [selectedMatchupId, setSelectedMatchupId] = useState("");
  const selectedMatchup = scheduledMatchups.find(
    (m) => m.id === selectedMatchupId,
  );

  const [localWeights, setLocalWeights] = useState(weights);
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [projectedData, setProjectedData] = useState<any>(null);

  const [homeOffense, setHomeOffense] = useState(2.5);
  const [homeDefense, setHomeDefense] = useState(2.5);
  const [awayOffense, setAwayOffense] = useState(2.5);
  const [awayDefense, setAwayDefense] = useState(2.5);

  const homeAverageStar = (homeOffense + homeDefense) / 2;
  const awayAverageStar = (awayOffense + awayDefense) / 2;

  const currentHomeTeam = selectedMatchup
    ? teams.find((t) => t.id === selectedMatchup.homeTeam.id)
    : null;
  const currentAwayTeam = selectedMatchup
    ? teams.find((t) => t.id === selectedMatchup.awayTeam.id)
    : null;

  useEffect(() => {
    setLocalWeights(weights);
  }, [weights]);

  useEffect(() => {
    setProjectedData(null);
  }, [selectedMatchupId]);

  const handleWeightChange = (key: string, value: number) => {
    setLocalWeights((prev: any) => ({ ...prev, [key]: value }));
  };

    const handleGenerateAI = async () => {
    if (!currentHomeTeam || !currentAwayTeam) return;
    setIsAiLoading(true);
    try {
      // Fetch match insights for storylines
      const matchesSnap = await getDocs(collection(db, "matches"));
      const allCompleted = matchesSnap.docs
          .map(doc => doc.data())
          .filter(m => m.status === "completed" && m.matchInsights);
          
      const homeInsights = allCompleted
          .filter((m: any) => m.homeTeamId === currentHomeTeam.id || m.awayTeamId === currentHomeTeam.id)
          .slice(-10) // recency window 5-10 matches
          .map((m: any) => {
            const isHome = m.homeTeamId === currentHomeTeam.id;
            return { narrative: m.matchInsights.gameNarrative, stats: isHome ? m.matchInsights.teamStats?.home : m.matchInsights.teamStats?.away };
          });
          
      const awayInsights = allCompleted
          .filter((m: any) => m.homeTeamId === currentAwayTeam.id || m.awayTeamId === currentAwayTeam.id)
          .slice(-10)
          .map((m: any) => {
            const isHome = m.homeTeamId === currentAwayTeam.id;
            return { narrative: m.matchInsights.gameNarrative, stats: isHome ? m.matchInsights.teamStats?.home : m.matchInsights.teamStats?.away };
          });

      // Head to Head history
      const headToHeadHistory = allCompleted
          .filter((m: any) => (m.homeTeamId === currentHomeTeam.id && m.awayTeamId === currentAwayTeam.id) || (m.homeTeamId === currentAwayTeam.id && m.awayTeamId === currentHomeTeam.id))
          .map((m: any) => ({
             home: m.homeTeamId === currentHomeTeam.id ? m.homeTeamId : m.awayTeamId,
             away: m.awayTeamId === currentAwayTeam.id ? m.awayTeamId : m.homeTeamId,
             homeWin: m.homeWinProb > (1 - m.homeWinProb) // simplification
          }));

      // Fetch coaches
      const coachesSnap = await getDocs(collection(db, "coaches"));
      const allCoaches = coachesSnap.docs.map(doc => doc.data());
      const homeCoach = allCoaches.find(c => c.teamName === currentHomeTeam.name);
      const awayCoach = allCoaches.find(c => c.teamName === currentAwayTeam.name);

      const payload = {
        homeTeamData: {
          name: currentHomeTeam.name,
          wins: currentHomeTeam.wins || 0,
          losses: currentHomeTeam.losses || 0,
          manualStarRatings: {
            offense: homeOffense,
            defense: homeDefense,
            average: homeAverageStar
          },
          rollingStats: currentHomeTeam.currentSeasonStats || {},
          recentNarratives: homeInsights
        },
        awayTeamData: {
          name: currentAwayTeam.name,
          wins: currentAwayTeam.wins || 0,
          losses: currentAwayTeam.losses || 0,
          manualStarRatings: {
            offense: awayOffense,
            defense: awayDefense,
            average: awayAverageStar
          },
          rollingStats: currentAwayTeam.currentSeasonStats || {},
          recentNarratives: awayInsights
        },
        headToHeadHistory,
        coachPlaystyles: {
          homeCoach: homeCoach || null,
          awayCoach: awayCoach || null
        },
        sliderWeights: localWeights
      };

      let data: any;
      const response = await fetch("/api/generate-odds", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      
      const contentType = response.headers.get("content-type");
      if (!response.ok || !contentType || !contentType.includes("application/json")) {
        console.warn("Backend not available, trying client-side fallback...");
        const { askForApiKeyAndGenerate } = await import("../utils/aiClientFallback");
        // In fallback we stringify again
        data = await askForApiKeyAndGenerate(JSON.stringify(payload), "odds");
      } else {
        data = await response.json();
      }

      if (data.homeWinProb !== undefined) {
        setProjectedData({
           ...data,
           homeWinProb: data.homeWinProb > 1 ? data.homeWinProb / 100 : data.homeWinProb,
           homeAmericanOdds: data.homeMoneyline || data.homeAmericanOdds,
           awayAmericanOdds: data.awayMoneyline || data.awayAmericanOdds,
           spreadHome: data.spreadPick ? (data.spreadPick.includes(currentHomeTeam.name.substring(0,3)) ? data.spreadValue : (data.spreadValue.startsWith('-') ? data.spreadValue.replace('-','+') : '-' + data.spreadValue.replace('+',''))) : data.spreadHome,
           spreadAway: data.spreadPick ? (data.spreadPick.includes(currentAwayTeam.name.substring(0,3)) ? data.spreadValue : (data.spreadValue.startsWith('-') ? data.spreadValue.replace('-','+') : '-' + data.spreadValue.replace('+',''))) : data.spreadAway,
        });
      } else if (data.error) {
        alert("Failed to generate: " + data.error);
      }
    } catch (e) {
      console.error(e);
      alert("AI Generation failed.");
    }
    setIsAiLoading(false);
  };

  const handlePublish = async () => {
    if (!selectedMatchup || !projectedData) return;
    try {
      await updateWeights(localWeights);

      const matchRef = doc(db, "matches", selectedMatchup.id);
      await updateDoc(matchRef, {
        status: "active",
        homeWinProb: projectedData.homeWinProb,
        awayWinProb: 1 - projectedData.homeWinProb,
        spreadAway: { label: projectedData.spreadAway, odds: projectedData.awayAmericanOdds },
        spreadHome: { label: projectedData.spreadHome, odds: projectedData.homeAmericanOdds },
        moneylineAway: { label: projectedData.awayAmericanOdds, prob: 1 - projectedData.homeWinProb },
        moneylineHome: { label: projectedData.homeAmericanOdds, prob: projectedData.homeWinProb },
        oddsCalculatorData: {
          manualStars: {
            home: { off: homeOffense, def: homeDefense, avg: homeAverageStar },
            away: { off: awayOffense, def: awayDefense, avg: awayAverageStar }
          },
          weightsUsed: localWeights
        }
      });
      alert("Match published to active markets!");
      setSelectedMatchupId("");
    } catch (err) {
      console.error(err);
      alert("Failed to publish match.");
    }
  };

  const renderSeasonAverages = (team: any) => {
    const stats = team?.currentSeasonStats || {};
    const items = [
      { label: "Record", val: `${team?.wins || 0} - ${team?.losses || 0}` },
      { label: "FG%", val: stats.fgPct?.toFixed(1) || "0.0" },
      { label: "3PT%", val: stats.threePtPct?.toFixed(1) || "0.0" },
      { label: "FT%", val: stats.ftPct?.toFixed(1) || "0.0" },
      { label: "REB", val: stats.rebounds?.toFixed(1) || "0.0" },
      { label: "AST", val: stats.assists?.toFixed(1) || "0.0" },
      { label: "PF", val: stats.fouls?.toFixed(1) || "0.0" },
      { label: "STL", val: stats.steals?.toFixed(1) || "0.0" },
      { label: "TOV", val: stats.turnovers?.toFixed(1) || "0.0" },
      { label: "BLK", val: stats.blocks?.toFixed(1) || "0.0" },
    ];
    return (
      <div className="grid grid-cols-2 sm:grid-cols-5 md:grid-cols-5 gap-3 text-sm">
        {items.map((it, idx) => (
          <div key={idx} className="bg-black/40 p-2 rounded-lg text-center border border-white/5">
            <span className="text-white/40 block text-[10px] sm:text-xs font-bold tracking-wider uppercase mb-1">{it.label}</span>
            <span className="text-white font-mono font-medium">{it.val}</span>
          </div>
        ))}
      </div>
    );
  };

  return (
    <div className="space-y-8">
      <div className="glass-card p-6 md:p-8 space-y-6 border-l-4 border-l-[#c1ff00]">
        <div>
          <h2 className="text-2xl font-black italic uppercase text-white mb-1">
            Odds Calculator & Publishing
          </h2>
          <p className="text-white/40 font-medium text-sm">
            Select a scheduled match, fine-tune the variables, preview odds, and
            publish to the sportsbook.
          </p>
        </div>

        <div className="flex flex-col gap-2">
          <label className="text-xs text-white/40 font-bold uppercase tracking-widest">
            Select Scheduled Match
          </label>
          <select
            value={selectedMatchupId}
            onChange={(e) => setSelectedMatchupId(e.target.value)}
            className="w-full bg-black/40 border border-white/10 rounded-lg py-3 px-4 text-sm font-bold text-white focus:outline-none focus:border-[#c1ff00] transition-colors appearance-none cursor-pointer"
          >
            <option value="">-- Choose a scheduled match --</option>
            {scheduledMatchups.map((m: any) => (
              <option key={m.id} value={m.id}>
                {m.awayTeam.name} @ {m.homeTeam.name} - {m.startTime}
              </option>
            ))}
          </select>
        </div>
      </div>

      {selectedMatchupId &&
        currentHomeTeam &&
        currentAwayTeam && (
          <>
            <div className="grid grid-cols-1 lg:grid-cols-[1fr_300px] gap-8">
              <div className="space-y-6">
                <h3 className="text-xl font-black italic uppercase text-white">
                  Matchup Teams Stats
                </h3>
                <div className="space-y-4">
                  {[
                    { team: currentAwayTeam, type: 'Away', off: awayOffense, def: awayDefense, setOff: setAwayOffense, setDef: setAwayDefense, avg: awayAverageStar },
                    { team: currentHomeTeam, type: 'Home', off: homeOffense, def: homeDefense, setOff: setHomeOffense, setDef: setHomeDefense, avg: homeAverageStar }
                  ].map(({ team, type, off, def, setOff, setDef, avg }) => (
                    <div
                      key={team.id}
                      className="glass-card p-4 sm:p-5 flex flex-col gap-4"
                    >
                      <div className="flex justify-between items-center border-b border-white/10 pb-3">
                        <span className="text-lg font-bold uppercase italic text-white">
                          <span className="text-white/40 mr-2">{type}:</span>
                          {team.name}
                        </span>
                        <div className="bg-black/50 px-3 py-1 rounded-full text-sm font-mono text-[#c1ff00]">
                          Avg Star: {avg.toFixed(2)}
                        </div>
                      </div>
                      
                      <div className="flex flex-col gap-2">
                        <h4 className="text-xs font-bold text-[#c1ff00]/60 tracking-wider uppercase mb-2">Live Season Averages Preview</h4>
                        {renderSeasonAverages(team)}
                      </div>

                      <div className="mt-4 border-t border-white/10 pt-4 flex flex-col gap-2">
                        <h4 className="text-xs font-bold text-white/60 tracking-wider uppercase mb-1">Manual Star Ratings (1-5)</h4>
                        <div className="grid grid-cols-2 gap-4">
                          <StatInput label={`Offensive Rating`} value={off} step={0.1} min={0} max={5} onChange={setOff} />
                          <StatInput label={`Defensive Rating`} value={def} step={0.1} min={0} max={5} onChange={setDef} />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="space-y-6">
                <div className="sticky top-24">
                  <h3 className="text-xl font-black italic uppercase text-white mb-6">
                    Formula Weights
                  </h3>
                  <div className="glass-card p-6 flex flex-col gap-6">
                    <WeightSlider
                      label="Season Averages"
                      value={localWeights.seasonAverages}
                      onChange={(v) => handleWeightChange("seasonAverages", v)}
                    />
                    <WeightSlider
                      label="Star Ratings"
                      value={localWeights.starRatings}
                      onChange={(v) => handleWeightChange("starRatings", v)}
                    />
                    <WeightSlider
                      label="Win/Loss Record"
                      value={localWeights.record}
                      onChange={(v) => handleWeightChange("record", v)}
                    />
                    <div className="h-px bg-white/10 my-2"></div>
                    <WeightSlider
                      label="Home Court Adv."
                      value={localWeights.homeCourt}
                      onChange={(v) => handleWeightChange("homeCourt", v)}
                    />
                  </div>

                  <h3 className="text-xl font-black italic uppercase text-[#c1ff00] mt-8 mb-6 flex items-center gap-2">
                    <span>✨</span> AI Oddsmaker
                  </h3>
                  <div className="glass-card p-6 flex flex-col gap-6 border border-[#c1ff00]/20 bg-[#c1ff00]/5">
                    <button
                      onClick={handleGenerateAI}
                      disabled={isAiLoading}
                      className="w-full py-4 bg-[#c1ff00]/20 border border-[#c1ff00]/50 text-[#c1ff00] font-black uppercase italic rounded-xl text-sm hover:bg-[#c1ff00]/30 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex justify-center items-center gap-2 shadow-[0_0_15px_rgba(193,255,0,0.1)]"
                    >
                      {isAiLoading ? "Processing Matchup..." : "Generate AI Projection"}
                    </button>
                    
                    {projectedData !== null && (
                      <div className="text-center bg-black/40 p-4 rounded-xl space-y-4 border border-[#c1ff00]/20 shadow-[0_0_20px_rgba(193,255,0,0.1)]">
                        {projectedData.thinkingLog && (
                          <div className="text-left bg-black/80 p-4 rounded-lg border border-white/5 text-xs text-white/70 font-mono whitespace-pre-wrap max-h-48 overflow-y-auto mb-4">
                            <span className="text-[#c1ff00] font-bold uppercase tracking-widest mb-2 block">Oddsmaker Logic:</span>
                            {projectedData.thinkingLog}
                          </div>
                        )}
                        <div className="space-y-1">
                          <div className="text-[10px] text-white/50 font-bold uppercase tracking-widest">Home Win Prob</div>
                          <div className="text-3xl text-white font-mono font-black">{(projectedData.homeWinProb * 100).toFixed(1)}%</div>
                        </div>
                        <div className="grid grid-cols-2 gap-4 pt-4 border-t border-white/10">
                          <div>
                            <div className="text-[10px] text-white/40 font-bold uppercase tracking-widest mb-1">Away ML</div>
                            <div className="text-lg text-[#c1ff00] font-mono font-bold">{projectedData.awayAmericanOdds}</div>
                          </div>
                          <div>
                            <div className="text-[10px] text-white/40 font-bold uppercase tracking-widest mb-1">Home ML</div>
                            <div className="text-lg text-[#c1ff00] font-mono font-bold">{projectedData.homeAmericanOdds}</div>
                          </div>
                          <div>
                            <div className="text-[10px] text-white/40 font-bold uppercase tracking-widest mb-1">Away Spread</div>
                            <div className="text-lg text-white font-mono font-bold">{projectedData.spreadAway}</div>
                          </div>
                          <div>
                            <div className="text-[10px] text-white/40 font-bold uppercase tracking-widest mb-1">Home Spread</div>
                            <div className="text-lg text-white font-mono font-bold">{projectedData.spreadHome}</div>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {projectedData && (
              <div className="glass-card p-6 bg-gradient-to-br from-[#c1ff00]/10 to-transparent border border-[#c1ff00]/20 w-full col-span-full">
                <h3 className="text-lg font-black italic uppercase text-[#c1ff00] mb-4 text-center">
                  Review & Publish
                </h3>
                <p className="text-center text-sm text-white/70 mb-6">
                  Verify the AI generated odds before committing to active markets.
                </p>
                <button
                  onClick={handlePublish}
                  className="w-full md:w-auto md:px-12 mx-auto block py-4 bg-[#c1ff00] text-black font-black uppercase italic rounded-xl text-lg hover:scale-[0.98] transition-all shadow-[0_0_15px_rgba(193,255,0,0.2)]"
                >
                  Publish to Active Markets
                </button>
              </div>
            )}
          </>
        )}
    </div>
  );
}

function SettleMatchesView() {
  const { activeMatchups, scheduledMatchups, cancelMatch } = useBetting();
  const [loadingId, setLoadingId] = useState(null);

  const [cancellingId, setCancellingId] = useState(null);

  const confirmCancel = async (matchId) => {
    console.log("User confirmed cancellation for:", matchId);
    setLoadingId(matchId);
    try {
      await cancelMatch(matchId);
      alert("Match cancelled and bets refunded.");
    } catch (e) {
      console.error("Cancellation error:", e);
      alert("Failed to cancel match.");
    } finally {
      setLoadingId(null);
      setCancellingId(null);
    }
  };

  const handleCancelClick = (matchId) => {
    console.log("Cancel clicked for match:", matchId);
    setCancellingId(matchId);
  };

  const fileInputRefs = useRef<{ [key: string]: HTMLInputElement | null }>({});

  const handleFileUpload = async (match: any, event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setLoadingId(match.id);
    try {
      // Read the txt file client-side
      const rawText = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = (e) => resolve(e.target?.result as string);
        reader.onerror = reject;
        reader.readAsText(file);
      });

      // Parse the stats locally
      const { parseBoxScore } = await import("../utils/parseBoxScore");
      const parsedStats = parseBoxScore(rawText);

      // Send to Gemini
      const response = await fetch("/api/analyze-boxscore", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ parsedStats, rawText }),
      });

      if (!response.ok) {
        throw new Error(await response.text());
      }
      
      const geminiData = await response.json();
      console.log("Gemini Data:", geminiData);

      const batch = writeBatch(db);

      const homeFinal = parsedStats.quarterScores.homeFinal;
      const awayFinal = parsedStats.quarterScores.awayFinal;

      // 1. Team stats update
      const updateTeamStats = async (teamId: string, isHome: boolean, teamScore: number, oppScore: number) => {
        const teamRef = doc(db, "teams", teamId);
        const teamDoc = await getDoc(teamRef);
        if (teamDoc.exists()) {
          const tData = teamDoc.data();
          const pGames = (tData.wins || 0) + (tData.losses || 0);
          
          let newWins = tData.wins || 0;
          let newLosses = tData.losses || 0;
          if (teamScore > oppScore) newWins += 1;
          else if (teamScore < oppScore) newLosses += 1;

          const oldStats = tData.currentSeasonStats || {
            fgPct: 0, threePtPct: 0, ftPct: 0, rebounds: 0,
            assists: 0, fouls: 0, steals: 0, turnovers: 0, blocks: 0
          };

          const incomingParsed = isHome ? parsedStats.teamStats.home : parsedStats.teamStats.away;
          
          // helper to parse percentage string like "32/70" -> 0.457
          const pct = (str: string) => {
            if (!str) return 0;
            const parts = str.split(/[\/-]/);
            const m = parseFloat(parts[0]);
            const a = parseFloat(parts[1]);
            return a > 0 ? (m/a)*100 : 0;
          };

          const newFg = pct(incomingParsed?.fg || "0/0");
          const new3p = pct(incomingParsed?.threePt || "0/0");
          const newFt = pct(incomingParsed?.ft || "0/0");

          const moveAvg = (oldV: number, newV: number, count: number) => {
            return ((oldV * count) + newV) / (count + 1);
          };

          const currentSeasonStats = {
            fgPct: moveAvg(oldStats.fgPct, newFg, pGames),
            threePtPct: moveAvg(oldStats.threePtPct, new3p, pGames),
            ftPct: moveAvg(oldStats.ftPct, newFt, pGames),
            rebounds: moveAvg(oldStats.rebounds, incomingParsed?.rebounds || 0, pGames),
            assists: moveAvg(oldStats.assists, incomingParsed?.assists || 0, pGames),
            fouls: moveAvg(oldStats.fouls, incomingParsed?.fouls || 0, pGames),
            steals: moveAvg(oldStats.steals, incomingParsed?.steals || 0, pGames),
            turnovers: moveAvg(oldStats.turnovers, incomingParsed?.turnovers || 0, pGames),
            blocks: moveAvg(oldStats.blocks, incomingParsed?.blocks || 0, pGames),
          };

          batch.update(teamRef, {
            wins: newWins,
            losses: newLosses,
            currentSeasonStats
          });
        }
      };

      await updateTeamStats(match.homeTeamId, true, homeFinal, awayFinal);
      await updateTeamStats(match.awayTeamId, false, awayFinal, homeFinal);

      // Append narrative to subcollection
      const stateObj = await getDoc(doc(db, "leagueState", "current"));
      const seasonYear = stateObj.exists() ? stateObj.data().currentYear : "2026";
      
      const historyRef = doc(collection(db, "matches", match.id, "matchHistory"));
      batch.set(historyRef, {
        season: seasonYear,
        parsedStats,
        geminiData,
        createdAt: new Date().toISOString()
      });

      // Also set matchInsights on the match itself (legacy compatibility)
      const matchRef = doc(db, "matches", match.id);
      batch.update(matchRef, { 
        matchInsights: {
          teamStats: parsedStats.teamStats,
          gameNarrative: geminiData.gameNarrative,
          quarterScores: parsedStats.quarterScores
        }
      });

      await batch.commit();

      // Finally settle the match payouts
      await settleMatch(match.id, homeFinal, awayFinal);

      alert("Box score analyzed, team stats updated, and match settled successfully!");
    } catch (e: any) {
      console.error(e);
      alert("Failed to extract data: " + e.message);
    } finally {
      setLoadingId(null);
      if (fileInputRefs.current[match.id]) {
        fileInputRefs.current[match.id]!.value = "";
      }
    }
  };


  const allManageableMatchups = [...activeMatchups, ...scheduledMatchups];

  if (allManageableMatchups.length === 0) {
    return (
      <div className="glass-card p-6 md:p-8 space-y-6 text-center">
        <h2 className="text-2xl font-black italic uppercase text-white mb-2">
          Manage Matches
        </h2>
        <p className="text-white/40 font-medium">
          No active or scheduled matches right now.
        </p>
      </div>
    );
  }

  return (
    <div className="glass-card p-6 md:p-8 space-y-6">
      <div>
        <h2 className="text-2xl font-black italic uppercase text-white mb-1">
          Manage Matches
        </h2>
        <p className="text-white/40 font-medium text-sm">
          Input final scores to grade wagers, or cancel matches to refund users.
        </p>
      </div>

      <div className="space-y-4">
        {allManageableMatchups.map((m) => (
          <div
            key={m.id}
            className="bg-white/5 border border-white/10 rounded-xl p-4 sm:p-5 flex flex-col md:flex-row gap-6 justify-between items-center"
          >
            <div className="flex-1 space-y-4 w-full">
              <div className="flex items-center justify-between text-white font-bold uppercase text-sm border-b border-white/10 pb-2 mb-2">
                <span className="text-white/40">{m.startTime}</span>
                <span className={m.status === "active" ? "text-[#c1ff00] text-xs font-mono" : "text-blue-400 text-xs font-mono"}>
                  {m.status === "active" ? "ACTIVE MARKET" : "SCHEDULED"}
                </span>
              </div>

              <div className="flex flex-col gap-4 text-center">
                <div className="flex justify-between items-center gap-4">
                  <span className="flex-1 text-right font-black text-xl italic">
                    {m.awayTeam.name}
                  </span>
                  
                  {m.status === "active" ? (
                    <span className="text-white/40 font-black text-xs px-2">@</span>
                  ) : (
                    <span className="text-white/40 font-black text-xs px-2">@</span>
                  )}
                  
                  <span className="flex-1 text-left font-black text-xl italic">
                    {m.homeTeam.name}
                  </span>
                </div>
              </div>
            </div>

            <div className="flex flex-col md:flex-row gap-2 w-full md:w-auto relative z-20 pointer-events-auto items-center">
              {m.status === "active" && (
                <>
                  <div className="relative w-full md:w-auto">
                    <input
                      type="file"
                      accept=".txt"
                      ref={(el) => { fileInputRefs.current[m.id] = el; }}
                      onChange={(e) => handleFileUpload(m, e)}
                      className="hidden"
                      id={`file-upload-${m.id}`}
                      disabled={loadingId === m.id}
                    />
                    <label
                      htmlFor={`file-upload-${m.id}`}
                      className="w-full flex items-center justify-center gap-2 md:w-auto px-6 py-4 bg-[#c1ff00]/20 border border-[#c1ff00]/50 text-[#c1ff00] font-black uppercase italic rounded-xl text-sm hover:bg-[#c1ff00]/30 transition-all cursor-pointer whitespace-nowrap shadow-[0_0_15px_rgba(193,255,0,0.15)]"
                    >
                      <Upload size={18} /> {loadingId === m.id ? "Processing Box Score..." : "Upload & Settle Match (.txt)"}
                    </label>
                  </div>
                </>
              )}
              {cancellingId === m.id ? (
                <div className="flex gap-2 w-full md:w-auto">
                  <button
                    type="button"
                    onClick={() => setCancellingId(null)}
                    disabled={loadingId === m.id}
                    className="flex-1 w-full md:w-auto px-4 py-4 bg-white/10 text-white font-black uppercase italic rounded-xl text-sm hover:scale-[0.98] transition-all disabled:opacity-50"
                  >
                    Back
                  </button>
                  <button
                    type="button"
                    onClick={() => confirmCancel(m.id)}
                    disabled={loadingId === m.id}
                    className="flex-1 relative z-30 w-full md:w-auto px-4 py-4 bg-red-600 text-white font-black uppercase italic rounded-xl text-sm hover:scale-[0.98] transition-all disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer pointer-events-auto"
                  >
                    {loadingId === m.id ? "Processing..." : "Confirm Cancel"}
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => handleCancelClick(m.id)}
                  disabled={loadingId === m.id}
                  className="relative z-30 w-full md:w-auto px-6 py-4 bg-red-600/80 text-white hover:bg-red-600 font-black uppercase italic rounded-xl text-sm hover:scale-[0.98] transition-all disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap cursor-pointer pointer-events-auto"
                >
                  {loadingId === m.id ? "Processing..." : "Cancel Match"}
                </button>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function UserCurrencyView() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const snap = await getDocs(collection(db, "users"));
      const u = [];
      snap.forEach((doc) => {
        u.push({ id: doc.id, ...doc.data() });
      });
      setUsers(u);
    } catch (e) {
      console.error(e);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleUpdateBalance = async (userId, newBalance) => {
    try {
      await updateDoc(doc(db, "users", userId), { balance: newBalance });
      setUsers((prev) =>
        prev.map((u) => (u.id === userId ? { ...u, balance: newBalance } : u)),
      );
    } catch (e) {
      console.error(e);
      alert("Failed to update balance.");
    }
  };

  if (loading) return <div className="text-white/40">Loading users...</div>;

  return (
    <div className="glass-card p-6 md:p-8 space-y-6">
      <div>
        <h2 className="text-2xl font-black italic uppercase text-white mb-1">
          User Currency Management
        </h2>
        <p className="text-white/40 font-medium text-sm">
          Manage simulated bankrolls for registered users.
        </p>
      </div>

      <div className="divide-y divide-white/10">
        {users.map((u) => (
          <UserRow key={u.id} user={u} onUpdate={handleUpdateBalance} />
        ))}
      </div>
    </div>
  );
}

function UserRow({ user, onUpdate }) {
  const [localBal, setLocalBal] = useState(user.balance);

  const handleSave = () => {
    onUpdate(user.id, Number(localBal));
  };

  return (
    <div className="py-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
      <div>
        <div className="text-white font-bold">{user.email || "Anonymous"}</div>
        <div className="text-white/40 text-xs font-mono">
          ID: {user.id} | Role: {user.role}
        </div>
      </div>
      <div className="flex items-center gap-3">
        <div className="relative">
          <input
            type="number"
            value={localBal}
            onChange={(e) => setLocalBal(e.target.value)}
            className="w-40 bg-black/40 border border-white/10 rounded-lg py-2 px-3 pr-16 text-sm font-mono text-white focus:outline-none focus:border-[#c1ff00]"
          />

          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-white/40 font-mono text-xs font-bold">
            $Dimes
          </span>
        </div>
        <button
          onClick={handleSave}
          disabled={Number(localBal) === user.balance}
          className="px-4 py-2 bg-[#c1ff00] text-black font-black uppercase italic rounded-lg text-xs hover:scale-[0.98] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Update
        </button>
      </div>
    </div>
  );
}

function StatInput({ label, value, onChange, step = 1, min, max }: any) {
  return (
    <div className="flex flex-col gap-1">
      <span className="text-[9px] text-white/40 uppercase font-bold tracking-widest">
        {label}
      </span>
      <input
        type="number"
        step={step}
        min={min}
        max={max}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="bg-black/40 border border-white/10 rounded-md py-1.5 px-2 text-sm font-mono text-white focus:outline-none focus:border-[#c1ff00] transition-colors"
      />
    </div>
  );
}

function WeightSlider({ label, value, onChange }: any) {
  return (
    <div className="space-y-2">
      <div className="flex justify-between items-center">
        <label className="text-xs text-white/60 font-bold uppercase tracking-wider">
          {label}
        </label>
        <span className="font-mono text-[#c1ff00]">{value}%</span>
      </div>
      <input
        type="range"
        min="0"
        max="100"
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="w-full accent-[#c1ff00]"
      />
    </div>
  );
}
