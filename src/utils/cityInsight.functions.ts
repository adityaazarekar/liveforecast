import { createServerFn } from "@tanstack/react-start";
import { getCityFact } from "@/lib/cityFacts";

const LOVABLE_AI = "https://ai.gateway.lovable.dev/v1/chat/completions";

async function callAI(prompt: string): Promise<string | null> {
  const key = process.env.LOVABLE_API_KEY;
  if (!key) return null;
  try {
    const r = await fetch(LOVABLE_AI, {
      method: "POST",
      headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: "You write one-sentence travel facts. Reply ONLY with the fact, no quotes, under 28 words, present tense." },
          { role: "user", content: prompt },
        ],
      }),
    });
    if (!r.ok) return null;
    const j = await r.json();
    const text = j?.choices?.[0]?.message?.content?.trim();
    return text || null;
  } catch {
    return null;
  }
}

export const getCityLore = createServerFn({ method: "GET" })
  .inputValidator((d: { name: string; country: string }) => d)
  .handler(async ({ data }) => {
    const local = getCityFact(data.name);
    if (local) return { fact: local, source: "local" as const };
    const ai = await callAI(
      `Give one surprising, true, non-cliché fun fact about ${data.name}, ${data.country}.`,
    );
    return { fact: ai ?? `${data.name} sits in ${data.country} — explore its corners and you'll find stories worth keeping.`, source: ai ? ("ai" as const) : ("fallback" as const) };
  });

export const getMoodLine = createServerFn({ method: "GET" })
  .inputValidator((d: { city: string; condition: string; temp: number }) => d)
  .handler(async ({ data }) => {
    const ai = await callAI(
      `In one warm, evocative sentence (max 14 words, no emoji), describe the mood today in ${data.city}: ${Math.round(data.temp)}°C, ${data.condition}.`,
    );
    return { mood: ai ?? `A fine ${data.condition.toLowerCase()} day in ${data.city}.` };
  });
