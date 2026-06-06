import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import { db } from "../firebase";

const AUTHORS = [
  {
    name: "OG Jackson",
    handle: "@THE_OG_JACKSON",
    persona: "Tough, straight to the point, appreciates defensive and low-scoring games, talks smack about people who chose losing bets.",
  },
  {
    name: "Penny Summers",
    handle: "@PennySummers",
    persona: "Smart, likes analytics, generally roots for the favorite to win, a little nerdy, but cute.",
  },
  {
    name: "Arthur Owens",
    handle: "@Art_THEMAN_Owens",
    persona: "Loose, loved by fans, writes fun reports, roots for the underdog, and always supports those who win their bets.",
  },
];

export async function generateMatchNews(matchDetails: any) {
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
      
      Write the post as if it's going right onto 'HoopBuzz', our micro-blogging social media platform (like Twitter/X).
      Point out anything out of the ordinary (e.g., massive upsets, close games, huge bet wins/losses).
      Make it engaging, strictly in character, and VERY SHORT (max 280-400 characters). Format it like a tweet, use hashtags if appropriate.
    `;

    // Note: Due to security guidelines, the @google/genai SDK is called server-side via this proxy endpoint.
    const response = await fetch("/api/generate-news", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ prompt }),
    });

    if (!response.ok) {
        throw new Error(`Error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    
    // Check if we got text back
    if (!data.text) {
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
