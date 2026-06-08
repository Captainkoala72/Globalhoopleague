import React, { useState, useEffect } from "react";
import { doc, getDoc, setDoc, getDocs, collection, writeBatch } from "firebase/firestore";
import { db } from "../firebase";

export function LeagueManagement() {
  const [year, setYear] = useState("");
  const [isWiping, setIsWiping] = useState(false);
  const [currentLeagueState, setCurrentLeagueState] = useState<{ currentYear: string; currentWeek: number } | null>(null);

  useEffect(() => {
    const fetchLeagueState = async () => {
      const stateDoc = await getDoc(doc(db, "leagueState", "current"));
      if (stateDoc.exists()) {
        setCurrentLeagueState(stateDoc.data() as any);
        setYear(stateDoc.data().currentYear || "");
      }
    };
    fetchLeagueState();
  }, []);

  const handleStartSeason = async () => {
    if (!year) {
      alert("Please enter a valid year.");
      return;
    }

    const confirmWipe = window.confirm(
      `Are you sure you want to start the ${year} season? This will completely reset all active seasonal team stats to 0. Historical head-to-head records and coach profiles will NOT be deleted.`
    );

    if (!confirmWipe) return;

    setIsWiping(true);

    try {
      const batch = writeBatch(db);

      // 1. Update Global League State
      const leagueStateRef = doc(db, "leagueState", "current");
      batch.set(leagueStateRef, {
        currentYear: year,
        currentWeek: 1
      }, { merge: true });

      // 2. Loop through every team and reset active seasonal stats
      const teamsSnapshot = await getDocs(collection(db, "teams"));
      
      teamsSnapshot.forEach((teamDoc) => {
        const teamRef = doc(db, "teams", teamDoc.id);
        
        // Wipe protocol -> resets Wins & Losses to 0, currentSeasonStats everything to 0
        batch.update(teamRef, {
          wins: 0,
          losses: 0,
          currentSeasonStats: {
            fgPct: 0,
            threePtPct: 0,
            ftPct: 0,
            rebounds: 0,
            assists: 0,
            fouls: 0,
            steals: 0,
            turnovers: 0,
            blocks: 0
          }
        });
      });

      // 3. Commit the transaction
      await batch.commit();

      setCurrentLeagueState({ currentYear: year, currentWeek: 1 });
      alert(`Successfully reset stats and started the ${year} season (Week 1)!`);
    } catch (e: any) {
      console.error("Wipe Protocol Error:", e);
      alert("Failed to start the new season: " + e.message);
    } finally {
      setIsWiping(false);
    }
  };

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center gap-4">
        <h2 className="text-2xl font-black uppercase italic tracking-wider">League Management</h2>
      </div>
      
      <div className="glass-card p-6 flex flex-col gap-6 border border-red-500/20 bg-red-500/5">
        <div>
          <h3 className="text-lg font-bold text-red-500 uppercase italic mb-2">Phase 1: Seasonal Stat Wipe</h3>
          <p className="text-sm text-white/60 mb-6">
            Initialize a new regular season. This will overwrite the current active season, 
            setting all teams' wins, losses, and active season averages back to 0. It preserves historical 
            head-to-head matches and coaching directives.
          </p>

          {currentLeagueState && (
            <div className="mb-6 p-4 bg-black/40 rounded-lg border border-white/10 flex justify-between items-center">
              <div>
                <p className="text-xs text-white/40 uppercase font-bold tracking-wider mb-1">Current Active Season</p>
                <div className="text-xl font-mono font-bold text-[#c1ff00]">{currentLeagueState.currentYear}</div>
              </div>
              <div className="text-right">
                <p className="text-xs text-white/40 uppercase font-bold tracking-wider mb-1">Week</p>
                <div className="text-xl font-mono font-bold text-white">{currentLeagueState.currentWeek}</div>
              </div>
            </div>
          )}

          <div className="flex flex-col gap-2 relative z-30">
            <label className="text-xs font-bold text-white/40 uppercase tracking-wider">Set Year</label>
            <input
              type="text"
              value={year}
              onChange={(e) => setYear(e.target.value)}
              placeholder="e.g. 2026"
              className="bg-black/40 border border-white/10 rounded-lg p-3 text-white focus:outline-none focus:border-red-500 font-mono"
            />
          </div>
        </div>

        <button
          onClick={handleStartSeason}
          disabled={isWiping}
          className="w-full py-4 mt-2 bg-red-600 text-white font-black uppercase italic rounded-xl text-lg hover:bg-red-500 hover:scale-[0.98] transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-[0_0_15px_rgba(220,38,38,0.3)] relative z-30 pointer-events-auto cursor-pointer"
        >
          {isWiping ? "Executing Protocol..." : "START NEW SEASON"}
        </button>
      </div>
    </div>
  );
}
