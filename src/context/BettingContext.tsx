import React, { createContext, useContext, useState, useEffect } from "react";
import { INITIAL_TEAMS, INITIAL_WEIGHTS } from "../data";
import { useAuth } from "./AuthContext";
import {
  collection,
  doc,
  onSnapshot,
  setDoc,
  writeBatch,
  query,
  where,
  addDoc,
  increment,
  getDocs,
} from "firebase/firestore";
import { db } from "../firebase";

const BettingContext = createContext(undefined);

export function BettingProvider({ children }) {
  const { profile, updateBalance, user } = useAuth();
  const dimesBalance = profile ? profile.balance : 0;
  const [betSlip, setBetSlip] = useState([]);
  const [placedBets, setPlacedBets] = useState([]);
  const [teams, setTeams] = useState(INITIAL_TEAMS);
  const [weights, setWeights] = useState(INITIAL_WEIGHTS);
  const [matchups, setMatchups] = useState([]); // Keep this for legacy / calculation if needed
  const [rawMatches, setRawMatches] = useState([]);
  const [activeMatchups, setActiveMatchups] = useState([]);
  const [scheduledMatchups, setScheduledMatchups] = useState([]);
  const [settledMatchups, setSettledMatchups] = useState([]);

  // Public Real-time Firestore Listeners
  useEffect(() => {
    const unsubTeams = onSnapshot(
      collection(db, "teams"),
      (snapshot) => {
        if (!snapshot.empty) {
          const globalTeams = snapshot.docs.map((doc) => ({
            id: doc.id,
            ...doc.data(),
          } as any));
          setTeams(globalTeams);
        }
      },
      (error) => {
        console.error("Firestore Error Teams Sync:", error);
      },
    );

    const unsubSettings = onSnapshot(
      doc(db, "global", "settings"),
      (docSnap) => {
        if (docSnap.exists() && docSnap.data().formulaWeights) {
          setWeights(docSnap.data().formulaWeights);
        }
      },
      (error) => {
        console.error("Firestore Error Settings Sync:", error);
      },
    );

    const unsubMatches = onSnapshot(
      collection(db, "matches"),
      (snapshot) => {
        if (!snapshot.empty) {
          const globalMatches = snapshot.docs.map((doc) => ({
            id: doc.id,
            ...doc.data(),
          }));
          setRawMatches(globalMatches);
        } else {
          setRawMatches([]);
        }
      },
      (error) => {
        console.error("Firestore Error Matches Sync:", error);
      },
    );

    return () => {
      unsubTeams();
      unsubSettings();
      unsubMatches();
    };
  }, []);

  // Private Real-time Firestore Listeners
  useEffect(() => {
    if (!user) {
      setPlacedBets([]);
      return;
    }

    const q = query(collection(db, "bets"), where("userId", "==", user.uid));
    const unsubBets = onSnapshot(
      q,
      (snapshot) => {
        if (!snapshot.empty) {
          const globalBets = snapshot.docs.map((doc) => ({
            id: doc.id,
            ...doc.data(),
          } as any));
          setPlacedBets(globalBets.sort((a, b) => b.timestamp - a.timestamp));
        } else {
          setPlacedBets([]);
        }
      },
      (error) => {
        console.error("Firestore Error Bets Sync:", error);
      },
    );

    return () => {
      unsubBets();
    };
  }, [user]);

  useEffect(() => {
    // Regenerate active/scheduled matchups when rawMatches or teams change
    if (teams.length === 0) return;

    const formattedMatchups = [];
    const scheduled = [];
    const settled = [];

    rawMatches.forEach((rm) => {
      const homeTeam = teams.find((t) => t.id === rm.homeTeamId);
      const awayTeam = teams.find((t) => t.id === rm.awayTeamId);
      if (!homeTeam || !awayTeam) return;

      const m = {
        id: rm.id,
        homeTeam,
        awayTeam,
        startTime: rm.date,
        week: rm.week,
        status: rm.status,
        homeScore: rm.homeScore,
        awayScore: rm.awayScore,
        homeWinProb: rm.homeWinProb || 0,
        awayWinProb: rm.awayWinProb || 0,
        spreadHome: rm.spreadHome || {
          id: "",
          type: "spread",
          teamId: "",
          label: "",
          americanOdds: 0,
        },
        spreadAway: rm.spreadAway || {
          id: "",
          type: "spread",
          teamId: "",
          label: "",
          americanOdds: 0,
        },
        moneylineHome: rm.moneylineHome || {
          id: "",
          type: "moneyline",
          teamId: "",
          label: "",
          americanOdds: 0,
        },
        moneylineAway: rm.moneylineAway || {
          id: "",
          type: "moneyline",
          teamId: "",
          label: "",
          americanOdds: 0,
        },
      };

      if (rm.status === "active") {
        formattedMatchups.push(m);
      } else if (rm.status === "scheduled") {
        scheduled.push(m);
      } else if (rm.status === "settled" || rm.status === "cancelled") {
        settled.push(m);
      }
    });

    setActiveMatchups(formattedMatchups);
    setScheduledMatchups(
      scheduled.sort(
        (a, b) =>
          new Date(a.startTime).getTime() - new Date(b.startTime).getTime(),
      ),
    );
    setSettledMatchups(
      settled.sort(
        (a, b) =>
          new Date(b.startTime).getTime() - new Date(a.startTime).getTime(),
      ),
    );
    // Also update legacy matchups for any component relying on it (for backward compatibility if needed)
    setMatchups(formattedMatchups);
  }, [rawMatches, teams]);

  // Admin Write Operations
  const updateTeams = async (newTeams) => {
    if (profile?.role !== "admin") return;
    try {
      const batch = writeBatch(db);
      newTeams.forEach((team) => {
        const ref = doc(db, "teams", team.id);
        const { id, ...data } = team;
        batch.set(ref, data);
      });
      await batch.commit();
    } catch (e) {
      console.error("Error updating teams in Firestore", e);
    }
  };

  const updateWeights = async (newWeights) => {
    if (profile?.role !== "admin") return;
    try {
      await setDoc(doc(db, "global", "settings"), {
        formulaWeights: newWeights,
      });
    } catch (e) {
      console.error("Error updating weights in Firestore", e);
    }
  };

  const resetToDefaults = async () => {
    if (profile?.role !== "admin") return;
    await updateTeams(INITIAL_TEAMS);
    await updateWeights(INITIAL_WEIGHTS);
  };

  const cancelMatch = async (matchId: string) => {
    if (profile?.role !== "admin") return;
    try {
      const batch = writeBatch(db);
      
      // Step A: Cancel the match
      const matchRef = doc(db, "matches", matchId);
      batch.update(matchRef, { status: "cancelled" });

      // Step B: Query bets for this match
      const betsQuery = query(collection(db, "bets"), where("matchupId", "==", matchId));
      const betsSnapshot = await getDocs(betsQuery);

      if (!betsSnapshot.empty) {
        // Step C & D: Update bets and refund users
        betsSnapshot.forEach((betDoc) => {
          const betData = betDoc.data();
          if (betData.status !== "refunded") {
            const betRef = doc(db, "bets", betDoc.id);
            batch.update(betRef, { status: "refunded" });
            
            // Refund user balance
            if (betData.userId && betData.stake) {
              const userRef = doc(db, "users", betData.userId);
              batch.update(userRef, { balance: increment(betData.stake) });
            }
          }
        });
      }

      await batch.commit();
    } catch (error) {
      console.error("Firebase Batch Error:", error);
      throw error;
    }
  };

  const getTeamById = (id) => teams.find((t) => t.id === id);

  const addToBetSlip = (matchup, selection) => {
    setBetSlip((prev) => {
      const exists = prev.find((item) => item.selection.id === selection.id);
      if (exists) return prev;
      const team = getTeamById(selection.teamId);
      return [
        ...prev,
        {
          id: `slip_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          matchupId: matchup.id,
          selection,
          matchupTitle: `${matchup.awayTeam.name} @ ${matchup.homeTeam.name}`,
          selectedTeamName: team?.name || "Unknown Team",
        },
      ];
    });
  };

  const removeFromBetSlip = (itemId) => {
    setBetSlip((prev) => prev.filter((item) => item.id !== itemId));
  };

  const clearBetSlip = () => setBetSlip([]);

  const placeBet = async (stake, itemId) => {
    const item = betSlip.find((b) => b.id === itemId);
    if (!item) return;

    if (stake > dimesBalance) {
      alert("Insufficient Dimes!");
      return;
    }

    let payout = 0;
    const odds = item.selection.americanOdds;
    if (odds > 0) {
      payout = stake + (stake * odds) / 100;
    } else {
      payout = stake + (stake * 100) / Math.abs(odds);
    }

    const newBetData = {
      userId: user?.uid,
      matchupId: item.matchupId,
      selection: item.selection,
      matchupTitle: item.matchupTitle,
      selectedTeamName: item.selectedTeamName,
      stake,
      potentialPayout: Number(payout.toFixed(2)),
      status: "open",
      timestamp: Date.now(),
      item, // keeping item around for ease in UI later if needed, but the main schema uses top level properties
    };

    try {
      await addDoc(collection(db, "bets"), newBetData);
      await updateBalance(dimesBalance - stake);
      removeFromBetSlip(itemId);
    } catch (e) {
      console.error("Error placing bet in Firestore", e);
      alert("Failed to place bet. Try again.");
    }
  };

  return (
    <BettingContext.Provider
      value={{
        balance: dimesBalance,
        dimesBalance,
        betSlip,
        placedBets,
        teams,
        weights,
        matchups,
        activeMatchups,
        scheduledMatchups,
        settledMatchups,
        addToBetSlip,
        removeFromBetSlip,
        clearBetSlip,
        placeBet,
        getTeamById,
        updateTeams,
        updateWeights,
        resetToDefaults,
        cancelMatch,
      }}
    >
      {children}
    </BettingContext.Provider>
  );
}

export function useBetting() {
  const context = useContext(BettingContext);
  if (context === undefined) {
    throw new Error("useBetting must be used within a BettingProvider");
  }
  return context;
}
