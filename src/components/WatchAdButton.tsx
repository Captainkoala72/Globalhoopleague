import React, { useState, useEffect, useRef } from "react";
import { useAuth } from "../context/AuthContext";
import { doc, updateDoc, increment } from "firebase/firestore";
import { db } from "../firebase";
import { Play } from "lucide-react";

declare global {
  interface Window {
    googletag: any;
  }
}

export function WatchAdButton() {
  const { user } = useAuth();
  const [adState, setAdState] = useState<"loading" | "ready" | "processing">("loading");
  const showAdRef = useRef<(() => void) | null>(null);
  const slotRef = useRef<any>(null);

  useEffect(() => {
    // 1. Inject GPT Script if not already present
    if (!document.querySelector('script[src="https://securepubads.g.doubleclick.net/tag/js/gpt.js"]')) {
      const script = document.createElement("script");
      script.src = "https://securepubads.g.doubleclick.net/tag/js/gpt.js";
      script.async = true;
      document.head.appendChild(script);
    }

    // Initialize googletag
    window.googletag = window.googletag || { cmd: [] };

    let definedSlot: any = null;

    window.googletag.cmd.push(() => {
      // 2. Define out-of-page rewarded ad slot
      definedSlot = window.googletag.defineOutOfPageSlot(
        "/1234567/rewarded_ad_unit",
        window.googletag.enums.OutOfPageFormat.REWARDED
      );

      if (definedSlot) {
        slotRef.current = definedSlot;
        definedSlot.addService(window.googletag.pubads());

        // Listen for rewardedSlotReady: enable button
        window.googletag.pubads().addEventListener("rewardedSlotReady", (event: any) => {
          if (event.slot === slotRef.current) {
            showAdRef.current = event.makeRewardedVisible;
            setAdState("ready");
          }
        });

        // Listen for rewardedSlotGranted: reward user
        window.googletag.pubads().addEventListener("rewardedSlotGranted", async (event: any) => {
          if (event.slot === slotRef.current) {
            setAdState("processing");
            if (user) {
              try {
                const userRef = doc(db, "users", user.uid);
                await updateDoc(userRef, { balance: increment(100) });
              } catch (error) {
                console.error("Failed to add reward:", error);
              }
            }
          }
        });

        // Listen for rewardedSlotClosed: reset UI and request new ad
        window.googletag.pubads().addEventListener("rewardedSlotClosed", (event: any) => {
          if (event.slot === slotRef.current) {
            setAdState("loading");
            showAdRef.current = null;
            
            // Destroy the old slot
            window.googletag.destroySlots([slotRef.current]);

            // Re-request a new ad slot
            const newSlot = window.googletag.defineOutOfPageSlot(
              "/1234567/rewarded_ad_unit",
              window.googletag.enums.OutOfPageFormat.REWARDED
            );
            if (newSlot) {
              slotRef.current = newSlot;
              newSlot.addService(window.googletag.pubads());
              window.googletag.display(newSlot);
            }
          }
        });

        window.googletag.enableServices();
        window.googletag.display(definedSlot);
      }
    });

    return () => {
      if (window.googletag && window.googletag.cmd) {
        window.googletag.cmd.push(() => {
          if (slotRef.current) {
            window.googletag.destroySlots([slotRef.current]);
          }
        });
      }
    };
  }, [user]);

  const handleWatchClick = () => {
    if (adState === "ready" && showAdRef.current) {
      showAdRef.current();
    }
  };

  return (
    <button
      onClick={handleWatchClick}
      disabled={adState !== "ready"}
      className={`glass-card px-4 py-3 flex items-center justify-center gap-2 rounded-xl font-bold uppercase text-xs tracking-widest transition-all border border-white/10 ${
        adState === "ready"
          ? "hover:bg-[#c1ff00]/10 text-white hover:border-[#c1ff00]/40 shadow-[0_4px_20px_rgba(0,0,0,0.5)] cursor-pointer"
          : "text-white/40 cursor-not-allowed opacity-70"
      }`}
    >
      {adState === "loading" && (
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full border-2 border-t-transparent border-white/40 animate-spin" />
          <span>Loading Ad...</span>
        </div>
      )}
      {adState === "ready" && (
        <>
          <Play size={14} className="text-[#c1ff00] fill-current" />
          <span>Watch Video for 100 Dimes</span>
        </>
      )}
      {adState === "processing" && (
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full border-2 border-t-transparent border-[#c1ff00] animate-spin" />
          <span className="text-[#c1ff00]">Processing...</span>
        </div>
      )}
    </button>
  );
}
