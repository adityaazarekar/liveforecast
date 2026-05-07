import { useEffect, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { getCityLore } from "@/utils/cityInsight.functions";
import { getCityImage } from "@/utils/cityMedia.functions";
import { motion, AnimatePresence } from "framer-motion";

export function CityLore({ name, country }: { name: string; country: string }) {
  const fetchLore = useServerFn(getCityLore);
  const fetchImage = useServerFn(getCityImage);
  const [fact, setFact] = useState<string | null>(null);
  const [imgUrl, setImgUrl] = useState<string | null>(null);
  const [imgError, setImgError] = useState(false);

  useEffect(() => {
    let active = true;
    setFact(null);
    setImgUrl(null);
    setImgError(false);

    fetchLore({ data: { name, country } })
      .then((r) => { if (active) setFact(r.fact); })
      .catch(() => { if (active) setFact(null); });

    fetchImage({ data: { name, country } })
      .then((r) => { if (active) setImgUrl(r.url); })
      .catch(() => { if (active) setImgUrl(null); });

    return () => { active = false; };
  }, [name, country, fetchLore, fetchImage]);

  const showImage = imgUrl && !imgError;

  return (
    <div className="space-y-3">
      <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 14, fontWeight: 500, letterSpacing: "0.22em", textTransform: "uppercase", color: "var(--cond)" }}>
        City Lore
      </div>

      <div className="relative h-[120px] w-full overflow-hidden rounded-[10px] border border-white/[0.08]">
        <AnimatePresence mode="wait">
          {showImage ? (
            <motion.img
              key={imgUrl}
              src={imgUrl!}
              alt={`${name} landmark`}
              onError={() => setImgError(true)}
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.4 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.8 }}
              className="absolute inset-0 h-full w-full object-cover"
              style={{
                mixBlendMode: "luminosity",
                filter: "brightness(0.8) saturate(0.5) contrast(1.1)",
                animation: "ken-burns 14s ease-in-out infinite alternate",
              }}
              loading="lazy"
            />
          ) : (
            <motion.div
              key="fallback"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="absolute inset-0"
              style={{
                background:
                  "linear-gradient(135deg, var(--cond-soft), transparent 60%), linear-gradient(180deg, rgba(255,255,255,0.06), transparent)",
              }}
            />
          )}
        </AnimatePresence>
        <div
          className="absolute inset-0"
          style={{ background: "linear-gradient(to top, rgba(10,10,20,0.95), transparent 70%)" }}
        />
      </div>

      <p
        style={{ fontFamily: "'Cormorant Garamond', serif", fontStyle: "italic", fontWeight: 400, fontSize: 20, lineHeight: 1.75, color: "rgba(255,255,255,0.78)" }}
      >
        {fact ?? "…"}
      </p>
    </div>
  );
}
