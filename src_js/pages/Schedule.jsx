import { useBetting } from "../context/BettingContext";

export function Schedule() {
  const { scheduledMatchups, activeMatchups } = useBetting();
  const allUpcoming = [...activeMatchups, ...scheduledMatchups].sort(
    (a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime(),
  );

  return (
    <div className="space-y-6">
      <h2 className="text-3xl font-black italic uppercase text-white mb-6">
        Schedule
      </h2>

      {allUpcoming.length === 0 ? (
        <div className="glass-card p-12 text-center">
          <p className="text-white/40 font-bold uppercase italic text-lg">
            No upcoming matches.
          </p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {allUpcoming.map((match) => (
            <div key={match.id} className="glass-card p-6 flex flex-col gap-4">
              <div className="flex justify-between items-center border-b border-white/10 pb-2">
                <span className="text-sm font-mono font-bold text-white/40">
                  {new Date(match.startTime).toLocaleDateString()}
                </span>
                <span className="text-sm font-mono font-bold text-white/40">
                  {new Date(match.startTime).toLocaleTimeString([], {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </span>
              </div>
              <div className="flex flex-col gap-2">
                <div className="flex justify-between items-center">
                  <span className="text-white/60 text-xs font-bold uppercase tracking-widest">
                    Away
                  </span>
                  <span className="text-lg font-black italic uppercase text-white">
                    {match.awayTeam.name}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-white/60 text-xs font-bold uppercase tracking-widest">
                    Home
                  </span>
                  <span className="text-lg font-black italic uppercase text-white">
                    {match.homeTeam.name}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
