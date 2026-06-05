import { doc, getDoc, updateDoc } from "firebase/firestore";
import { db } from "../firebase";

export async function processAdReward(userId) {
  const userRef = doc(db, "users", userId);
  const userSnap = await getDoc(userRef);

  if (!userSnap.exists()) {
    throw new Error("User not found");
  }

  const data = userSnap.data();
  const now = Date.now();
  const lastAd = data.lastAdWatchedAt || 0;

  if (now < lastAd + 300000) {
    throw new Error(
      "Cooldown active. You can only watch an ad once every 5 minutes.",
    );
  }

  await updateDoc(userRef, {
    balance: (data.balance || 0) + 100,
    lastAdWatchedAt: now,
  });

  return true;
}
