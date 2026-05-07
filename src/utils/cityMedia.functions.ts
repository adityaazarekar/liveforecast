import { createServerFn } from "@tanstack/react-start";
import { landmarkQueryFor } from "@/lib/landmarks";

/**
 * Fetches the most iconic landmark image for a city.
 * Strategy:
 *  1. Look up hardcoded famous landmark query (e.g. "Eiffel Tower Paris" for Paris)
 *  2. Try Unsplash (richer landmark photography)
 *  3. Fallback to Pexels
 *  4. Return null — UI shows gradient fallback
 */
export const getCityImage = createServerFn({ method: "GET" })
  .inputValidator((d: { name: string; country?: string }) => d)
  .handler(
    async ({ data }): Promise<{ url: string | null; photographer?: string; source?: string; landmark?: string }> => {
      const query = landmarkQueryFor(data.name, data.country);

      // 1) Unsplash — better for iconic landmarks
      const unsplashKey = process.env.UNSPLASH_ACCESS_KEY;
      if (unsplashKey) {
        try {
          const r = await fetch(
            `https://api.unsplash.com/search/photos?query=${encodeURIComponent(query)}&per_page=5&orientation=landscape&content_filter=high`,
            { headers: { Authorization: `Client-ID ${unsplashKey}` } },
          );
          if (r.ok) {
            const j: any = await r.json();
            const photo = j?.results?.[0];
            if (photo?.urls?.regular) {
              return {
                url: photo.urls.regular,
                photographer: photo.user?.name ?? "Unsplash",
                source: "unsplash",
                landmark: query,
              };
            }
          }
        } catch (e) {
          console.warn("Unsplash fetch failed:", e);
        }
      }

      // 2) Pexels fallback
      const pexelsKey = process.env.PEXELS_API_KEY;
      if (pexelsKey) {
        try {
          const r = await fetch(
            `https://api.pexels.com/v1/search?query=${encodeURIComponent(query)}&per_page=1&orientation=landscape`,
            { headers: { Authorization: pexelsKey } },
          );
          if (r.ok) {
            const j: any = await r.json();
            const photo = j?.photos?.[0];
            if (photo) {
              return {
                url: photo.src?.landscape ?? photo.src?.large ?? null,
                photographer: photo.photographer,
                source: "pexels",
                landmark: query,
              };
            }
          }
        } catch (e) {
          console.warn("Pexels fetch failed:", e);
        }
      }

      return { url: null };
    },
  );

export const getCityNews = createServerFn({ method: "GET" })
  .inputValidator((d: { name: string }) => d)
  .handler(async ({ data }): Promise<{
    items: Array<{ title: string; source: string; url: string; publishedAt: string }>;
  }> => {
    const key = process.env.GNEWS_API_KEY;
    if (!key) return { items: [] };
    try {
      const q = encodeURIComponent(data.name);
      const r = await fetch(
        `https://gnews.io/api/v4/search?q=${q}&lang=en&max=3&apikey=${key}`,
      );
      if (!r.ok) return { items: [] };
      const j: any = await r.json();
      const items = (j?.articles ?? []).slice(0, 3).map((a: any) => ({
        title: a.title ?? "",
        source: a.source?.name ?? "News",
        url: a.url ?? "#",
        publishedAt: a.publishedAt ?? "",
      }));
      return { items };
    } catch {
      return { items: [] };
    }
  });
