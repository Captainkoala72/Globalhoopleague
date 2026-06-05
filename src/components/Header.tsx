import { LogOut, PlayCircle, Gift } from "lucide-react";
import { useBetting } from "../context/BettingContext";
import { useAuth } from "../context/AuthContext";
import { Link } from "react-router-dom";

export function Header({ activeTab, setActiveTab }) {
  const { dimesBalance } = useBetting();
  const { profile, logOut } = useAuth();
  const activeBalance = profile ? profile.balance : dimesBalance;

  return (
    <header className="sticky top-0 z-50 flex items-center justify-between px-3 sm:px-6 md:px-8 border-b border-white/10 bg-black/40 backdrop-blur-xl flex-wrap md:flex-nowrap gap-y-3 min-h-[4rem]">
      {/* Left: Logo Area */}
      <div className="flex items-center gap-4 sm:gap-6 md:gap-10 py-3 md:py-0 min-w-0">
        <span className="text-[13px] sm:text-lg md:text-xl lg:text-2xl font-black tracking-tight italic uppercase text-white leading-snug">
          GLOBAL HOOP LEAGUE<br className="block sm:hidden" />
          <span className="text-white/60 sm:ml-1 md:ml-1.5 ml-0">BETTING SIMULATOR</span>
        </span>

        {/* Middle: Navigation */}
        <nav className="hidden md:flex gap-6 text-sm font-bold uppercase tracking-wider text-white/60 self-stretch">
          <Link
            to="/"
            className={`flex items-center border-b-2 transition-colors ${
              activeTab === "sportsbook"
                ? "text-[#c1ff00] border-[#c1ff00]"
                : "hover:text-white border-transparent"
            }`}
          >
            Sportsbook
          </Link>
          <Link
            to="/schedule"
            className={`flex items-center border-b-2 transition-colors ${
              activeTab === "schedule"
                ? "text-[#c1ff00] border-[#c1ff00]"
                : "hover:text-white border-transparent"
            }`}
          >
            Schedule
          </Link>
          <Link
            to="/standings"
            className={`flex items-center border-b-2 transition-colors ${
              activeTab === "standings"
                ? "text-[#c1ff00] border-[#c1ff00]"
                : "hover:text-white border-transparent"
            }`}
          >
            Standings
          </Link>
          <Link
            to="/results"
            className={`flex items-center border-b-2 transition-colors ${
              activeTab === "results"
                ? "text-[#c1ff00] border-[#c1ff00]"
                : "hover:text-white border-transparent"
            }`}
          >
            Results
          </Link>
          <Link
            to="/my-bets"
            className={`flex items-center border-b-2 transition-colors ${
              activeTab === "mybets"
                ? "text-[#c1ff00] border-[#c1ff00]"
                : "hover:text-white border-transparent"
            }`}
          >
            My Bets
          </Link>
          {profile?.role === "admin" && (
            <Link
              to="/admin"
              className={`flex items-center border-b-2 transition-colors ${
                activeTab === "admin"
                  ? "text-[#c1ff00] border-[#c1ff00]"
                  : "hover:text-white border-transparent"
              }`}
            >
              Admin Panel
            </Link>
          )}
        </nav>
      </div>

      {/* Right: Balances & Profile */}
      <div className="flex items-center gap-2 sm:gap-3 shrink-0 py-3 md:py-0">
        
        {/* Mobile Claims Dimes Button */}
        <Link
          to="/free-dimes"
          className="md:hidden flex items-center justify-center gap-1.5 bg-[#c1ff00]/10 border border-[#c1ff00]/30 rounded-lg px-2 sm:px-3 py-1.5 sm:py-2 text-[#c1ff00] hover:bg-[#c1ff00]/20 transition-colors"
          title="Claim Free Dimes"
        >
          <Gift size={16} />
          <span className="text-[10px] sm:text-xs font-bold uppercase tracking-widest whitespace-nowrap">Claim</span>
        </Link>

        <div className="relative group p-0 md:p-2 md:-m-2">
          <div className="flex items-center gap-2 md:gap-3 bg-white/5 border border-white/10 px-3 sm:px-4 py-1.5 sm:py-2 rounded-lg sm:rounded-xl cursor-default md:hover:bg-white/10 transition-colors">
            <div className="flex flex-col items-end">
              <span className="text-[10px] text-white/40 uppercase font-bold tracking-widest hidden sm:block leading-none mb-1">
                Bankroll
              </span>
              <span className="text-sm sm:text-base md:text-lg font-mono font-bold accent-glow leading-none">
                {activeBalance.toLocaleString(undefined, {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                })}{" "}
                <span className="text-[#c1ff00] text-[10px] sm:text-xs md:text-sm">
                  $Dimes
                </span>
              </span>
            </div>
          </div>

          <div className="absolute right-0 top-full mt-2 w-48 opacity-0 invisible md:group-hover:opacity-100 md:group-hover:visible transition-all duration-200 z-50 hidden md:block">
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
          className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg sm:rounded-full bg-white/5 border border-white/10 flex items-center justify-center hover:bg-white/10 transition-colors"
          title="Sign Out"
        >
          <LogOut size={14} className="text-[#c1ff00] sm:scale-110" />
        </button>
      </div>
    </header>
  );
}
