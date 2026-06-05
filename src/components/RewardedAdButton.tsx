import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { PlayCircle } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { processAdReward } from "../utils/rewardsEngine";

export function RewardedAdButton() {
  const { user, profile } = useAuth();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [adState, setAdState] = useState("idle");
  const [timeLeft, setTimeLeft] = useState(15);
  const [errorMsg, setErrorMsg] = useState("");

  const [toastMessage, setToastMessage] = useState(null);

  const showToast = (title, desc, type) => {
    setToastMessage({ title, desc, type });
    setTimeout(() => setToastMessage(null), 4000);
  };

  const handleOpenAd = () => {
    const now = Date.now();
    const lastAd = profile?.lastAdWatchedAt || 0;
    if (now < lastAd + 300000) {
      const remainingMinutes = Math.ceil((lastAd + 300000 - now) / 60000);
      showToast(
        "Cooldown Active",
        `Please wait ${remainingMinutes} more minute(s) before earning another reward.`,
        "error",
      );
      return;
    }

    setIsModalOpen(true);
    setAdState("idle");
    setTimeLeft(15);
    setErrorMsg("");
  };

  const handleStartAd = () => {
    setAdState("playing");
  };

  useEffect(() => {
    let timer;
    if (adState === "playing" && timeLeft > 0) {
      timer = setInterval(() => {
        setTimeLeft((prev) => prev - 1);
      }, 1000);
    } else if (adState === "playing" && timeLeft === 0) {
      // Ad finished
      handleReward();
    }
    return () => clearInterval(timer);
  }, [adState, timeLeft]);

  const handleReward = async () => {
    if (!user) return;
    try {
      await processAdReward(user.uid);
      setAdState("rewarded");
      showToast(
        "Deposit Complete",
        "+100 $Dimes added to your wallet!",
        "success",
      );
    } catch (e) {
      setErrorMsg(e.message || "Failed to process ad reward.");
      setAdState("idle"); // revert so they can close
    }
  };

  return (
    <>
      {toastMessage && (
        <div
          className="fixed top-4 right-4 z-[200] max-w-sm w-full p-4 rounded-xl border backdrop-blur-xl animate-in slide-in-from-top-4 fade-in duration-300"
          style={{
            backgroundColor:
              toastMessage.type === "success"
                ? "rgba(193, 255, 0, 0.1)"
                : "rgba(239, 68, 68, 0.1)",
            borderColor:
              toastMessage.type === "success"
                ? "rgba(193, 255, 0, 0.3)"
                : "rgba(239, 68, 68, 0.3)",
          }}
        >
          <div className="flex items-start gap-3">
            <div
              className={`mt-1 h-2 w-2 rounded-full ${toastMessage.type === "success" ? "bg-[#c1ff00] shadow-[0_0_8px_rgba(193,255,0,0.8)]" : "bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.8)]"}`}
            ></div>
            <div>
              <h4
                className={`text-sm font-black italic uppercase ${toastMessage.type === "success" ? "text-[#c1ff00]" : "text-red-500"}`}
              >
                {toastMessage.title}
              </h4>
              <p className="text-white/80 text-xs mt-1 font-medium">
                {toastMessage.desc}
              </p>
            </div>
          </div>
        </div>
      )}

      <button
        onClick={handleOpenAd}
        className="w-full sm:w-auto px-6 py-3 bg-gradient-to-r from-[#c1ff00]/20 to-transparent border border-[#c1ff00]/50 rounded-xl flex items-center justify-center sm:justify-start gap-3 hover:bg-[#c1ff00]/30 transition-colors group"
      >
        <PlayCircle className="text-[#c1ff00] group-hover:scale-110 transition-transform" />
        <div className="flex flex-col items-start">
          <span className="text-white font-black italic uppercase leading-none">
            Watch Ad
          </span>
          <span className="text-[#c1ff00] text-xs font-bold font-mono">
            +100 $Dimes
          </span>
        </div>
      </button>

      <AnimatePresence>
        {isModalOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/90 backdrop-blur-md"
          >
            <motion.div
              initial={{ scale: 0.95, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 20 }}
              className="bg-[#111] border border-white/10 rounded-2xl p-6 md:p-10 w-full max-w-lg text-center flex flex-col items-center justify-center min-h-[300px] relative overflow-hidden"
            >
              {adState === "idle" && (
                <div className="space-y-6">
                  <div className="w-16 h-16 bg-[#c1ff00]/10 rounded-full flex items-center justify-center mx-auto text-[#c1ff00]">
                    <PlayCircle size={32} />
                  </div>
                  <div>
                    <h3 className="text-2xl font-black italic uppercase text-white mb-2">
                      Watch an Advertisement
                    </h3>
                    <p className="text-white/60 text-sm">
                      Support the platform and earn 100 $Dimes.
                    </p>
                  </div>
                  {errorMsg && (
                    <div className="bg-red-500/10 text-red-500 text-sm font-bold p-3 rounded-lg border border-red-500/20">
                      {errorMsg}
                    </div>
                  )}
                  <div className="flex gap-4 w-full">
                    <button
                      onClick={() => setIsModalOpen(false)}
                      className="flex-1 py-3 bg-white/5 text-white/60 hover:text-white font-bold rounded-xl transition-colors uppercase tracking-widest text-sm"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleStartAd}
                      className="flex-1 py-3 bg-[#c1ff00] text-black font-black uppercase italic rounded-xl hover:scale-[1.02] transition-transform"
                    >
                      Play Video
                    </button>
                  </div>
                </div>
              )}

              {adState === "playing" && (
                <div className="space-y-6">
                  {/* Fake video player box */}
                  <div className="w-full aspect-video bg-black rounded-lg border border-white/5 flex items-center justify-center relative overflow-hidden">
                    <div className="absolute inset-0 bg-gradient-to-br from-blue-900/40 to-purple-900/40 animate-pulse"></div>
                    <div className="relative z-10 flex flex-col items-center">
                      <span className="text-[#c1ff00] font-black text-4xl mb-2">
                        {timeLeft}s
                      </span>
                      <span className="text-white/40 font-bold uppercase tracking-widest text-xs">
                        Advertisement showing...
                      </span>
                    </div>
                  </div>
                </div>
              )}

              {adState === "rewarded" && (
                <div className="space-y-6">
                  <div className="w-20 h-20 bg-[#c1ff00]/20 rounded-full flex items-center justify-center mx-auto text-[#c1ff00] shadow-[0_0_30px_rgba(193,255,0,0.3)]">
                    <span className="font-black text-2xl">+100</span>
                  </div>
                  <div>
                    <h3 className="text-3xl font-black italic uppercase text-white mb-2">
                      Reward Unlocked!
                    </h3>
                    <p className="text-[#c1ff00] font-mono font-bold">
                      +100 $Dimes deposited to your wallet.
                    </p>
                  </div>
                  <button
                    onClick={() => setIsModalOpen(false)}
                    className="w-full py-4 bg-white/10 text-white hover:bg-white/20 font-bold uppercase tracking-widest rounded-xl transition-colors"
                  >
                    Close & Continue
                  </button>
                </div>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
