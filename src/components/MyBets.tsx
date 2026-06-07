import { useState } from "react";
import { useBetting } from "../context/BettingContext";

export function MyBets() {
  const { placedBets } = useBetting();
  const [activeTab, setActiveTab] = useState("active");

  const activeBets = placedBets.filter((b) => b.status === "open");
  const settledBets = placedBets.filter(
    (b) => b.status === "won" || b.status === "lost" || b.status === "push" || b.status === "refunded",
  );

  const betsToShow = activeTab === "active" ? activeBets : settledBets;

  return (
    <div className="space-y-6">
      <div className="flex gap-4 border-b border-white/10 pb-1">
        <button
          onClick={() => setActiveTab("active")}
          className={`pb-3 px-2 text-sm font-bold uppercase tracking-widest transition-colors ${
            activeTab === "active"
              ? "text-[#c1ff00] border-b-2 border-[#c1ff00]"
              : "text-white/40 hover:text-white"
          }`}
        >
          Active Bets ({activeBets.length})
        </button>
        <button
          onClick={() => setActiveTab("settled")}
          className={`pb-3 px-2 text-sm font-bold uppercase tracking-widest transition-colors ${
            activeTab === "settled"
              ? "text-[#c1ff00] border-b-2 border-[#c1ff00]"
              : "text-white/40 hover:text-white"
          }`}
        >
          Settled ({settledBets.length})
        </button>
      </div>

      {betsToShow.length === 0 ? (
        <div className="py-16 flex flex-col items-center justify-center text-center glass-card">
          <h3 className="text-xl font-black italic uppercase text-white mb-2">
            No {activeTab === "active" ? "Active" : "Settled"} Bets
          </h3>
          <p className="text-white/40 font-medium">
            You haven't placed any wagers that are currently {activeTab}.
          </p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {betsToShow.map((bet) => {
            const isSettled = bet.status !== "open";
            let badgeColor = "bg-white/20 text-white";
            if (bet.status === "won")
              badgeColor =
                "bg-[#c1ff00]/20 text-[#c1ff00] border border-[#c1ff00]/50";
            else if (bet.status === "lost")
              badgeColor =
                "bg-red-500/20 text-red-500 border border-red-500/50";
            else if (bet.status === "refunded")
              badgeColor =
                "bg-blue-500/20 text-blue-400 border border-blue-500/50";

            return (
              <div
                key={bet.id}
                className="glass-card flex flex-col justify-between p-5 relative overflow-hidden group"
              >
                {/* Visual Status Gradient */}
                {isSettled && bet.status === "won" && (
                  <div className="absolute top-0 right-0 w-32 h-32 bg-[#c1ff00]/10 blur-3xl rounded-full -mr-16 -mt-16 pointer-events-none" />
                )}
                {isSettled && bet.status === "lost" && (
                  <div className="absolute top-0 right-0 w-32 h-32 bg-red-500/10 blur-3xl rounded-full -mr-16 -mt-16 pointer-events-none" />
                )}
                {isSettled && bet.status === "refunded" && (
                  <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/10 blur-3xl rounded-full -mr-16 -mt-16 pointer-events-none" />
                )}

                <div className="relative z-10">
                  <div className="flex justify-between items-start mb-4 border-b border-white/10 pb-4">
                    <div className="flex gap-2 items-center">
                      {!isSettled ? (
                        <>
                          <span className="w-2 h-2 rounded-full bg-[#c1ff00] shadow-[0_0_8px_rgba(193,255,0,0.5)]"></span>
                          <span className="text-[10px] font-bold text-[#c1ff00] uppercase tracking-widest">
                            Active
                          </span>
                        </>
                      ) : (
                        <span
                          className={`px-2 py-1 rounded text-[10px] font-black uppercase tracking-widest ${badgeColor}`}
                        >
                          {bet.status}
                        </span>
                      )}
                    </div>
                    <span className="text-xs text-white/40 font-mono font-bold">
                      {new Date(bet.timestamp).toLocaleDateString()}
                    </span>
                  </div>

                  <div className="mb-6">
                    <div className="text-[10px] text-white/40 uppercase tracking-widest font-bold mb-1.5">
                      {bet.item.matchupTitle}
                    </div>
                    <div className="font-black text-xl italic uppercase text-white mb-2 leading-tight">
                      {bet.item.selectedTeamName}
                    </div>
                    <div className="font-bold text-sm tracking-wide">
                      <span className="text-white/60">
                        {bet.item.selection.type === "spread"
                          ? "Spread "
                          : "Moneyline "}
                      </span>
                      <span className="text-[#c1ff00] ml-1">
                        {bet.item.selection.label}
                        {bet.item.selection.type === "spread" &&
                          ` @ ${bet.item.selection.americanOdds > 0 ? "+" : ""}${bet.item.selection.americanOdds}`}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="relative z-10 flex flex-col gap-3">
                  {isSettled &&
                    bet.homeScore !== undefined &&
                    bet.awayScore !== undefined && (
                      <div className="bg-white/5 border border-white/10 rounded-lg p-2 flex justify-between items-center text-xs font-mono font-bold text-white/60">
                        <span>FINAL:</span>
                        <span>
                          AWAY {bet.awayScore} - {bet.homeScore} HOME
                        </span>
                      </div>
                    )}

                  <div className="flex gap-4 bg-black/40 p-4 rounded-xl border border-white/5">
                    <div className="flex-1">
                      <div className="text-[10px] text-white/40 uppercase tracking-widest font-bold mb-1">
                        Stake
                      </div>
                      <div className="font-mono font-bold text-white">
                        {bet.stake.toFixed(2)}{" "}
                        <span className="text-white/60 text-[10px]">
                          $Dimes
                        </span>
                      </div>
                    </div>
                    <div className="w-px bg-white/10"></div>
                    <div className="flex-1">
                      <div className="text-[10px] text-white/40 uppercase tracking-widest font-bold mb-1">
                        {isSettled ? "Actual Payout" : "To Win"}
                      </div>
                      <div
                        className={`font-mono font-bold ${bet.status === "lost" ? "text-white/40" : bet.status === "refunded" ? "text-blue-400" : "accent-glow"}`}
                      >
                        {isSettled
                          ? bet.status === "refunded" 
                            ? bet.stake.toFixed(2)
                            : (bet.actualPayout || 0).toFixed(2)
                          : bet.potentialPayout.toFixed(2)}{" "}
                        <span
                          className={`${bet.status === "lost" ? "text-white/40" : bet.status === "refunded" ? "text-blue-400" : "text-[#c1ff00]"} text-[10px]`}
                        >
                          $Dimes
                        </span>
                      </div>
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
