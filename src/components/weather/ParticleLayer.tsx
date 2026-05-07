import { useEffect, useRef } from "react";
import type { SkyTheme } from "@/lib/skyTheme";

type Mode = SkyTheme["particles"];

/**
 * Layered animated sky scene driver.
 * - Rain: 300 streaks (near/far depth) + ground splash ripples
 * - Storm: 500 streaks + double-flash lightning every 6-12s
 * - Snow: 400 flakes with sine drift, near flakes blurred
 * - Stars: 220 dots with twinkle + occasional shooting star
 * - Clouds / mist: drifting soft volumes
 */
export function ParticleLayer({ mode }: { mode: Mode; conditionId?: number }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const flashRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    let w = 0, h = 0;
    const resize = () => {
      w = window.innerWidth;
      h = window.innerHeight;
      canvas.width = w * dpr;
      canvas.height = h * dpr;
      canvas.style.width = w + "px";
      canvas.style.height = h + "px";
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    resize();
    window.addEventListener("resize", resize);

    type Drop = { x: number; y: number; len: number; vy: number; vx: number; o: number; w: number };
    type Splash = { x: number; y: number; r: number; life: number };
    type Flake = { x: number; y: number; r: number; vy: number; phase: number; speed: number; blur: boolean };
    type Cloud = { x: number; y: number; w: number; h: number; v: number; o: number };
    type Band = { y: number; v: number; o: number; h: number };
    type Star = { x: number; y: number; r: number; phase: number; speed: number; baseOp: number };
    type Shooting = { x: number; y: number; vx: number; vy: number; life: number; trail: number };

    const drops: Drop[] = [];
    const splashes: Splash[] = [];
    const flakes: Flake[] = [];
    const clouds: Cloud[] = [];
    const bands: Band[] = [];
    const stars: Star[] = [];
    let shooting: Shooting | null = null;
    let nextShooting = performance.now() + 6000 + Math.random() * 8000;

    if (mode === "rain" || mode === "storm") {
      const count = mode === "storm" ? 500 : 300;
      for (let i = 0; i < count; i++) {
        const depth = Math.random();           // 0=far, 1=near
        const near = depth > 0.5;
        drops.push({
          x: Math.random() * w,
          y: Math.random() * h,
          len: near ? 18 + Math.random() * 14 : 8 + Math.random() * 8,
          vy: near ? 14 + Math.random() * 8 : 6 + Math.random() * 4,
          vx: 2.4 + depth * 1.4,                // 15deg-ish slant
          o: near ? 0.6 + Math.random() * 0.25 : 0.18 + Math.random() * 0.18,
          w: near ? 1.4 + Math.random() * 0.8 : 0.5 + Math.random() * 0.4,
        });
      }
    }
    if (mode === "snow") {
      for (let i = 0; i < 400; i++) {
        const depth = Math.random();
        const near = depth > 0.65;
        flakes.push({
          x: Math.random() * w,
          y: Math.random() * h,
          r: near ? 2.4 + Math.random() * 1.8 : 0.8 + Math.random() * 1.2,
          vy: near ? 1.1 + Math.random() * 0.9 : 0.35 + Math.random() * 0.5,
          phase: Math.random() * Math.PI * 2,
          speed: 0.008 + Math.random() * 0.022,
          blur: near && Math.random() > 0.5,
        });
      }
    }
    if (mode === "clouds") {
      for (let i = 0; i < 6; i++) {
        clouds.push({
          x: Math.random() * w,
          y: 60 + Math.random() * (h * 0.55),
          w: 280 + Math.random() * 240,
          h: 100 + Math.random() * 70,
          v: 0.12 + Math.random() * 0.22,
          o: 0.05 + Math.random() * 0.08,
        });
      }
    }
    if (mode === "mist") {
      for (let i = 0; i < 8; i++) {
        bands.push({
          y: (h / 9) * (i + 1),
          v: 0.1 + Math.random() * 0.2,
          o: 0.06 + Math.random() * 0.04,
          h: 110 + Math.random() * 90,
        });
      }
    }
    if (mode === "stars") {
      for (let i = 0; i < 220; i++) {
        stars.push({
          x: Math.random() * w,
          y: Math.random() * h * 0.78,
          r: Math.random() * 1.5 + 0.3,
          phase: Math.random() * Math.PI * 2,
          speed: 0.4 + Math.random() * 1.6,
          baseOp: 0.3 + Math.random() * 0.6,
        });
      }
    }

    let raf = 0;
    let flashTimer = 0;

    const tick = () => {
      ctx.clearRect(0, 0, w, h);
      const tNow = performance.now();

      if (mode === "rain" || mode === "storm") {
        ctx.lineCap = "round";
        for (const d of drops) {
          d.x += d.vx;
          d.y += d.vy;
          if (d.y > h) {
            // Ground splash chance
            if (Math.random() > 0.6 && d.o > 0.4) {
              splashes.push({ x: d.x, y: h - 4 - Math.random() * 6, r: 0, life: 1 });
            }
            d.y = -d.len;
            d.x = Math.random() * w;
          }
          if (d.x > w) d.x = 0;
          ctx.lineWidth = d.w;
          ctx.strokeStyle = `rgba(174,214,241,${d.o})`;
          ctx.beginPath();
          ctx.moveTo(d.x, d.y);
          ctx.lineTo(d.x - d.vx * 1.4, d.y - d.len);
          ctx.stroke();
        }
        // Splash ripples
        for (let i = splashes.length - 1; i >= 0; i--) {
          const s = splashes[i];
          s.r += 0.6;
          s.life -= 0.05;
          if (s.life <= 0) { splashes.splice(i, 1); continue; }
          ctx.strokeStyle = `rgba(174,214,241,${s.life * 0.4})`;
          ctx.lineWidth = 1;
          ctx.beginPath();
          ctx.arc(s.x, s.y, s.r, 0, Math.PI);
          ctx.stroke();
        }
      }

      if (mode === "snow") {
        for (const f of flakes) {
          f.phase += f.speed;
          f.x += Math.sin(f.phase) * (f.blur ? 1.1 : 0.6);
          f.y += f.vy;
          if (f.y > h) { f.y = -4; f.x = Math.random() * w; }
          if (f.x > w + 6) f.x = -6;
          if (f.x < -6) f.x = w + 6;
          ctx.fillStyle = f.blur
            ? "rgba(232,240,255,0.7)"
            : "rgba(232,240,255,0.85)";
          if (f.blur) ctx.filter = "blur(1px)"; else ctx.filter = "none";
          ctx.beginPath();
          ctx.arc(f.x, f.y, f.r, 0, Math.PI * 2);
          ctx.fill();
        }
        ctx.filter = "none";
        // Subtle ground accumulation glow
        const g = ctx.createLinearGradient(0, h - 80, 0, h);
        g.addColorStop(0, "rgba(232,240,255,0)");
        g.addColorStop(1, "rgba(232,240,255,0.06)");
        ctx.fillStyle = g;
        ctx.fillRect(0, h - 80, w, 80);
      }

      if (mode === "clouds") {
        for (const c of clouds) {
          c.x += c.v;
          if (c.x - c.w > w) c.x = -c.w;
          const grad = ctx.createRadialGradient(c.x, c.y, 0, c.x, c.y, c.w / 2);
          grad.addColorStop(0, `rgba(255,255,255,${c.o})`);
          grad.addColorStop(1, "rgba(255,255,255,0)");
          ctx.fillStyle = grad;
          ctx.beginPath();
          ctx.ellipse(c.x, c.y, c.w / 2, c.h / 2, 0, 0, Math.PI * 2);
          ctx.fill();
        }
      }

      if (mode === "mist") {
        for (const b of bands) {
          b.y += Math.sin(tNow * 0.0001 + b.v) * 0.05;
          const g = ctx.createLinearGradient(0, b.y - b.h / 2, 0, b.y + b.h / 2);
          g.addColorStop(0, "rgba(255,255,255,0)");
          g.addColorStop(0.5, `rgba(255,255,255,${b.o})`);
          g.addColorStop(1, "rgba(255,255,255,0)");
          ctx.fillStyle = g;
          ctx.fillRect(0, b.y - b.h / 2, w, b.h);
        }
      }

      if (mode === "stars") {
        for (const s of stars) {
          const op = s.baseOp * (0.55 + 0.45 * Math.sin(tNow * 0.001 * s.speed + s.phase));
          ctx.fillStyle = `rgba(255,255,255,${Math.max(0, Math.min(1, op))})`;
          ctx.beginPath();
          ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
          ctx.fill();
        }
        // Moon — real disc with phase shadow + soft glow
        const mx = w * 0.82, my = h * 0.18;
        const mr = 42;
        const mg = ctx.createRadialGradient(mx, my, mr * 0.6, mx, my, mr * 4);
        mg.addColorStop(0, "rgba(232,225,200,0.32)");
        mg.addColorStop(1, "rgba(232,225,200,0)");
        ctx.fillStyle = mg;
        ctx.beginPath();
        ctx.arc(mx, my, mr * 4, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = "#f3ecd6";
        ctx.beginPath();
        ctx.arc(mx, my, mr, 0, Math.PI * 2);
        ctx.fill();
        // Phase shadow (rough lunar cycle by day-of-month)
        const dayOfMonth = new Date().getDate();
        const phase = (dayOfMonth % 30) / 30;
        const shadowOffset = Math.cos(phase * Math.PI * 2) * mr * 1.2;
        ctx.save();
        ctx.beginPath();
        ctx.arc(mx, my, mr, 0, Math.PI * 2);
        ctx.clip();
        ctx.fillStyle = "rgba(8,12,20,0.92)";
        ctx.beginPath();
        ctx.arc(mx + shadowOffset, my, mr, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
        // Subtle craters
        ctx.fillStyle = "rgba(180,170,150,0.25)";
        ctx.beginPath(); ctx.arc(mx - 10, my - 6, 4, 0, Math.PI * 2); ctx.fill();
        ctx.beginPath(); ctx.arc(mx + 8, my + 10, 3, 0, Math.PI * 2); ctx.fill();
        ctx.beginPath(); ctx.arc(mx + 14, my - 8, 2, 0, Math.PI * 2); ctx.fill();

        // Planets — 4 distant colored dots with soft halo
        const planets: Array<{ x: number; y: number; color: string; r: number }> = [
          { x: w * 0.18, y: h * 0.22, color: "#ffb37a", r: 2.2 },
          { x: w * 0.32, y: h * 0.12, color: "#fff2c8", r: 2.6 },
          { x: w * 0.62, y: h * 0.30, color: "#ffd9a8", r: 1.8 },
          { x: w * 0.05, y: h * 0.40, color: "#cfe0ff", r: 1.6 },
        ];
        for (const p of planets) {
          const pulse = 0.6 + 0.4 * Math.sin(tNow * 0.0015 + p.x);
          const halo = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, 14);
          halo.addColorStop(0, `${p.color}${Math.round(pulse * 80).toString(16).padStart(2, "0")}`);
          halo.addColorStop(1, `${p.color}00`);
          ctx.fillStyle = halo;
          ctx.beginPath(); ctx.arc(p.x, p.y, 14, 0, Math.PI * 2); ctx.fill();
          ctx.fillStyle = p.color;
          ctx.beginPath(); ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2); ctx.fill();
        }

        // Shooting stars (rare)
        if (!shooting && tNow > nextShooting) {
          shooting = {
            x: Math.random() * w * 0.4,
            y: Math.random() * h * 0.3,
            vx: 9 + Math.random() * 4,
            vy: 3 + Math.random() * 2,
            life: 1,
            trail: 80 + Math.random() * 60,
          };
        }
        if (shooting) {
          shooting.x += shooting.vx;
          shooting.y += shooting.vy;
          shooting.life -= 0.012;
          const tx = shooting.x - shooting.vx * (shooting.trail / 10);
          const ty = shooting.y - shooting.vy * (shooting.trail / 10);
          const grd = ctx.createLinearGradient(tx, ty, shooting.x, shooting.y);
          grd.addColorStop(0, "rgba(255,255,255,0)");
          grd.addColorStop(1, `rgba(255,255,255,${Math.max(0, shooting.life)})`);
          ctx.strokeStyle = grd;
          ctx.lineWidth = 1.6;
          ctx.beginPath();
          ctx.moveTo(tx, ty);
          ctx.lineTo(shooting.x, shooting.y);
          ctx.stroke();
          if (shooting.life <= 0 || shooting.x > w + 100) {
            shooting = null;
            nextShooting = tNow + 8000 + Math.random() * 7000;
          }
        }
      }

      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);

    if (mode === "storm" && flashRef.current) {
      const trigger = () => {
        const el = flashRef.current;
        if (el) {
          el.style.animation = "none";
          void el.offsetWidth;
          el.style.animation = "lightning-flash 0.7s ease-out";
        }
        flashTimer = window.setTimeout(trigger, 6000 + Math.random() * 6000);
      };
      flashTimer = window.setTimeout(trigger, 1800);
    }

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", resize);
      if (flashTimer) clearTimeout(flashTimer);
    };
  }, [mode]);

  return (
    <>
      <canvas
        ref={canvasRef}
        className="fixed inset-0 pointer-events-none"
        style={{ zIndex: 1 }}
        aria-hidden
      />
      <div
        ref={flashRef}
        className="fixed inset-0 pointer-events-none"
        style={{ zIndex: 1, opacity: 0, background: "rgba(220,230,255,0.55)" }}
        aria-hidden
      />
    </>
  );
}
