import React from "react";
import { BettingProvider, useBetting } from "./context/BettingContext";
import { AuthProvider, useAuth } from "./context/AuthContext";
import { Header } from "./components/Header";
import { MatchupCard } from "./components/MatchupCard";
import { BetSlip } from "./components/BetSlip";
import { MyBets } from "./components/MyBets";
import { AdminPanel } from "./components/AdminPanel";
import { Login } from "./components/Login";
import {
  BrowserRouter,
  Routes,
  Route,
  Navigate,
  useLocation,
  Link,
} from "react-router-dom";
import { Schedule } from "./pages/Schedule";
import { Standings } from "./pages/Standings";
import { Results } from "./pages/Results";
import { Leaderboard } from "./pages/Leaderboard";
import { Settings } from "./pages/Settings";
import { HoopBuzz } from "./pages/HoopBuzz";
import { Coaches } from "./pages/Coaches";

function ProtectedRoute({ children, reqRole }: any) {
  const { profile, loading } = useAuth();
  if (loading) return null; // Let the top level loading handle it

  if (reqRole && profile?.role !== reqRole) {
    return <Navigate to="/" replace />;
  }

  return children;
}

import { FreeDimes } from "./pages/FreeDimes";
import { LiveChat } from "./components/LiveChat";

function SportsbookView() {
  const { activeMatchups } = useBetting();
  return (
    <div className="grid grid-cols-1 lg:grid-cols-[1fr_340px] gap-8">
      <div className="space-y-6">
        <div className="flex items-end justify-between mb-2">
          <div>
            <h1 className="text-3xl font-black italic uppercase text-white">
              Active Markets
            </h1>
            <p className="text-white/40 text-sm font-medium">
              8 Teams • 14 Week Season • 4 Playoff Teams • Bo5 Playoff Rounds
            </p>
          </div>
          <div className="hidden sm:flex gap-2">
            <Link
              to="/schedule"
              className="px-4 py-2 glass-card text-xs font-bold uppercase hover:bg-white/5 transition-colors"
            >
              Schedule
            </Link>
            <Link
              to="/standings"
              className="px-4 py-2 glass-card text-xs font-bold uppercase hover:bg-white/5 transition-colors"
            >
              Standings
            </Link>
            <Link
              to="/results"
              className="px-4 py-2 glass-card text-xs font-bold uppercase hover:bg-white/5 transition-colors"
            >
              Results
            </Link>
            <Link
              to="/my-bets"
              className="px-4 py-2 glass-card text-xs font-bold uppercase hover:bg-white/5 transition-colors"
            >
              My Bets
            </Link>
          </div>
        </div>
        <div className="space-y-4">
          {activeMatchups.length === 0 ? (
            <div className="glass-card p-8 text-center text-white/40 font-bold uppercase italic">
              No active markets currently available.
            </div>
          ) : (
            activeMatchups.map((matchup) => (
              <MatchupCard key={matchup.id} matchup={matchup} />
            ))
          )}
        </div>
      </div>

      <div className="hidden lg:block relative">
        <div className="sticky top-24">
          <BetSlip />
        </div>
      </div>
      <LiveChat />
    </div>
  );
}

function DashboardLayout({ children }) {
  const location = useLocation();
  let activeTab = "sportsbook";
  if (location.pathname === "/my-bets") activeTab = "mybets";
  else if (location.pathname.startsWith("/admin")) activeTab = "admin";
  else if (location.pathname === "/schedule") activeTab = "schedule";
  else if (location.pathname === "/standings") activeTab = "standings";
  else if (location.pathname === "/coaches") activeTab = "coaches";
  else if (location.pathname === "/results") activeTab = "results";
  else if (location.pathname === "/hoopbuzz") activeTab = "hoopbuzz";
  else if (location.pathname === "/leaderboard") activeTab = "leaderboard";

  return (
    <div className="min-h-screen flex flex-col bg-[#050608]">
      <Header activeTab={activeTab} />
      <main className="flex-1 max-w-7xl mx-auto w-full px-4 py-8">
        {children}
      </main>
    </div>
  );
}

function MainApp() {
  const { user, profile, loading } = useAuth();

  if (loading || (user && !profile)) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#050608]">
        <div className="w-8 h-8 rounded-full border-2 border-[#c1ff00] border-t-transparent animate-spin"></div>
      </div>
    );
  }

  if (!user) {
    return <Login />;
  }

  return (
    <BettingProvider>
      <BrowserRouter>
        <DashboardLayout>
          <Routes>
            <Route path="/" element={<SportsbookView />} />
            <Route path="/schedule" element={<Schedule />} />
            <Route path="/standings" element={<Standings />} />
            <Route path="/coaches" element={<Coaches />} />
            <Route path="/results" element={<Results />} />
            <Route path="/hoopbuzz" element={<HoopBuzz />} />
            <Route path="/free-dimes" element={<FreeDimes />} />
            <Route path="/my-bets" element={<MyBets />} />
            <Route path="/leaderboard" element={<Leaderboard />} />
            <Route 
              path="/settings" 
              element={
                <ProtectedRoute>
                  <Settings />
                </ProtectedRoute>
              } 
            />
            <Route
              path="/admin/*"
              element={
                <ProtectedRoute reqRole="admin">
                  <AdminPanel />
                </ProtectedRoute>
              }
            />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </DashboardLayout>
      </BrowserRouter>
    </BettingProvider>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <MainApp />
    </AuthProvider>
  );
}
