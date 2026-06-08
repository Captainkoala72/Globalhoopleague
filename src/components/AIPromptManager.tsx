import React, { useState, useEffect } from "react";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { db } from "../firebase";
import { Sparkles, Save, RotateCcw, AlertTriangle, CheckCircle2 } from "lucide-react";

const DEFAULT_SYSTEM_PROMPT = `You are a sharp Vegas oddsmaker. You must approach every matchup with an absolute mathematical baseline of 0-0. Do not automatically favor the away team or assume an implicit advantage. Evaluate home-court advantage strictly as a defined, isolated metric value (e.g., +2.5 to +3 points to the point spread for the home team, or a minor percentage bump to win probability), rather than letting it or any hidden bias skew the overall calculation mechanics. Analyze the matchup stats, consider betting trends, and output ONLY a JSON object containing a raw predicted win probability for the Home Team. No extra reasoning.`;

export function AIPromptManager() {
  const [systemPrompt, setSystemPrompt] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [status, setStatus] = useState<{ type: "success" | "error" | null; message: string | null }>({
    type: null,
    message: null,
  });

  useEffect(() => {
    async function loadPrompt() {
      setIsLoading(true);
      try {
        const docRef = doc(db, "config", "aiSettings");
        const docSnap = await getDoc(docRef);
        if (docSnap.exists() && docSnap.data().systemPrompt) {
          setSystemPrompt(docSnap.data().systemPrompt);
        } else {
          // Fallback if not set in db yet
          setSystemPrompt(DEFAULT_SYSTEM_PROMPT);
          // Auto-save the default in the database so it's initialized
          await setDoc(docRef, { systemPrompt: DEFAULT_SYSTEM_PROMPT });
        }
      } catch (err: any) {
        console.error("Error fetching rules/systemPrompt from Firestore:", err);
        setStatus({
          type: "error",
          message: `Failed to load rules: ${err.message || err}`,
        });
        // Still set to default to let them edit it
        setSystemPrompt(DEFAULT_SYSTEM_PROMPT);
      } finally {
        setIsLoading(false);
      }
    }
    loadPrompt();
  }, []);

  const handleSave = async () => {
    if (!systemPrompt.trim()) {
      setStatus({ type: "error", message: "Prompt cannot be empty!" });
      return;
    }
    setIsSaving(true);
    setStatus({ type: null, message: null });
    try {
      const docRef = doc(db, "config", "aiSettings");
      await setDoc(docRef, { systemPrompt: systemPrompt.trim() });
      setStatus({
        type: "success",
        message: "Live AI System Prompt successfully saved to Firestore!",
      });
      // Clear status after 4 seconds
      setTimeout(() => {
        setStatus({ type: null, message: null });
      }, 4000);
    } catch (err: any) {
      console.error("Error setting rules/systemPrompt in Firestore:", err);
      setStatus({
        type: "error",
        message: `Failed to save live prompt: ${err.message || err}`,
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleResetToDefault = () => {
    if (window.confirm("Are you sure you want to revert the text area to the default baseline prompt? (This won't save to the database until you click Save)")) {
      setSystemPrompt(DEFAULT_SYSTEM_PROMPT);
      setStatus({
        type: "success",
        message: "Reverted editor to baseline prompt! Click 'Save Live Prompt' to apply.",
      });
      setTimeout(() => {
        setStatus({ type: null, message: null });
      }, 4000);
    }
  };

  if (isLoading) {
    return (
      <div className="glass-card p-6 md:p-8 space-y-6 text-center">
        <div className="flex justify-center items-center gap-2">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-[#c1ff00]"></div>
          <span className="text-white/60 font-mono">Loading dynamic AI Configuration...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="glass-card p-6 md:p-8 space-y-6 border-l-4 border-l-[#c1ff00]">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/10 pb-4">
        <div>
          <h2 className="text-2xl font-black italic uppercase text-white mb-1 flex items-center gap-2">
            <Sparkles size={24} className="text-[#c1ff00]" /> AI Prompt Control Center
          </h2>
          <p className="text-white/40 font-medium text-sm">
            Tweak and scale the Gemini OddsCalculator logic live. Changes take effect instantly without code updates.
          </p>
        </div>
        <button
          onClick={handleResetToDefault}
          type="button"
          className="self-start sm:self-center px-4 py-2 bg-white/5 hover:bg-white/15 border border-white/10 text-white/80 font-bold uppercase italic rounded-lg text-xs transition-all flex items-center gap-2"
        >
          <RotateCcw size={14} /> Revert To Baseline
        </button>
      </div>

      {status.message && (
        <div
          className={`p-4 rounded-xl flex items-center gap-3 border transition-all ${
            status.type === "success"
              ? "bg-[#c1ff00]/10 border-[#c1ff00]/30 text-[#c1ff00]"
              : "bg-red-500/10 border-red-500/30 text-red-400"
          }`}
        >
          {status.type === "success" ? <CheckCircle2 size={18} /> : <AlertTriangle size={18} />}
          <div className="text-sm font-medium">{status.message}</div>
        </div>
      )}

      <div className="space-y-2">
        <label className="text-xs text-white/40 font-bold uppercase tracking-widest flex justify-between items-center">
          <span>System Prompt & Behavior Instructions</span>
          <span className="text-white/20 font-mono text-[10px] lowercase">
            {systemPrompt.length} characters
          </span>
        </label>
        <textarea
          id="system-prompt-textarea"
          value={systemPrompt}
          onChange={(e) => setSystemPrompt(e.target.value)}
          rows={18}
          className="w-full bg-black/40 border border-white/10 rounded-xl py-4 px-4 text-sm font-mono text-white/90 leading-relaxed focus:outline-none focus:border-[#c1ff00] transition-colors resize-y shadow-inner"
          placeholder="Enter AI system behavior instructions..."
          disabled={isSaving}
        />
      </div>

      <div className="bg-white/5 border border-white/10 rounded-xl p-4 flex gap-3 items-start">
        <Sparkles size={20} className="text-[#c1ff00] shrink-0 mt-0.5" />
        <div className="space-y-1">
          <h4 className="text-xs font-black uppercase text-white/80 tracking-wider">Dynamic Invalidation</h4>
          <p className="text-xs text-white/40 leading-relaxed">
            The OddsCalculator backend API performs an administrative fetch of this configuration on every compilation/generation request. Always make sure the instructions are well-formatted, complete, and instruct the model to return valid compact JSON.
          </p>
        </div>
      </div>

      <button
        onClick={handleSave}
        disabled={isSaving}
        type="button"
        className="w-full py-4 bg-[#c1ff00] text-black font-black uppercase italic rounded-xl text-lg hover:scale-[0.98] transition-all shadow-[0_0_15px_rgba(193,255,0,0.2)] flex justify-center items-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
      >
        <Save size={20} />
        {isSaving ? "Saving Live Prompt..." : "Save Live Prompt"}
      </button>
    </div>
  );
}
