import express from "express";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const PORT = 3000;

  // API Route to fetch external rates
  app.get("/api/rates", async (req, res) => {
    try {
      const targetUrl = "https://ajg-solution.onrender.com/calculadora";
      const response = await fetch(targetUrl);
      if (!response.ok) throw new Error("Failed to fetch from Render");
      const html = await response.text();
      
      // Log HTML snippet for debugging (will appear in server logs)
      console.log("HTML Preview:", html.substring(0, 2000).replace(/\s+/g, ' '));
      
      // Extract logic - More flexible regex based on actual site content
      const extract = (idOrLabel: string, isP2P = false) => {
        let regex;
        if (isP2P) {
          // Look for P2P followed by parenthesis or standard label
          regex = /P2P.*?\(?\s*([0-9.,]+)\s*\)?/i;
        } else {
          // Look for the id or label
          regex = new RegExp(`${idOrLabel}"[^>]*>\\s*([0-9.,]+)`, "i");
        }
        
        const m = html.match(regex);
        if (m) {
          const val = parseFloat(m[1].replace(",", ""));
          console.log(`Matched ${idOrLabel}: ${m[1]} -> ${val}`);
          return val;
        }
        
        // Fallback for USD/EUR labels if ID matching fails
        if (!isP2P) {
          const fallbackRegex = new RegExp(`${idOrLabel}.*?>\\s*([0-9.,]+)`, "i");
          const m2 = html.match(fallbackRegex);
          if (m2) return parseFloat(m2[1].replace(",", ""));
        }

        console.log(`No match for ${idOrLabel}`);
        return null;
      };

      const nUsd = extract("bcv_usd") || extract("BCV USD");
      const nEur = extract("bcv_eur") || extract("BCV EUR");
      const nP2p = extract("P2P", true);

      res.json({
        usd: nUsd,
        eur: nEur,
        p2p: nP2p
      });
    } catch (error) {
      console.error("Proxy error:", error);
      res.status(500).json({ error: "Could not fetch rates" });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const { createServer: createViteServer } = await import("vite");
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
