import {
  collection,
  getDocs,
  query,
  where,
  doc,
  getDoc,
  runTransaction,
} from "firebase/firestore";
import { db } from "../firebase";
import { generateHoopBuzzPost } from "./generateNews";

export const settleMatch = async (matchId, homeScore, awayScore) => {
  try {
    // Fetch match
    const matchRef = doc(db, "matches", matchId);
    const matchSnap = await getDoc(matchRef);
    if (!matchSnap.exists()) throw new Error("Match missing");
    const matchData = matchSnap.data();
    const homeTeamId = matchData.homeTeamId;
    const awayTeamId = matchData.awayTeamId;

    // Fetch team names
    const homeTeamSnap = await getDoc(doc(db, "teams", homeTeamId));
    const awayTeamSnap = await getDoc(doc(db, "teams", awayTeamId));
    const homeTeamName = homeTeamSnap.exists() ? homeTeamSnap.data().name : homeTeamId;
    const awayTeamName = awayTeamSnap.exists() ? awayTeamSnap.data().name : awayTeamId;

    const winner = homeScore > awayScore ? homeTeamName : (awayScore > homeScore ? awayTeamName : "Tie");
    const loser = homeScore > awayScore ? awayTeamName : (awayScore > homeScore ? homeTeamName : "Tie");

    // Fetch bets
    const betsQuery = query(
      collection(db, "bets"),
      where("matchupId", "==", matchId),
      where("status", "==", "open"),
    );
    const betsSnap = await getDocs(betsQuery);

    // Group bets by userId to calculate balance increments
    const userPayouts = {};
    const betUpdates = [];

    betsSnap.forEach((betDoc) => {
      const bet = betDoc.data();
      let isWin = false;
      let isPush = false;

      const isHome = bet.item.selection.teamId === homeTeamId;
      const teamScore = isHome ? homeScore : awayScore;
      const oppScore = isHome ? awayScore : homeScore;

      if (bet.item.selection.type === "moneyline") {
        if (teamScore > oppScore) isWin = true;
        else if (teamScore === oppScore) isPush = true;
      } else if (bet.item.selection.type === "spread") {
        const spreadValue = parseFloat(bet.item.selection.label);
        const adjustedScore = teamScore + spreadValue;

        if (adjustedScore > oppScore) isWin = true;
        else if (adjustedScore === oppScore) isPush = true;
      }

      let actualPayout = 0;
      let newStatus = "lost";

      if (isWin) {
        newStatus = "won";
        actualPayout = bet.potentialPayout;
      } else if (isPush) {
        newStatus = "push";
        actualPayout = bet.stake; // refund
      }

      betUpdates.push({
        ref: betDoc.ref,
        data: {
          status: newStatus,
          actualPayout,
          homeScore,
          awayScore,
        },
      });

      if (actualPayout > 0) {
        userPayouts[bet.userId] = (userPayouts[bet.userId] || 0) + actualPayout;
      }
    });

    const recentUserBets: any[] = [];
    const allUserIds = Array.from(new Set(betsSnap.docs.map((d) => d.data().userId)));
    const uidToName: Record<string, string> = {};

    // Run a transaction to safely update user balances and write the rest
    await runTransaction(db, async (transaction) => {
      // 1. Read all users who bet
      const userRefs = allUserIds.map((uid) => doc(db, "users", uid));
      const userSnaps = await Promise.all(userRefs.map((ref) => transaction.get(ref)));

      userSnaps.forEach((userSnap) => {
        if (userSnap.exists()) {
          const ud = userSnap.data();
          uidToName[userSnap.id] = ud.displayName || ud.username || "Anonymous Bettor";
          
          if (userPayouts[userSnap.id]) {
            const currentBalance = ud.balance || 0;
            const payoutAmount = userPayouts[userSnap.id];
            transaction.update(userSnap.ref, {
              balance: currentBalance + payoutAmount,
            });
          }
        }
      });

      // Populate recentUserBets
      betsSnap.docs.forEach((betDoc) => {
        const bd = betDoc.data();
        const betUpdated = betUpdates.find((bu) => bu.ref.id === betDoc.id);
        const st = betUpdated ? betUpdated.data.status : bd.status;
        recentUserBets.push({
          displayName: uidToName[bd.userId] || "Anonymous Bettor",
          stake: bd.stake,
          type: bd.selection?.type || "unknown",
          team: bd.selectedTeamName || "unknown",
          status: st, // 'won', 'lost', 'push'
        });
      });

      // 2. Update bets
      betUpdates.forEach((update) => {
        transaction.update(update.ref, update.data);
      });

      // 3. Update match
      transaction.update(matchRef, {
        status: "settled",
        homeScore,
        awayScore,
      });
    });

    // Extract odds data
    const oddsCalculatorData = matchData.oddsCalculatorData || {
        baseWinProb: matchData.homeWinProb,
        aiWinProb: null,
        aiWeight: 0
    };
    oddsCalculatorData.spreadHome = matchData.spreadHome?.label;
    oddsCalculatorData.spreadAway = matchData.spreadAway?.label;
    oddsCalculatorData.moneylineHome = matchData.moneylineHome?.label;
    oddsCalculatorData.moneylineAway = matchData.moneylineAway?.label;

    // Fetch Home and Away Coaches
    const coachesSnap = await getDocs(collection(db, "coaches"));
    const coachesData = coachesSnap.docs.map(d => ({id: d.id, ...d.data()}));
    const homeCoach = coachesData.find((c: any) => c.teamName === homeTeamName);
    const awayCoach = coachesData.find((c: any) => c.teamName === awayTeamName);

    // Trigger AI News Generation asynchronously
    generateHoopBuzzPost({
       matchId,
       homeScore,
       awayScore,
       homeTeam: homeTeamName,
       awayTeam: awayTeamName,
       homeCoach,
       awayCoach,
       winner,
       loser,
       oddsCalculatorData,
       recentUserBets
    });

  } catch (error) {
    console.error("Error settling match: ", error);
    throw error;
  }
};
