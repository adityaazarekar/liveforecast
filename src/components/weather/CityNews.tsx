import { useEffect, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { getCityNews } from "@/utils/cityMedia.functions";

type NewsItem = { title: string; source: string; url: string; publishedAt: string };

function timeAgo(iso: string): string {
  if (!iso) return "";
  const d = new Date(iso).getTime();
  if (Number.isNaN(d)) return "";
  const diff = Math.max(0, Date.now() - d);
  const m = Math.floor(diff / 60000);
  if (m < 1) return "now";
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  const days = Math.floor(h / 24);
  return `${days}d ago`;
}

export function CityNews({ name }: { name: string }) {
  const fetchNews = useServerFn(getCityNews);
  const [items, setItems] = useState<NewsItem[] | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    setLoading(true);
    setItems(null);
    fetchNews({ data: { name } })
      .then((r) => { if (active) { setItems(r.items); setLoading(false); } })
      .catch(() => { if (active) { setItems([]); setLoading(false); } });
    return () => { active = false; };
  }, [name, fetchNews]);

  if (!loading && (!items || items.length === 0)) return null;

  return (
    <div className="space-y-2.5">
      <div className="flex items-center gap-2">
        <span className="h-1.5 w-1.5 rounded-full bg-[var(--cond)]" style={{ animation: "pulse 1.6s ease-in-out infinite", boxShadow: "0 0 8px var(--cond)" }} />
        <span style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 14, fontWeight: 500, letterSpacing: "0.22em", textTransform: "uppercase", color: "var(--cond)" }}>City Pulse</span>
      </div>

      {loading && (
        <div className="space-y-2">
          {[0, 1, 2].map((i) => (
            <div key={i} className="space-y-1">
              <div className="h-3 w-full rounded bg-white/[0.05] animate-pulse" />
              <div className="h-2 w-1/3 rounded bg-white/[0.04] animate-pulse" />
            </div>
          ))}
        </div>
      )}

      {!loading && items && items.length > 0 && (
        <ul className="space-y-0">
          {items.map((it, i) => (
            <li key={i} className="border-t border-white/[0.06] first:border-t-0">
              <a
                href={it.url}
                target="_blank"
                rel="noopener noreferrer"
                className="block px-2 py-2 -mx-2 rounded transition-colors hover:bg-white/[0.04]"
                style={{ animation: `drop-in 0.4s ${i * 80}ms cubic-bezier(0.22,1,0.36,1) both` }}
              >
                <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 18, lineHeight: 1.4, color: "rgba(255,255,255,0.8)", fontWeight: 300, overflow: "hidden", textOverflow: "ellipsis", display: "-webkit-box", WebkitLineClamp: 1, WebkitBoxOrient: "vertical" }}>
                  {it.title}
                </div>
                <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 15, letterSpacing: "0.12em", textTransform: "uppercase", color: "rgba(255,255,255,0.4)", marginTop: 2 }}>
                  {it.source} {it.publishedAt && <>· {timeAgo(it.publishedAt)}</>}
                </div>
              </a>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
