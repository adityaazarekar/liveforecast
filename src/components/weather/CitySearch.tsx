import { useEffect, useRef, useState } from "react";
import { Search, MapPin, Loader2 } from "lucide-react";
import { useServerFn } from "@tanstack/react-start";
import { searchCities } from "@/utils/weather.functions";

type City = { name: string; country: string; state?: string; lat: number; lon: number };

export function CitySearch({ onSelect, current }: {
  onSelect: (c: City) => void;
  current: string;
}) {
  const [q, setQ] = useState("");
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<City[]>([]);
  const search = useServerFn(searchCities);
  const boxRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (q.trim().length < 2) { setResults([]); return; }
    setLoading(true);
    const t = setTimeout(async () => {
      try {
        const r = await search({ data: { q } });
        setResults(r.results);
      } catch { /* ignore */ }
      setLoading(false);
    }, 280);
    return () => clearTimeout(t);
  }, [q, search]);

  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (!boxRef.current?.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", onClick);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onClick);
      document.removeEventListener("keydown", onKey);
    };
  }, []);

  return (
    <div
      ref={boxRef}
      className="relative"
      style={{
        zIndex: 9999,
        width: open ? 340 : 240,
        transition: "width 320ms cubic-bezier(0.34, 1.20, 0.64, 1.0)",
      }}
    >
      <div className="glass-soft search-pill flex items-center gap-3 px-4 py-2.5 transition-all duration-300 hover:bg-white/[0.06] focus-within:bg-white/[0.07] focus-within:border-white/20">
        <Search className="h-3.5 w-3.5 text-white/50" strokeWidth={1.6} />
        <input
          value={q}
          onFocus={() => setOpen(true)}
          onChange={(e) => { setQ(e.target.value); setOpen(true); }}
          placeholder={current}
          className="flex-1 bg-transparent text-[18px] tracking-wide text-white placeholder:text-white/40 outline-none font-light"
        />
        {loading && <Loader2 className="h-3.5 w-3.5 animate-spin text-white/50" />}
      </div>

      {open && results.length > 0 && (
        <div
          className="glass-dropdown absolute left-0 right-0 top-[calc(100%+8px)] overflow-hidden"
          style={{ zIndex: 9999, position: "absolute" }}
        >
          {results.map((c, i) => (
            <button
              key={`${c.lat}-${c.lon}-${c.name}`}
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => {
                onSelect(c);
                setOpen(false);
                setQ("");
                setResults([]);
              }}
              className="group relative flex w-full items-center gap-2.5 border-l-[3px] border-transparent px-4 py-2.5 text-left text-[18px] text-white/85 transition-all duration-200 hover:border-l-amber hover:bg-white/[0.06] hover:pl-5"
              style={{
                animation: `drop-in 0.34s ${i * 40}ms cubic-bezier(0.22, 1, 0.36, 1) both`,
              }}
            >
              <MapPin className="h-3 w-3 text-amber" strokeWidth={1.6} />
              <span className="font-light">
                {c.name}
                {c.state ? `, ${c.state}` : ""}
                <span className="text-white/40">  ·  {c.country}</span>
              </span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
