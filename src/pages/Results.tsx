import { useState } from "react";
import { useBetting } from "../context/BettingContext";
import { useAuth } from "../context/AuthContext";
import { Trash2, CheckCircle2 } from "lucide-react";
import { doc, deleteDoc } from "firebase/firestore";
import { db } from "../firebase";

export function Results() {
  const { settledMatchups } = useBetting();
  const { profile } = useAuth();
  const isAdmin = profile?.role === "admin";
  const [deleteConfirmId, setDeleteConfirmId] = useState(null);

  const handleDelete = async (matchId) => {
    try {
      await deleteDoc(doc(db, "matches", matchId));
      setDeleteConfirmId(null);
    } catch (e) {
      console.error("Error deleting match", e);
    }
  };

  return (
    <div className="space-y-6 relative">
      <h2 className="text-3xl font-black italic uppercase text-white mb-6">
        Results
      </h2>

      {deleteConfirmId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="bg-[#111111] border border-white/20 p-6 rounded-xl max-w-sm w-full space-y-6">
            <div className="text-center">
              <h3 className="text-xl font-black italic text-white mb-2">
                Delete Result?
              </h3>
              <p className="text-white/60 text-sm">
                Are you sure you want to delete this match result? This action
                is permanent.
              </p>
            </div>
            <div className="flex gap-4">
              <button
                onClick={() => setDeleteConfirmId(null)}
                className="flex-1 py-3 bg-white/10 text-white font-bold rounded-lg hover:bg-white/20 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => handleDelete(deleteConfirmId)}
                className="flex-1 py-3 bg-red-500/20 text-red-500 hover:bg-red-500 hover:text-white border border-red-500/50 font-bold rounded-lg transition-colors"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {settledMatchups.length === 0 ? (
        <div className="glass-card p-12 text-center">
          <p className="text-white/40 font-bold uppercase italic text-lg">
            No recently settled results.
          </p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {settledMatchups.map((match) => {
            const homeScore = match.homeScore || 0;
            const awayScore = match.awayScore || 0;
            const homeWonText =
              homeScore > awayScore
                ? "Won"
                : homeScore < awayScore
                  ? "Lost"
                  : "Push";
            const awayWonText =
              awayScore > homeScore
                ? "Won"
                : awayScore < homeScore
                  ? "Lost"
                  : "Push";
            // spread math -> e.g. spreadHome = "+4.5".
            // home wins spread if homeScore + 4.5 > awayScore
            let homeSpreadResult = "Push";
            let awaySpreadResult = "Push";
            if (match.spreadHome) {
              const homeSpreadMargin =
                homeScore + parseFloat(match.spreadHome.label);
              if (homeSpreadMargin > awayScore) {
                homeSpreadResult = "Won";
                awaySpreadResult = "Lost";
              } else if (homeSpreadMargin < awayScore) {
                homeSpreadResult = "Lost";
                awaySpreadResult = "Won";
              }
            }

            return (
              <div
                key={match.id}
                className="glass-card p-0 overflow-hidden flex flex-col relative"
              >
                {isAdmin && (
                  <button
                    onClick={() => setDeleteConfirmId(match.id)}
                    className="absolute top-3 right-3 text-white/20 hover:text-red-500 transition-colors z-10"
                    title="Delete Result"
                  >
                    <Trash2 size={16} />
                  </button>
                )}
                <div className="p-4 border-b border-white/5 flex justify-between items-center bg-black/40">
                  <span className="text-xs font-mono font-bold text-white/40">
                    {new Date(match.startTime).toLocaleDateString()}
                  </span>
                  {match.status === "cancelled" ? (
                    <span className="text-[10px] font-bold uppercase tracking-widest text-red-500 bg-red-500/10 px-2 py-0.5 rounded">
                      Cancelled
                    </span>
                  ) : (
                    <span className="text-[10px] font-bold uppercase tracking-widest text-[#c1ff00] bg-[#c1ff00]/10 px-2 py-0.5 rounded">
                      Final
                    </span>
                  )}
                </div>

                <div className="p-6 flex flex-col gap-6">
                  {/* Scores */}
                  <div className="flex justify-between items-center">
                    <div className="flex flex-col flex-1 items-start gap-1">
                      <span className="text-sm font-bold uppercase text-white/40 tracking-widest">
                        Away
                      </span>
                      <span
                        className={`text-2xl font-black italic uppercase ${awayScore > homeScore ? "text-white" : "text-white/40"}`}
                      >
                        {match.awayTeam.name}
                      </span>
                      <span className="text-3xl font-mono font-bold accent-glow mt-1">
                        {awayScore}
                      </span>
                    </div>
                    <div className="text-white/20 font-black italic text-sm px-4">
                      @
                    </div>
                    <div className="flex flex-col flex-1 items-end gap-1">
                      <span className="text-sm font-bold uppercase text-white/40 tracking-widest">
                        Home
                      </span>
                      <span
                        className={`text-2xl font-black italic uppercase ${homeScore > awayScore ? "text-white" : "text-white/40"}`}
                      >
                        {match.homeTeam.name}
                      </span>
                      <span className="text-3xl font-mono font-bold accent-glow mt-1">
                        {homeScore}
                      </span>
                    </div>
                  </div>

                  {/* Odds Breakdown */}
                  <div className="bg-white/5 border border-white/10 rounded-xl p-4 space-y-3">
                    <h4 className="text-[10px] font-bold text-white/40 uppercase tracking-widest border-b border-white/10 pb-2 mb-2">
                      Odds Breakdown
                    </h4>

                    {/* Moneyline */}
                    <div className="flex justify-between text-xs font-bold">
                      <span className="text-white/60">Moneyline</span>
                      {homeScore > awayScore ? (
                        <div className="flex items-center gap-1 text-[#c1ff00]">
                          <CheckCircle2 size={12} /> {match.homeTeam.name}{" "}
                          {match.moneylineHome.americanOdds > 0 ? "+" : ""}
                          {match.moneylineHome.americanOdds}
                        </div>
                      ) : homeScore < awayScore ? (
                        <div className="flex items-center gap-1 text-[#c1ff00]">
                          <CheckCircle2 size={12} /> {match.awayTeam.name}{" "}
                          {match.moneylineAway.americanOdds > 0 ? "+" : ""}
                          {match.moneylineAway.americanOdds}
                        </div>
                      ) : (
                        <span className="text-white/40">Push</span>
                      )}
                    </div>

                    {/* Spread */}
                    <div className="flex justify-between text-xs font-bold">
                      <span className="text-white/60">Point Spread</span>
                      {homeSpreadResult === "Won" ? (
                        <div className="flex items-center gap-1 text-[#c1ff00]">
                          <CheckCircle2 size={12} /> {match.homeTeam.name}{" "}
                          {match.spreadHome?.label}
                        </div>
                      ) : awaySpreadResult === "Won" ? (
                        <div className="flex items-center gap-1 text-[#c1ff00]">
                          <CheckCircle2 size={12} /> {match.awayTeam.name}{" "}
                          {match.spreadAway?.label}
                        </div>
                      ) : (
                        <span className="text-white/40">Push</span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
