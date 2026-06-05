import { useState } from "react";
import { AlertCircle } from "lucide-react";
import React from "react";
import { useBetting } from "../context/BettingContext";

export function BetSlip() {
  const { betSlip, clearBetSlip } = useBetting();

  if (betSlip.length === 0) {
    return (
      <div className="w-full lg:w-[320px] bg-black/60 border border-white/10 rounded-xl flex flex-col min-h-[400px]">
        <div className="p-6 border-b border-white/10 flex items-center justify-between">
          <h2 className="text-xl font-black italic uppercase text-white">
            Bet Slip
          </h2>
          <span className="bg-white/10 text-white/50 text-[10px] font-bold px-2 py-1 rounded-full">
            0 SELECTIONS
          </span>
        </div>
        <div className="flex-1 flex flex-col items-center justify-center p-6 text-center">
          <div className="w-12 h-12 bg-white/5 rounded-full flex items-center justify-center text-white/20 mb-4">
            <AlertCircle size={24} />
          </div>
          <h3 className="font-bold text-white mb-2 uppercase tracking-wider text-sm">
            Bet Slip Empty
          </h3>
          <p className="text-xs text-white/40 font-medium">
            Click on odds in the sportsbook to add up your selections.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full lg:w-[320px] bg-black/60 border border-white/10 rounded-xl flex flex-col max-h-[85vh]">
      <div className="p-4 sm:p-6 border-b border-white/10 flex items-center justify-between bg-black/40 rounded-t-xl">
        <h2 className="text-xl font-black italic uppercase text-white">
          Bet Slip
        </h2>
        <div className="flex items-center gap-3">
          <button
            onClick={clearBetSlip}
            className="text-[10px] text-white/40 hover:text-white uppercase font-bold transition-colors"
          >
            Clear
          </button>
          <span className="bg-[#c1ff00] text-black text-[10px] font-bold px-2 py-1 rounded-full">
            {betSlip.length} SELECTION{betSlip.length !== 1 && "S"}
          </span>
        </div>
      </div>

      <div className="flex-1 p-4 sm:p-6 flex flex-col gap-4 overflow-y-auto scrollbar-hide">
        {betSlip.map((item) => (
          <BetSlipCard key={item.id} item={item} />
        ))}
      </div>
    </div>
  );
}

function BetSlipCard({ item }) {
  const { removeFromBetSlip, placeBet, dimesBalance } = useBetting();
  const [stakeStr, setStakeStr] = useState("");
  const stake = parseFloat(stakeStr) || 0;

  // Calculate payout
  let payout = 0;
  const odds = item.selection.americanOdds;
  if (stake > 0) {
    if (odds > 0) {
      payout = stake + (stake * odds) / 100;
    } else {
      payout = stake + (stake * 100) / Math.abs(odds);
    }
  }

  const handlePlaceBet = () => {
    if (stake > 0) {
      placeBet(stake, item.id);
    }
  };

  const isStakeValid = stake > 0 && stake <= dimesBalance;

  return (
    <div className="glass-card p-4 border-l-4 border-l-[#c1ff00] flex flex-col gap-4">
      <div>
        <div className="flex justify-between items-start mb-1">
          <span className="text-sm font-bold uppercase italic text-white">
            {item.selectedTeamName}
          </span>
          <button
            onClick={() => removeFromBetSlip(item.id)}
            className="text-white/40 hover:text-white font-bold transition-colors"
          >
            ✕
          </button>
        </div>
        <div className="text-[10px] text-white/40 font-bold uppercase tracking-widest">
          {item.selection.type === "spread" ? "Point Spread" : "Moneyline"}{" "}
          {item.selection.label} @ {item.selection.americanOdds > 0 ? "+" : ""}
          {item.selection.americanOdds}
        </div>
      </div>

      <div className="flex items-center justify-between bg-white/5 p-3 rounded-lg border border-white/10">
        <div className="flex flex-col">
          <span className="text-[10px] text-white/40 font-bold uppercase mb-1">
            Stake ($Dimes)
          </span>
          <div className="flex items-center gap-1 font-mono">
            <input
              type="number"
              value={stakeStr}
              onChange={(e) => setStakeStr(e.target.value)}
              className="bg-transparent border-none p-0 focus:ring-0 text-white w-20 text-lg font-bold outline-none placeholder:text-white/20"
              placeholder="0"
            />
          </div>
        </div>
        <div className="flex flex-col items-end">
          <span className="text-[10px] text-white/40 font-bold uppercase mb-1">
            To Win
          </span>
          <div className="flex items-baseline gap-1">
            <span className="text-lg font-mono font-bold accent-glow text-right">
              {(payout - stake > 0 ? payout - stake : 0).toFixed(2)}
            </span>
            <span className="text-[#c1ff00] text-[10px] font-mono">$Dimes</span>
          </div>
        </div>
      </div>

      <button
        onClick={handlePlaceBet}
        disabled={!isStakeValid}
        className={`w-full py-3 font-black uppercase italic rounded-xl text-sm transition-all focus:outline-none focus:ring-2 focus:ring-[#c1ff00] focus:ring-offset-2 focus:ring-offset-[#050608] ${
          isStakeValid
            ? "bg-[#c1ff00] hover:scale-[0.98] text-black shadow-[0_0_15px_rgba(193,255,0,0.3)]"
            : "bg-white/5 text-white/30 cursor-not-allowed border border-white/10"
        }`}
      >
        {stake > dimesBalance ? "Insufficient Dimes" : "Place Bet"}
      </button>
    </div>
  );
}
