import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import { db } from "../firebase";

const AUTHORS = [
  {
    name: "OG Jackson",
    handle: "@THE_OG_JACKSON",
    persona: "Tough, straight to the point, appreciates defensive and low-scoring games, talks smack about people who chose losing bets. You MUST look at the recentUserBets array, target users who lost their bets on this match, and talk heavy smack, calling out their bad reads. Brutally criticize coaches who had low Leadership/Motivation if their team choked, or praise hard-nosed Defensive Minded coaches.",
  },
  {
    name: "Penny Summers",
    handle: "@PennySummers",
    persona: "Smart, likes analytics, generally roots for the favorite to win, a little nerdy, but cute. You MUST focus on the oddsCalculatorData you are given. You should nerd out over whether the match outcome aligned with the High-Thinking AI's projection, critique or praise the admin's chosen aiWeight setting, and use analytics to justify why the favorite won or fell short. Occasionally analyze the coaching matchup, pointing out how a specific Archetype or Offensive Focus led to the win or loss.",
  },
  {
    name: "Arthur Owens",
    handle: "@Art_THEMAN_Owens",
    persona: "Loose, loved by fans, writes fun reports, roots for the underdog, and always supports those who win their bets. You MUST look at the recentUserBets array, find the users who won big, and hype them up by name. Celebrate the underdogs and the absolute chaotic, fun moments of the match. Hype up highly Motivated coaches who led their underdogs to victory.",
  },
];

export async function generateHoopBuzzPost(matchDetails: any) {
  try {
    const author = AUTHORS[Math.floor(Math.random() * AUTHORS.length)];

    const prompt = `
      You are ${author.name} (${author.handle}). Your persona is: ${author.persona}.
      Write a concise, punchy social media post covering the following sports betting match outcome:
      
      Match Details:
      Winner: ${matchDetails.winner}
      Loser: ${matchDetails.loser}
      Final Score: ${matchDetails.homeScore} - ${matchDetails.awayScore}
      Home Team: ${matchDetails.homeTeam}
      Away Team: ${matchDetails.awayTeam}
      
      Analytics Data:
      ${JSON.stringify(matchDetails.oddsCalculatorData || {})}
      
      Coaching Data:
      Home Coach: ${JSON.stringify(matchDetails.homeCoach || {})}
      Away Coach: ${JSON.stringify(matchDetails.awayCoach || {})}
      
      Recent User Bets:
      ${JSON.stringify((matchDetails.recentUserBets || []).slice(0, 10))}
      
      Instructions:
      You have permission to "tag" users in your short social media posts by writing their name with an @ symbol (e.g., "Shoutout to @BigBettor99 for hitting that crazy parlay!" or "Can someone check on @SpreadSweeper? That buzzer-beater just ruined his night."). You MUST use the user's custom database displayName from the Recent User Bets array.
      
      Write the post as if it's going right onto 'HoopBuzz', our micro-blogging social media platform.
      Make it engaging, strictly in character, and VERY SHORT (max 280-400 characters). Format it like a tweet, use hashtags if appropriate. DO NOT output anything other than the post text itself.
    `;

    // Note: Due to security guidelines, the @google/genai SDK is called server-side via this proxy endpoint.
    let data: any;
    try {
      const response = await fetch("/api/generate-news", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt }),
      });

      const contentType = response.headers.get("content-type");
      if (response.ok && contentType && contentType.includes("application/json")) {
        data = await response.json();
      } else {
        const errorText = await response.text().catch(() => "Unknown error");
        throw new Error(`Backend generated response error: ${errorText}`);
      }
    } catch (err) {
      console.warn("Backend unavailable or returned error, executing local rule-based template fallback:", err);
      
      const winnerTeam = matchDetails.winner || "the winner";
      const loserTeam = matchDetails.loser || "the opponent";
      const scoreString = matchDetails.homeScore && matchDetails.awayScore 
        ? `${matchDetails.homeScore} - ${matchDetails.awayScore}`
        : "a absolute thriller";
      
      let fallbackText = "";
      if (author.name === "OG Jackson") {
        fallbackText = `What a absolute slugfest! ${winnerTeam} takes down ${loserTeam} (${scoreString}). If you bet your hard-earned dimes on ${loserTeam}, you should delete your account because that was a terrible read! Back to the drawing board! #GHL #VegasLines`;
      } else if (author.name === "Penny Summers") {
        fallbackText = `The data matches what we saw on the hardwood. ${winnerTeam} matches up nicely and secures the win over ${loserTeam} (${scoreString}). This honors our baseline mathematical predictions. A highly calculated victory! #HoopBuzz #Analytics`;
      } else { // Arthur Owens
        fallbackText = `What an absolute thriller of a game! ${winnerTeam} takes the victory against ${loserTeam} with a final score of ${scoreString}! Massive shoutout to everyone who believed and successfully cleared their wagers today! Let's go! #UnderdogMindset`;
      }
      
      data = { text: fallbackText };
    }
    
    // Check if we got text back
    if (!data || !data.text) {
        throw new Error("Failed to extract article text from generation API");
    }

    // Save to Firestore
    await addDoc(collection(db, "hoopbuzz_posts"), {
      articleText: data.text,
      authorName: author.name,
      authorHandle: author.handle,
      matchId: matchDetails.matchId,
      timestamp: serverTimestamp(),
      swishes: 0,
      bricks: 0,
      replies: []
    });

    console.log("HoopBuzz post generated and saved successfully.");
  } catch (error) {
    console.error("News Generation Error:", error);
  }
}
