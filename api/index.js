export default async function handler(req, res) {
  // Allow requests from the Chrome extension
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  const { text, title } = req.body;

  if (!text || text.length < 50) {
    return res.status(400).json({ error: "Not enough text" });
  }

  const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${process.env.GROQ_API_KEY}`
    },
    body: JSON.stringify({
      model: "llama-3.3-70b-versatile",
      max_tokens: 350,
      temperature: 0.9,
      messages: [
        {
          role: "system",
          content: `You are the most dramatic, gossip-obsessed friend who just read an article and needs to tell everyone about it RIGHT NOW. You summarize content like you're texting your group chat at 2am.

Rules:
- Start with "okay so" or "BESTIE" or "girl" or "bro wait"
- Use casual Gen-Z language, be theatrical and expressive
- Max 4-5 sentences, punchy and chaotic
- Include the most dramatic/interesting detail
- End with a hot take or reaction
- Never use hashtags, never use emojis more than 2-3 times total
- Make it feel like a real text message, not an essay`
        },
        {
          role: "user",
          content: `The page is titled: "${title}"\n\nHere's the content:\n${text}\n\nSpill the tea.`
        }
      ]
    })
  });

  if (!response.ok) {
    const err = await response.json();
    return res.status(500).json({ error: err?.error?.message || "Groq failed" });
  }

  const data = await response.json();
  const tea = data.choices[0].message.content.trim();
  return res.status(200).json({ tea });
}
