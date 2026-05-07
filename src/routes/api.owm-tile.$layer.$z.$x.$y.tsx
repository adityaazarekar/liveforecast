import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/api/owm-tile/$layer/$z/$x/$y")({
  server: {
    handlers: {
      GET: async ({ params }) => {
        const key = process.env.OPENWEATHER_API_KEY;
        if (!key) return new Response("missing key", { status: 500 });
        const { layer, z, x, y } = params as { layer: string; z: string; x: string; y: string };
        // Strip optional .png suffix
        const yClean = y.replace(/\.png$/, "");
        const url = `https://tile.openweathermap.org/map/${layer}/${z}/${x}/${yClean}.png?appid=${key}`;
        const r = await fetch(url);
        if (!r.ok) return new Response("upstream error", { status: r.status });
        const buf = await r.arrayBuffer();
        return new Response(buf, {
          status: 200,
          headers: {
            "Content-Type": "image/png",
            "Cache-Control": "public, max-age=600",
          },
        });
      },
    },
  },
});
