import React, { useState } from "react";
import { useAuth } from "../context/AuthContext";
import { Trophy, AlertCircle } from "lucide-react";

export function Login() {
  const { login, signup, loading } = useAuth();
  const [isLoginView, setIsLoginView] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [authError, setAuthError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setAuthError("");
    setIsSubmitting(true);
    try {
      if (isLoginView) {
        await login(email, password);
      } else {
        await signup(email, password);
      }
    } catch (err) {
      console.error(err);
      // Clean up Firebase error messages for display
      const msg = err.message || "Authentication failed";
      setAuthError(msg.replace("Firebase:", "").trim());
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#050608]">
        <div className="w-8 h-8 rounded-full border-2 border-[#c1ff00] border-t-transparent animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#050608] px-4">
      <div className="glass-card max-w-md w-full p-8 flex flex-col items-center">
        <div className="w-16 h-16 bg-[#c1ff00] rounded-xl flex items-center justify-center mb-6 shadow-[0_0_30px_rgba(193,255,0,0.3)]">
          <Trophy size={32} className="text-black" />
        </div>
        <h1 className="text-3xl font-black italic uppercase text-white mb-2 text-center">
          Global Hoop Land
        </h1>
        <p className="text-white/40 font-medium mb-8 text-center text-sm">
          {isLoginView
            ? "Sign in to access your sportsbook."
            : "Create an account to start placing wagers."}
        </p>

        {authError && (
          <div className="w-full bg-red-900/40 border border-red-500/20 text-red-300 p-3 rounded-lg mb-6 flex items-start gap-2 text-xs font-medium leading-relaxed">
            <AlertCircle size={14} className="shrink-0 mt-0.5" />
            <span>{authError}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="w-full flex flex-col gap-4">
          <div className="flex flex-col gap-1">
            <label className="text-[10px] text-white/40 uppercase font-bold tracking-widest">
              Email Address
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="bg-black/40 border border-white/10 rounded-lg py-3 px-4 text-sm font-medium text-white focus:outline-none focus:border-[#c1ff00] transition-colors placeholder:text-white/20"
              placeholder="bettor@example.com"
            />
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-[10px] text-white/40 uppercase font-bold tracking-widest">
              Password
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="bg-black/40 border border-white/10 rounded-lg py-3 px-4 text-sm font-medium text-white focus:outline-none focus:border-[#c1ff00] transition-colors placeholder:text-white/20"
              placeholder="••••••••"
            />
          </div>
          <button
            type="submit"
            disabled={isSubmitting}
            className={`w-full py-4 mt-4 font-black uppercase italic rounded-xl text-lg transition-all focus:outline-none focus:ring-2 focus:ring-[#c1ff00] focus:ring-offset-2 focus:ring-offset-[#050608] ${
              isSubmitting
                ? "bg-white/10 text-white/40 cursor-not-allowed"
                : "bg-[#c1ff00] text-black hover:scale-[0.98] shadow-[0_0_15px_rgba(193,255,0,0.2)]"
            }`}
          >
            {isSubmitting
              ? "Processing..."
              : isLoginView
                ? "Sign In"
                : "Create Account"}
          </button>
        </form>

        <button
          type="button"
          onClick={() => {
            setIsLoginView(!isLoginView);
            setAuthError("");
          }}
          className="mt-6 text-xs font-bold text-white/40 hover:text-white uppercase transition-colors"
        >
          {isLoginView
            ? "Don't have an account? Sign Up"
            : "Already have an account? Sign In"}
        </button>
      </div>
    </div>
  );
}
