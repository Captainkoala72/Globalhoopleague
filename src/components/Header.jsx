import { LogOut, PlayCircle } from "lucide-react";
import { useBetting } from "../context/BettingContext";
import { useAuth } from "../context/AuthContext";
import { Link } from "react-router-dom";

export function Header({ activeTab, setActiveTab }) {
  const { dimesBalance } = useBetting();
  const { profile, logOut } = useAuth();
  const activeBalance = profile ? profile.balance : dimesBalance;

  return (
    <header className="sticky top-0 z-50 h-16 flex items-center justify-between px-4 sm:px-8 border-b border-white/10 bg-black/40 backdrop-blur-xl">
      {/* Left: Logo Area */}
      <div className="flex items-center gap-6 sm:gap-10 overflow-hidden min-w-0">
        <span className="text-xl md:text-2xl font-black tracking-tight italic uppercase text-white truncate">
          GLOBAL HOOP LEAGUE BETTING SIMULATOR
        </span>

        {/* Middle: Navigation */}
        <nav className="hidden md:flex gap-6 text-sm font-bold uppercase tracking-wider text-white/60">
          <Link
            to="/"
            className={`py-5 transition-colors ${
              activeTab === "sportsbook"
                ? "text-[#c1ff00] border-b-2 border-[#c1ff00]"
                : "hover:text-white border-b-2 border-transparent"
            }`}
          >
            Sportsbook
          </Link>
          <Link
            to="/schedule"
            className={`py-5 transition-colors ${
              activeTab === "schedule"
                ? "text-[#c1ff00] border-b-2 border-[#c1ff00]"
                : "hover:text-white border-b-2 border-transparent"
            }`}
          >
            Schedule
          </Link>
          <Link
            to="/standings"
            className={`py-5 transition-colors ${
              activeTab === "standings"
                ? "text-[#c1ff00] border-b-2 border-[#c1ff00]"
                : "hover:text-white border-b-2 border-transparent"
            }`}
          >
            Standings
          </Link>
          <Link
            to="/results"
            className={`py-5 transition-colors ${
              activeTab === "results"
                ? "text-[#c1ff00] border-b-2 border-[#c1ff00]"
                : "hover:text-white border-b-2 border-transparent"
            }`}
          >
            Results
          </Link>
          <Link
            to="/my-bets"
            className={`py-5 transition-colors ${
              activeTab === "mybets"
                ? "text-[#c1ff00] border-b-2 border-[#c1ff00]"
                : "hover:text-white border-b-2 border-transparent"
            }`}
          >
            My Bets
          </Link>
          {profile?.role === "admin" && (
            <Link
              to="/admin"
              className={`py-5 transition-colors ${
                activeTab === "admin"
                  ? "text-[#c1ff00] border-b-2 border-[#c1ff00]"
                  : "hover:text-white border-b-2 border-transparent"
              }`}
            >
              Admin Panel
            </Link>
          )}
        </nav>
      </div>

      {/* Right: Balances & Profile */}
      <div className="flex items-center gap-4 shrink-0">
        <div className="relative group p-2 -m-2">
          <div className="flex items-center gap-3 bg-white/5 border border-white/10 px-4 py-2 rounded-xl cursor-default hover:bg-white/10 transition-colors">
            <div className="flex flex-col items-end">
              <span className="text-[10px] text-white/40 uppercase font-bold tracking-widest hidden sm:block leading-none mb-1">
                Bankroll
              </span>
              <span className="text-sm sm:text-lg font-mono font-bold accent-glow leading-none">
                {activeBalance.toLocaleString(undefined, {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                })}{" "}
                <span className="text-[#c1ff00] text-xs sm:text-sm">
                  $Dimes
                </span>
              </span>
            </div>
          </div>

          <div className="absolute right-0 top-full mt-2 w-48 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50">
            <div className="bg-[#111] border border-white/10 rounded-xl p-2 shadow-2xl">
              <Link
                to="/free-dimes"
                className="flex items-center gap-3 px-4 py-3 text-sm text-white/80 hover:text-white hover:bg-[#c1ff00]/10 hover:shadow-[inset_0_0_12px_rgba(193,255,0,0.1)] rounded-lg transition-all font-bold uppercase tracking-widest group/link"
              >
                <PlayCircle
                  size={18}
                  className="text-[#c1ff00] transition-transform group-hover/link:scale-110"
                />
                <span>Earn Dimes</span>
              </Link>
            </div>
          </div>
        </div>

        <button
          onClick={logOut}
          className="w-10 h-10 rounded-full bg-white/5 border border-white/10 flex items-center justify-center hover:bg-white/10 transition-colors"
          title="Sign Out"
        >
          <LogOut size={16} className="text-[#c1ff00]" />
        </button>
      </div>
    </header>
  );
}
