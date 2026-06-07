import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useBetting } from "../context/BettingContext";
import { useAuth } from "../context/AuthContext";
import { writeBatch, doc } from "firebase/firestore";
import { db } from "../firebase";
import { TeamLogo } from "../components/TeamLogo";

export function Standings() {
  const { teams } = useBetting();
  const { profile } = useAuth();
  const isAdmin = profile?.role === "admin";
  const [isEditing, setIsEditing] = useState(false);

  // Sorting teams by Win percentage (Wins descending, Losses ascending)
  const sortedTeams = [...teams].sort((a, b) => {
    const totalA = a.stats.wins + a.stats.losses;
    const totalB = b.stats.wins + b.stats.losses;
    const winPctA = totalA === 0 ? 0 : a.stats.wins / totalA;
    const winPctB = totalB === 0 ? 0 : b.stats.wins / totalB;

    if (winPctB !== winPctA) {
      return winPctB - winPctA;
    }
    if (a.stats.wins !== b.stats.wins) {
      return b.stats.wins - a.stats.wins;
    }
    return a.stats.losses - b.stats.losses;
  });

  const handleUpdateRecord = async (teamId, type, increment) => {
    const team = teams.find((t) => t.id === teamId);
    if (!team) return;

    const newValue = team.stats[type] + increment;
    if (newValue < 0) return;

    try {
      const ref = doc(db, "teams", teamId);
      const batch = writeBatch(db);
      batch.update(ref, {
        [`stats.${type}`]: newValue,
      });
      await batch.commit();
    } catch (e) {
      console.error("Error updating record", e);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-end mb-6">
        <h2 className="text-3xl font-black italic uppercase text-white">
          Standings
        </h2>
        {isAdmin && (
          <button
            onClick={() => setIsEditing(!isEditing)}
            className={`px-4 py-2 rounded-lg text-xs font-bold uppercase transition-colors ${
              isEditing
                ? "bg-[#c1ff00] text-black"
                : "bg-white/10 text-white hover:bg-white/20"
            }`}
          >
            {isEditing ? "Done Editing" : "Edit Records"}
          </button>
        )}
      </div>

      <div className="glass-card overflow-hidden">
        <div className="grid grid-cols-[3rem_1fr_6rem_6rem] sm:grid-cols-[4rem_1fr_8rem_8rem] gap-4 p-4 border-b border-white/10 text-white/40 text-xs font-bold uppercase tracking-widest bg-white/5">
          <div className="text-center">Rank</div>
          <div>Team</div>
          <div className="text-center">Conf</div>
          <div className="text-center">W - L</div>
        </div>

        <div className="flex flex-col">
          <AnimatePresence>
            {sortedTeams.map((team, index) => (
              <motion.div
                key={team.id}
                layout
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.3 }}
                className="grid grid-cols-[3rem_1fr_6rem_6rem] sm:grid-cols-[4rem_1fr_8rem_8rem] gap-4 p-4 items-center border-b border-white/5 last:border-0 hover:bg-white/[0.02] transition-colors"
              >
                <div className="text-center font-mono font-bold text-[#c1ff00] text-lg">
                  {index + 1}
                </div>
                <div className="font-black italic text-white uppercase sm:text-lg truncate flex items-center gap-2 sm:gap-3">
                  <TeamLogo teamName={team.name} className="w-6 h-6 sm:w-8 sm:h-8 shrink-0" />
                  <span className="truncate">{team.name}</span>
                </div>
                <div className="text-center font-bold text-white/60 text-sm">
                  {team.conference}
                </div>
                <div className="text-center flex justify-center items-center gap-2">
                  {isEditing ? (
                    <div className="flex items-center gap-2">
                      <div className="flex flex-col items-center">
                        <button
                          onClick={() => handleUpdateRecord(team.id, "wins", 1)}
                          className="text-white/40 hover:text-[#c1ff00] text-xs"
                        >
                          ▲
                        </button>
                        <span className="font-mono font-bold text-white w-6 text-center">
                          {team.stats.wins}
                        </span>
                        <button
                          onClick={() =>
                            handleUpdateRecord(team.id, "wins", -1)
                          }
                          className="text-white/40 hover:text-red-500 text-xs"
                        >
                          ▼
                        </button>
                      </div>
                      <span className="text-white/40 font-bold">-</span>
                      <div className="flex flex-col items-center">
                        <button
                          onClick={() =>
                            handleUpdateRecord(team.id, "losses", 1)
                          }
                          className="text-white/40 hover:text-[#c1ff00] text-xs"
                        >
                          ▲
                        </button>
                        <span className="font-mono font-bold text-white w-6 text-center">
                          {team.stats.losses}
                        </span>
                        <button
                          onClick={() =>
                            handleUpdateRecord(team.id, "losses", -1)
                          }
                          className="text-white/40 hover:text-red-500 text-xs"
                        >
                          ▼
                        </button>
                      </div>
                    </div>
                  ) : (
                    <span className="font-mono font-bold text-white text-base">
                      {team.stats.wins} - {team.stats.losses}
                    </span>
                  )}
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
