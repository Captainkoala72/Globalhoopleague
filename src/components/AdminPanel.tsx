import React, { useState, useEffect } from "react";
import { useBetting } from "../context/BettingContext";
import { calculateMarketOdds } from "../utils/oddsEngine";
import {
  collection,
  doc,
  addDoc,
  updateDoc,
  getDocs,
} from "firebase/firestore";
import { db } from "../firebase";

import { settleMatch } from "../utils/settlementEngine";

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
      </div>

      <div className="flex-1">
        {activeView === "schedule" && <ScheduleMatchesView />}
        {activeView === "calculator" && <OddsCalculatorView />}
        {activeView === "settle" && <SettleMatchesView />}
        {activeView === "users" && <UserCurrencyView />}
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
  const { teams, weights, updateTeams, updateWeights, scheduledMatchups } =
    useBetting();
  const [selectedMatchupId, setSelectedMatchupId] = useState("");
  const selectedMatchup = scheduledMatchups.find(
    (m) => m.id === selectedMatchupId,
  );
  // Local state for live preview
  const [localTeams, setLocalTeams] = useState(teams);
  const [localWeights, setLocalWeights] = useState(weights);

  useEffect(() => {
    setLocalTeams(teams);
  }, [teams]);

  useEffect(() => {
    setLocalWeights(weights);
  }, [weights]);

  const handleWeightChange = (key, value) => {
    setLocalWeights((prev) => ({ ...prev, [key]: value }));
  };

  const handleTeamStatChange = (teamId, statKey, value) => {
    setLocalTeams((prev) =>
      prev.map((t) => {
        if (t.id === teamId) {
          return {
            ...t,
            stats: {
              ...t.stats,
              [statKey]: value,
            },
          };
        }
        return t;
      }),
    );
  };

  const currentHomeTeam = selectedMatchup
    ? localTeams.find((t) => t.id === selectedMatchup.homeTeam.id)
    : null;
  const currentAwayTeam = selectedMatchup
    ? localTeams.find((t) => t.id === selectedMatchup.awayTeam.id)
    : null;

  const currentOdds =
    currentHomeTeam && currentAwayTeam
      ? calculateMarketOdds(currentHomeTeam, currentAwayTeam, localWeights)
      : null;

  const handlePublish = async () => {
    if (!selectedMatchup || !currentOdds) return;
    try {
      // Save global engine state just in case
      await updateTeams(localTeams);
      await updateWeights(localWeights);

      // Update match document
      const matchRef = doc(db, "matches", selectedMatchup.id);
      await updateDoc(matchRef, {
        status: "active",
        awayWinProb: currentOdds.awayWinProb,
        homeWinProb: currentOdds.homeWinProb,
        spreadAway: currentOdds.spreadAway,
        spreadHome: currentOdds.spreadHome,
        moneylineAway: currentOdds.moneylineAway,
        moneylineHome: currentOdds.moneylineHome,
      });
      alert("Match published to active markets!");
      setSelectedMatchupId("");
    } catch (err) {
      console.error(err);
      alert("Failed to publish match.");
    }
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
            className="w-full bg-black/40 border border-white/10 rounded-lg py-3 px-4 text-sm font-bold text-white focus:outline-none focus:border-[#c1ff00] transition-colors appearance-none"
          >
            <option value="">-- Choose a scheduled match --</option>
            {scheduledMatchups.map((m) => (
              <option key={m.id} value={m.id}>
                {m.awayTeam.name} @ {m.homeTeam.name} - {m.startTime}
              </option>
            ))}
          </select>
        </div>
      </div>

      {selectedMatchupId &&
        currentHomeTeam &&
        currentAwayTeam &&
        currentOdds && (
          <>
            <div className="glass-card p-6 bg-gradient-to-br from-[#c1ff00]/10 to-transparent border border-[#c1ff00]/20">
              <h3 className="text-lg font-black italic uppercase text-[#c1ff00] mb-4">
                Live Odds Preview
              </h3>
              <div className="grid grid-cols-2 gap-8 text-center">
                <div>
                  <p className="text-sm font-bold uppercase text-white/50 mb-2">
                    Away: {currentAwayTeam.name}
                  </p>
                  <div className="flex justify-center gap-4 text-sm font-mono text-white">
                    <span>Spread: {currentOdds.spreadAway.label}</span>
                    <span>ML: {currentOdds.moneylineAway.label}</span>
                    <span>
                      Win: {(currentOdds.awayWinProb * 100).toFixed(1)}%
                    </span>
                  </div>
                </div>
                <div>
                  <p className="text-sm font-bold uppercase text-white/50 mb-2">
                    Home: {currentHomeTeam.name}
                  </p>
                  <div className="flex justify-center gap-4 text-sm font-mono text-white">
                    <span>Spread: {currentOdds.spreadHome.label}</span>
                    <span>ML: {currentOdds.moneylineHome.label}</span>
                    <span>
                      Win: {(currentOdds.homeWinProb * 100).toFixed(1)}%
                    </span>
                  </div>
                </div>
              </div>
              <button
                onClick={handlePublish}
                className="mt-6 w-full py-4 bg-[#c1ff00] text-black font-black uppercase italic rounded-xl text-lg hover:scale-[0.98] transition-all shadow-[0_0_15px_rgba(193,255,0,0.2)]"
              >
                Publish to Active Markets
              </button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-[1fr_300px] gap-8">
              <div className="space-y-6">
                <h3 className="text-xl font-black italic uppercase text-white">
                  Matchup Teams Stats
                </h3>
                <div className="space-y-4">
                  {[currentAwayTeam, currentHomeTeam].map((team) => (
                    <div
                      key={team.id}
                      className="glass-card p-4 sm:p-5 flex flex-col gap-4"
                    >
                      <div className="flex justify-between items-center border-b border-white/10 pb-3">
                        <span className="text-lg font-bold uppercase italic text-white">
                          {team.name}
                        </span>
                      </div>
                      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
                        <StatInput
                          label="Offense"
                          value={team.stats.offense}
                          step={0.1}
                          min={0}
                          max={5}
                          onChange={(v) =>
                            handleTeamStatChange(team.id, "offense", v)
                          }
                        />
                        <StatInput
                          label="Defense"
                          value={team.stats.defense}
                          step={0.1}
                          min={0}
                          max={5}
                          onChange={(v) =>
                            handleTeamStatChange(team.id, "defense", v)
                          }
                        />
                        <StatInput
                          label="Overall"
                          value={team.stats.overall}
                          step={0.1}
                          min={0}
                          max={5}
                          onChange={(v) =>
                            handleTeamStatChange(team.id, "overall", v)
                          }
                        />
                        <StatInput
                          label="PPG"
                          value={team.stats.ppg}
                          step={0.1}
                          onChange={(v) =>
                            handleTeamStatChange(team.id, "ppg", v)
                          }
                        />
                        <StatInput
                          label="OPPG"
                          value={team.stats.oppg}
                          step={0.1}
                          onChange={(v) =>
                            handleTeamStatChange(team.id, "oppg", v)
                          }
                        />
                        <StatInput
                          label="FG %"
                          value={team.stats.fgPct}
                          step={0.1}
                          onChange={(v) =>
                            handleTeamStatChange(team.id, "fgPct", v)
                          }
                        />
                        <StatInput
                          label="3PT %"
                          value={team.stats.threePtPct}
                          step={0.1}
                          onChange={(v) =>
                            handleTeamStatChange(team.id, "threePtPct", v)
                          }
                        />
                        <StatInput
                          label="Wins"
                          value={team.stats.wins}
                          step={1}
                          onChange={(v) =>
                            handleTeamStatChange(team.id, "wins", v)
                          }
                        />
                        <StatInput
                          label="Losses"
                          value={team.stats.losses}
                          step={1}
                          onChange={(v) =>
                            handleTeamStatChange(team.id, "losses", v)
                          }
                        />
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
                      label="Star Ratings"
                      value={localWeights.starRatings}
                      onChange={(v) => handleWeightChange("starRatings", v)}
                    />
                    <WeightSlider
                      label="Season Averages"
                      value={localWeights.seasonAverages}
                      onChange={(v) => handleWeightChange("seasonAverages", v)}
                    />
                    <WeightSlider
                      label="Record / Win %"
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
                </div>
              </div>
            </div>
          </>
        )}
    </div>
  );
}

function SettleMatchesView() {
  const { activeMatchups, scheduledMatchups, cancelMatch } = useBetting();
  const [scores, setScores] = useState({});
  const [loadingId, setLoadingId] = useState(null);

  const handleScoreChange = (matchId, type, value) => {
    setScores((prev) => ({
      ...prev,
      [matchId]: {
        ...(prev[matchId] || { home: "", away: "" }),
        [type]: value,
      },
    }));
  };

  const handleSettle = async (matchId) => {
    const s = scores[matchId];
    if (!s || !s.home || !s.away) return alert("Enter both scores!");
    setLoadingId(matchId);
    try {
      // NOTE: Using a placeholder settleMatch here as global context wasn't verified
      // Wait, let's import or use `settleMatch` correctly. The original code used it.
      // Actually, wait, `settleMatch` is not in context? Oh, wait. Let me not change it.
      await settleMatch(matchId, Number(s.home), Number(s.away));
      alert("Match settled successfully! Payouts distributed.");
    } catch (e) {
      console.error(e);
      alert("Failed to settle match.");
    } finally {
      setLoadingId(null);
    }
  };

  const handleCancel = async (matchId) => {
    if (window.confirm("Are you sure you want to cancel this match? All active bets will be refunded.")) {
      setLoadingId(matchId);
      try {
        await cancelMatch(matchId);
        alert("Match cancelled and bets refunded.");
      } catch (e) {
        alert("Failed to cancel match.");
      } finally {
        setLoadingId(null);
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
                    <>
                      <input
                        type="number"
                        placeholder="Away Score"
                        value={scores[m.id]?.away || ""}
                        onChange={(e) =>
                          handleScoreChange(m.id, "away", e.target.value)
                        }
                        className="w-24 bg-black border border-white/20 rounded-lg py-2 px-3 text-lg font-mono text-center text-white focus:outline-none focus:border-[#c1ff00]"
                      />
                      <span className="text-white/40 font-black text-xs px-2">@</span>
                      <input
                        type="number"
                        placeholder="Home Score"
                        value={scores[m.id]?.home || ""}
                        onChange={(e) =>
                          handleScoreChange(m.id, "home", e.target.value)
                        }
                        className="w-24 bg-black border border-white/20 rounded-lg py-2 px-3 text-lg font-mono text-center text-white focus:outline-none focus:border-[#c1ff00]"
                      />
                    </>
                  ) : (
                    <span className="text-white/40 font-black text-xs px-2">@</span>
                  )}
                  
                  <span className="flex-1 text-left font-black text-xl italic">
                    {m.homeTeam.name}
                  </span>
                </div>
              </div>
            </div>

            <div className="flex flex-col md:flex-row gap-2 w-full md:w-auto">
              {m.status === "active" && (
                <button
                  onClick={() => handleSettle(m.id)}
                  disabled={loadingId === m.id}
                  className="w-full md:w-auto px-6 py-4 bg-[#c1ff00] text-black font-black uppercase italic rounded-xl text-sm hover:scale-[0.98] transition-all disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap"
                >
                  {loadingId === m.id ? "Processing..." : "Settle"}
                </button>
              )}
              <button
                onClick={() => handleCancel(m.id)}
                disabled={loadingId === m.id}
                className="w-full md:w-auto px-6 py-4 bg-red-600 text-white font-black uppercase italic rounded-xl text-sm hover:scale-[0.98] transition-all disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap"
              >
                {loadingId === m.id ? "Processing..." : "Cancel Match"}
              </button>
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
