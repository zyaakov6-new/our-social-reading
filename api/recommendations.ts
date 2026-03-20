import Anthropic from "@anthropic-ai/sdk";
import type { VercelRequest, VercelResponse } from "@vercel/node";

interface BookInput {
  title: string;
  author: string;
  status: string;
}

interface Recommendation {
  title: string;
  author: string;
  reason: string;
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const { books } = req.body as { books: BookInput[] };

    if (!books?.length) {
      return res.status(400).json({ error: "No books provided" });
    }

    const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

    const bookList = books
      .map((b) => `- "${b.title}" by ${b.author}`)
      .join("\n");

    const response = await client.messages.create({
      model: "claude-opus-4-6",
      max_tokens: 1024,
      messages: [
        {
          role: "user",
          content: `You are a book recommendation expert. Based on this user's reading list, recommend exactly 5 books they would love.

User's books:
${bookList}

Return ONLY a valid JSON array — no markdown, no explanation, no code fences. Just the raw JSON.

Format:
[{"title": "Book Title", "author": "Author Name", "reason": "קצר בעברית"}]

Rules:
- Do NOT recommend any book already in the user's list
- "reason" must be a single short sentence in Hebrew (max 8 words) explaining why they will love it
- Vary genres but respect the user's taste
- Use the exact, searchable title and author name so the book can be found on Google Books
- Return exactly 5 recommendations`,
        },
      ],
    });

    const rawText =
      response.content[0].type === "text" ? response.content[0].text.trim() : "[]";

    // Strip markdown code fences if Claude added them anyway
    const cleanJson = rawText.replace(/^```json?\s*/i, "").replace(/\s*```$/i, "");

    const recommendations: Recommendation[] = JSON.parse(cleanJson);

    return res.status(200).json({ recommendations });
  } catch (error) {
    console.error("Recommendations error:", error);
    return res.status(500).json({ error: "Failed to generate recommendations" });
  }
}
