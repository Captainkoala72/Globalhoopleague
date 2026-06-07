import { useState, useEffect } from "react";
import { collection, query, orderBy, limit, getDocs } from "firebase/firestore";
import { db } from "../firebase";

export function Leaderboard() {
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const ITEMS_PER_PAGE = 10;

  useEffect(() => {
    const fetchLeaderboard = async () => {
      try {
        const q = query(collection(db, "users"), orderBy("balance", "desc"), limit(50));
        const snapshot = await getDocs(q);
        const fetchedUsers = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        setUsers(fetchedUsers);
      } catch (error) {
        console.error("Error fetching leaderboard:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchLeaderboard();
  }, []);

  const totalPages = Math.ceil(users.length / ITEMS_PER_PAGE);
  const paginatedUsers = users.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  const getRankDisplay = (rank: number) => {
    if (rank === 1) return <span className="text-xl" title="1st Place">🏆</span>;
    if (rank === 2) return <span className="text-xl" title="2nd Place">🥈</span>;
    if (rank === 3) return <span className="text-xl" title="3rd Place">🥉</span>;
    return <span className="text-white/40 font-mono text-lg px-2">{rank}</span>;
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-end justify-between">
        <div>
          <h1 className="text-3xl font-black italic uppercase text-white">
            Global Leaderboard
          </h1>
          <p className="text-white/40 text-sm font-medium">
            Top 50 Bettors Ranked by Bankroll
          </p>
        </div>
      </div>

      <div className="glass-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-white/10 bg-black/40 text-[10px] sm:text-xs font-bold uppercase tracking-widest text-white/40">
                <th className="p-4 w-20 text-center">Rank</th>
                <th className="p-4">Bettor</th>
                <th className="p-4 text-right">Bankroll</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={3} className="p-8 text-center">
                    <div className="inline-block w-6 h-6 border-2 border-[#c1ff00] border-t-transparent rounded-full animate-spin"></div>
                  </td>
                </tr>
              ) : paginatedUsers.length === 0 ? (
                <tr>
                  <td colSpan={3} className="p-8 text-center text-white/40 italic font-medium">
                    No users found on the leaderboard.
                  </td>
                </tr>
              ) : (
                paginatedUsers.map((u, index) => {
                  const globalRank = (currentPage - 1) * ITEMS_PER_PAGE + index + 1;
                  return (
                    <tr
                      key={u.id}
                      className="border-b border-white/5 bg-black/20 hover:bg-white/5 transition-colors"
                    >
                      <td className="p-4 text-center font-bold">
                        {getRankDisplay(globalRank)}
                      </td>
                      <td className="p-4">
                        <span className="font-bold text-white uppercase italic">
                          {u.displayName ? u.displayName : (u.email ? u.email.split('@')[0] : "Unknown User")}
                        </span>
                      </td>
                      <td className="p-4 text-right">
                        <span className="font-mono font-bold text-[#c1ff00] accent-glow text-lg">
                          ${u.balance?.toLocaleString(undefined, {
                            minimumFractionDigits: 2,
                            maximumFractionDigits: 2,
                          })}
                        </span>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
        
        {/* Pagination */ }
        {!loading && totalPages > 1 && (
          <div className="flex items-center justify-between p-4 border-t border-white/10 bg-black/40">
            <button
              onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="px-4 py-2 text-xs font-bold uppercase disabled:opacity-50 disabled:cursor-not-allowed hover:bg-white/5 rounded transition-colors text-white"
            >
              Previous
            </button>
            <span className="text-white/60 text-xs font-bold uppercase">
              Page {currentPage} of {totalPages}
            </span>
            <button
              onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              className="px-4 py-2 text-xs font-bold uppercase disabled:opacity-50 disabled:cursor-not-allowed hover:bg-white/5 rounded transition-colors text-white"
            >
              Next
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
