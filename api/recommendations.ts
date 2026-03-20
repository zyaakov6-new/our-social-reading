import Anthropic from "@anthropic-ai/sdk";
import type { IncomingMessage, ServerResponse } from "http";

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

// Collect the raw body from the Node.js IncomingMessage stream
function readBody(req: IncomingMessage): Promise<string> {
  return new Promise((resolve, reject) => {
    let data = "";
    req.on("data", (chunk) => (data += chunk));
    req.on("end", () => resolve(data));
    req.on("error", reject);
  });
}

function json(res: ServerResponse, status: number, body: unknown) {
  const payload = JSON.stringify(body);
  res.writeHead(status, {
    "Content-Type": "application/json",
    "Content-Length": Buffer.byteLength(payload),
  });
  res.end(payload);
}

export default async function handler(req: IncomingMessage, res: ServerResponse) {
  if (req.method !== "POST") {
    return json(res, 405, { error: "Method not allowed" });
  }

  try {
    const raw = await readBody(req);
    const { books } = JSON.parse(raw) as { books: BookInput[] };

    if (!books?.length) {
      return json(res, 400, { error: "No books provided" });
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

    return json(res, 200, { recommendations });
  } catch (error) {
    console.error("Recommendations error:", error);
    return json(res, 500, { error: "Failed to generate recommendations" });
  }
}
