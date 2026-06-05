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

export const settleMatch = async (matchId, homeScore, awayScore) => {
  try {
    // Fetch match
    const matchRef = doc(db, "matches", matchId);
    const matchSnap = await getDoc(matchRef);
    if (!matchSnap.exists()) throw new Error("Match missing");
    const matchData = matchSnap.data();
    const homeTeamId = matchData.homeTeamId;
    const awayTeamId = matchData.awayTeamId;

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

    // Run a transaction to safely update user balances and write the rest
    await runTransaction(db, async (transaction) => {
      // 1. Read all users that need payouts
      const userRefs = Object.keys(userPayouts).map((uid) =>
        doc(db, "users", uid),
      );
      const userSnaps = await Promise.all(
        userRefs.map((ref) => transaction.get(ref)),
      );

      userSnaps.forEach((userSnap) => {
        if (userSnap.exists()) {
          const currentBalance = userSnap.data().balance || 0;
          const payoutAmount = userPayouts[userSnap.id];
          transaction.update(userSnap.ref, {
            balance: currentBalance + payoutAmount,
          });
        }
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
  } catch (error) {
    console.error("Error settling match: ", error);
    throw error;
  }
};
