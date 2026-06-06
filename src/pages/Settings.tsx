import { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import { doc, getDoc, updateDoc } from "firebase/firestore";
import { db } from "../firebase";

export function Settings() {
  const { user } = useAuth();
  const [displayName, setDisplayName] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ text: string, type: "success" | "error" } | null>(null);

  useEffect(() => {
    const fetchProfile = async () => {
      if (user) {
        try {
          const userDoc = await getDoc(doc(db, "users", user.uid));
          if (userDoc.exists()) {
            const data = userDoc.data();
            if (data.displayName) {
              setDisplayName(data.displayName);
            }
          }
        } catch (error) {
          console.error("Error fetching user stats:", error);
        }
      }
    };
    fetchProfile();
  }, [user]);

  const handleSave = async () => {
    if (!user) return;
    setLoading(true);
    setMessage(null);
    try {
      await updateDoc(doc(db, "users", user.uid), {
        displayName: displayName.trim()
      });
      setMessage({ text: "Profile settings saved successfully.", type: "success" });
      setTimeout(() => setMessage(null), 3000);
    } catch (error) {
      console.error("Error saving display name:", error);
      setMessage({ text: "Failed to save profile settings.", type: "error" });
    }
    setLoading(false);
  };

  return (
    <div className="max-w-xl mx-auto space-y-6">
      <div>
        <h1 className="text-3xl font-black italic uppercase text-white">Profile Settings</h1>
        <p className="text-white/40 text-sm font-medium">Update your account preferences.</p>
      </div>

      <div className="glass-card p-6 flex flex-col gap-4">
        {message && (
          <div className={`p-4 rounded-lg font-bold text-sm uppercase tracking-widest ${
            message.type === "success" 
              ? "bg-[#c1ff00]/10 border border-[#c1ff00]/20 text-[#c1ff00]" 
              : "bg-red-500/10 border border-red-500/20 text-red-500"
          }`}>
            {message.text}
          </div>
        )}

        <div className="flex flex-col gap-2">
          <label htmlFor="displayName" className="text-white/80 font-bold uppercase tracking-widest text-xs">
            Display Name (Leaderboard)
          </label>
          <input
            id="displayName"
            type="text"
            className="bg-black/40 border border-white/10 rounded-lg p-3 text-white focus:outline-none focus:border-[#c1ff00]/50 max-w-sm"
            placeholder="e.g. HoopKing99"
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
          />
          <p className="text-white/40 text-[10px] uppercase font-bold tracking-widest mt-1">
            This name will be displayed publicly on the leaderboard.
          </p>
        </div>

        <div className="pt-4 border-t border-white/10 mt-2">
          <button
            onClick={handleSave}
            disabled={loading}
            className="px-6 py-3 bg-[#c1ff00] text-black hover:bg-[#c1ff00]/80 rounded-lg font-black uppercase italic text-sm tracking-widest sm:w-auto w-full disabled:opacity-50 transition-colors"
          >
            {loading ? "Saving..." : "Save Changes"}
          </button>
        </div>
      </div>
    </div>
  );
}
