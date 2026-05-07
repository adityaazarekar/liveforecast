import { useEffect, useRef, useState } from "react";

type Props = {
  value: number;
  duration?: number;
  decimals?: number;
  className?: string;
  suffix?: string;
  prefix?: string;
  style?: React.CSSProperties;
};

// easeOutExpo
const ease = (t: number) => (t === 1 ? 1 : 1 - Math.pow(2, -10 * t));

export function CountUp({
  value,
  duration = 1200,
  decimals = 0,
  className,
  suffix = "",
  prefix = "",
  style,
}: Props) {
  const [v, setV] = useState(0);
  const fromRef = useRef(0);
  const prevTargetRef = useRef<number | null>(null);

  useEffect(() => {
    const target = value;
    // On change: count down current to 0 then up to new (per spec).
    // For the very first render, fromRef is 0 and we just count up.
    let raf = 0;
    let start: number | null = null;

    const phase2 = () => {
      const from = 0;
      start = null;
      const step2 = (t: number) => {
        if (start === null) start = t;
        const p = Math.min(1, (t - start) / duration);
        setV(from + (target - from) * ease(p));
        if (p < 1) raf = requestAnimationFrame(step2);
        else fromRef.current = target;
      };
      raf = requestAnimationFrame(step2);
    };

    if (prevTargetRef.current === null) {
      // First mount — count up from 0
      const from = 0;
      const step = (t: number) => {
        if (start === null) start = t;
        const p = Math.min(1, (t - start) / duration);
        setV(from + (target - from) * ease(p));
        if (p < 1) raf = requestAnimationFrame(step);
        else fromRef.current = target;
      };
      raf = requestAnimationFrame(step);
    } else {
      // City changed — quick down to 0, then up to new
      const from = fromRef.current;
      const downDur = duration * 0.4;
      const step1 = (t: number) => {
        if (start === null) start = t;
        const p = Math.min(1, (t - start) / downDur);
        setV(from * (1 - ease(p)));
        if (p < 1) raf = requestAnimationFrame(step1);
        else phase2();
      };
      raf = requestAnimationFrame(step1);
    }
    prevTargetRef.current = target;
    return () => cancelAnimationFrame(raf);
  }, [value, duration]);

  return (
    <span className={className} style={style}>
      {prefix}
      {v.toFixed(decimals)}
      {suffix}
    </span>
  );
}
