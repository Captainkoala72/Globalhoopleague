import { useState, useEffect, useRef } from "react";
import { LogOut, PlayCircle, Gift, Menu, X, CalendarDays, Trophy, ListOrdered, Receipt, ShieldAlert } from "lucide-react";
import { useBetting } from "../context/BettingContext";
import { useAuth } from "../context/AuthContext";
import { Link } from "react-router-dom";

export function Header({ activeTab }) {
  const { dimesBalance } = useBetting();
  const { profile, logOut } = useAuth();
  const activeBalance = profile ? profile.balance : dimesBalance;
  
  const [menuOpen, setMenuOpen] = useState(false);
  const headerRef = useRef<HTMLElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (headerRef.current && !headerRef.current.contains(event.target as Node)) {
        setMenuOpen(false);
      }
    }

    if (menuOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [menuOpen]);

  return (
    <header ref={headerRef} className="sticky top-0 z-50 flex items-center justify-between px-4 sm:px-6 md:px-8 h-16 border-b border-white/10 bg-black/80 backdrop-blur-xl">
      {/* Left: Logo Area */}
      <div className="flex items-center min-w-0">
        <span className="text-sm sm:text-base md:text-xl font-black tracking-tight italic uppercase text-white leading-snug truncate">
          GLOBAL HOOP LEAGUE<span className="hidden sm:inline text-white/60 ml-1.5">BETTING SIMULATOR</span>
        </span>
      </div>

      {/* Right: Balance & Hamburger */}
      <div className="flex items-center gap-3 sm:gap-4 shrink-0">
        
        {/* Balance Display */}
        <div className="flex items-center bg-white/5 border border-white/10 px-3 py-1.5 rounded-lg cursor-default">
          <div className="flex flex-col items-end">
            <span className="text-xs sm:text-sm md:text-base font-mono font-bold accent-glow leading-none">
              {activeBalance.toLocaleString(undefined, {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              })}{" "}
              <span className="text-[#c1ff00] text-[10px] sm:text-xs">
                $Dimes
              </span>
            </span>
          </div>
        </div>

        {/* Hamburger Icon */}
        <button
          onClick={() => setMenuOpen(!menuOpen)}
          className="w-10 h-10 rounded-lg flex items-center justify-center hover:bg-white/10 transition-colors text-white"
          title="Menu"
        >
          {menuOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>

      {/* Dropdown Menu */}
      {menuOpen && (
        <div className="absolute top-16 right-0 w-full sm:w-72 bg-[#111] border-b sm:border border-white/10 sm:rounded-b-xl sm:mr-4 shadow-2xl flex flex-col z-50">
          <nav className="flex flex-col py-2">
            <Link
              to="/"
              onClick={() => setMenuOpen(false)}
              className={`flex items-center gap-3 px-6 py-4 text-sm font-bold uppercase tracking-wider transition-colors hover:bg-white/5 ${
                activeTab === "sportsbook" ? "text-[#c1ff00]" : "text-white/80 hover:text-white"
              }`}
            >
              <Trophy size={18} className={activeTab === "sportsbook" ? "text-[#c1ff00]" : "text-white/50"} />
              Sportsbook
            </Link>
            <Link
              to="/schedule"
              onClick={() => setMenuOpen(false)}
              className={`flex items-center gap-3 px-6 py-4 text-sm font-bold uppercase tracking-wider transition-colors hover:bg-white/5 ${
                activeTab === "schedule" ? "text-[#c1ff00]" : "text-white/80 hover:text-white"
              }`}
            >
              <CalendarDays size={18} className={activeTab === "schedule" ? "text-[#c1ff00]" : "text-white/50"} />
              Schedule
            </Link>
            <Link
              to="/standings"
              onClick={() => setMenuOpen(false)}
              className={`flex items-center gap-3 px-6 py-4 text-sm font-bold uppercase tracking-wider transition-colors hover:bg-white/5 ${
                activeTab === "standings" ? "text-[#c1ff00]" : "text-white/80 hover:text-white"
              }`}
            >
              <ListOrdered size={18} className={activeTab === "standings" ? "text-[#c1ff00]" : "text-white/50"} />
              Standings
            </Link>
            <Link
              to="/results"
              onClick={() => setMenuOpen(false)}
              className={`flex items-center gap-3 px-6 py-4 text-sm font-bold uppercase tracking-wider transition-colors hover:bg-white/5 ${
                activeTab === "results" ? "text-[#c1ff00]" : "text-white/80 hover:text-white"
              }`}
            >
              <PlayCircle size={18} className={activeTab === "results" ? "text-[#c1ff00]" : "text-white/50"} />
              Results
            </Link>
            <Link
              to="/my-bets"
              onClick={() => setMenuOpen(false)}
              className={`flex items-center gap-3 px-6 py-4 text-sm font-bold uppercase tracking-wider transition-colors hover:bg-white/5 ${
                activeTab === "mybets" ? "text-[#c1ff00]" : "text-white/80 hover:text-white"
              }`}
            >
              <Receipt size={18} className={activeTab === "mybets" ? "text-[#c1ff00]" : "text-white/50"} />
              My Bets
            </Link>
            
            <div className="h-px bg-white/10 my-2 mx-4" />

            <Link
              to="/free-dimes"
              onClick={() => setMenuOpen(false)}
              className="flex items-center gap-3 px-6 py-4 text-sm font-bold uppercase tracking-wider text-[#c1ff00] hover:bg-[#c1ff00]/10 transition-colors"
            >
              <Gift size={18} />
              Free Dimes
            </Link>

            {profile?.role === "admin" && (
              <Link
                to="/admin"
                onClick={() => setMenuOpen(false)}
                className={`flex items-center gap-3 px-6 py-4 text-sm font-bold uppercase tracking-wider transition-colors hover:bg-white/5 ${
                  activeTab === "admin" ? "text-[#c1ff00]" : "text-red-400 hover:text-red-300"
                }`}
              >
                <ShieldAlert size={18} className={activeTab === "admin" ? "text-[#c1ff00]" : "text-red-400"} />
                Admin Panel
              </Link>
            )}

            <div className="h-px bg-white/10 my-2 mx-4" />

            <button
              onClick={() => {
                setMenuOpen(false);
                logOut();
              }}
              className="flex items-center gap-3 px-6 py-4 text-sm font-bold uppercase tracking-wider text-white/50 hover:text-white hover:bg-white/5 transition-colors w-full text-left"
            >
              <LogOut size={18} />
              Sign Out
            </button>
          </nav>
        </div>
      )}
    </header>
  );
}

