// UV Index estimator card (semicircle gauge + gradient scale bar).

export function UVCard({ clouds, conditionId, isDay }: { clouds: number; conditionId: number; isDay: boolean }) {
  const uv = estimateUv(clouds, conditionId, isDay);
  const angle = (Math.min(uv, 11) / 11) * 180;
  const indicatorPct = Math.min(uv / 11, 1) * 100;

  const label = uv < 3 ? "Low" : uv < 6 ? "Moderate" : uv < 8 ? "High" : uv < 11 ? "Very High" : "Extreme";

  return (
    <div className="glass glass-hover p-5">
      <div className="flex items-center justify-between mb-3">
        <span style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 15, letterSpacing: "0.18em", textTransform: "uppercase", opacity: 0.5 }}>
          UV Index
        </span>
        <span style={{ fontFamily: "'DM Mono', monospace", fontSize: 25, color: "rgba(255,255,255,0.9)" }}>{uv.toFixed(1)}</span>
      </div>

      <div className="relative mx-auto" style={{ width: 200, height: 110 }}>
        <svg viewBox="0 0 200 110" width={200} height={110}>
          <defs>
            <linearGradient id="uvGrad" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stopColor="#34d399" />
              <stop offset="40%" stopColor="#fbbf24" />
              <stop offset="70%" stopColor="#fb923c" />
              <stop offset="100%" stopColor="#f87171" />
            </linearGradient>
          </defs>
          <path
            d="M 16 100 A 84 84 0 0 1 184 100"
            fill="none"
            stroke="url(#uvGrad)"
            strokeWidth={10}
            strokeLinecap="round"
            opacity={0.85}
          />
          {[0, 45, 90, 135, 180].map((a) => {
            const rad = ((180 - a) * Math.PI) / 180;
            const x1 = 100 + Math.cos(rad) * 78;
            const y1 = 100 - Math.sin(rad) * 78;
            const x2 = 100 + Math.cos(rad) * 88;
            const y2 = 100 - Math.sin(rad) * 88;
            return <line key={a} x1={x1} y1={y1} x2={x2} y2={y2} stroke="rgba(255,255,255,0.2)" strokeWidth={1} />;
          })}
          <g
            style={{
              transformOrigin: "100px 100px",
              transform: `rotate(${angle - 90}deg)`,
              transition: "transform 1.2s cubic-bezier(0.25,0.46,0.45,0.94)",
            }}
          >
            <line x1={100} y1={100} x2={100} y2={28} stroke="#f0f0f0" strokeWidth={2} strokeLinecap="round" />
            <circle cx={100} cy={28} r={4} fill="#f0f0f0" />
          </g>
          <circle cx={100} cy={100} r={5} fill="var(--cond)" />
        </svg>
      </div>

      {/* Gradient scale bar */}
      <div className="relative mt-2 h-1 w-full rounded-full" style={{
        background: "linear-gradient(to right, #22c55e, #eab308, #f97316, #ef4444, #7c3aed)",
      }}>
        <div
          className="absolute -top-1 h-3 w-3 rounded-full border-2 border-white shadow"
          style={{
            left: `calc(${indicatorPct}% - 6px)`,
            background: "var(--cond)",
            transition: "left 1s cubic-bezier(0.25,0.46,0.45,0.94)",
          }}
        />
      </div>
      <div className="mt-2 flex justify-between" style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 14, opacity: 0.35, letterSpacing: "0.1em", textTransform: "uppercase" }}>
        <span>Low</span><span>Mod</span><span>High</span><span>V.High</span><span>Ext</span>
      </div>

      <div className="mt-3 text-center" style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 15, letterSpacing: "0.25em", textTransform: "uppercase", opacity: 0.7 }}>
        {label}
      </div>
    </div>
  );
}

function estimateUv(clouds: number, id: number, isDay: boolean): number {
  if (!isDay) return 0;
  if (id >= 200 && id < 700) return Math.max(0.5, 3 - clouds / 40);
  let base = 8.5;
  base -= clouds * 0.06;
  return Math.max(0, Math.min(11, base));
}
