// Vercel serverless function — wraps the TanStack Start SSR handler
import { createServer } from "node:http";
import { resolve } from "node:path";
import { createRequire } from "node:module";

// Import the built server bundle
const serverPath = resolve(process.cwd(), "dist/server/server.js");

let serverModule;
async function getServer() {
  if (!serverModule) {
    serverModule = await import(serverPath);
  }
  return serverModule.default || serverModule;
}

export default async function handler(req, res) {
  const server = await getServer();

  // Convert Node.js IncomingMessage to a Web Request
  const url = `https://${req.headers.host}${req.url}`;
  const body =
    req.method !== "GET" && req.method !== "HEAD"
      ? await new Promise((resolve) => {
          const chunks = [];
          req.on("data", (chunk) => chunks.push(chunk));
          req.on("end", () => resolve(Buffer.concat(chunks)));
        })
      : undefined;

  const request = new Request(url, {
    method: req.method,
    headers: req.headers,
    body: body && body.length > 0 ? body : undefined,
  });

  // Call the TanStack Start fetch handler
  const response = await server.fetch(request);

  // Write status + headers
  res.writeHead(
    response.status,
    Object.fromEntries(response.headers.entries()),
  );

  // Stream the body back
  if (response.body) {
    const reader = response.body.getReader();
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      res.write(value);
    }
  }
  res.end();
}
