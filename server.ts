import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import { fileURLToPath } from "url";
import dotenv from "dotenv";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // API Route for Telegram notifications
  app.post("/api/notify", async (req, res) => {
    const { data } = req.body;
    const botToken = process.env.TELEGRAM_BOT_TOKEN;
    const chatId = process.env.TELEGRAM_CHAT_ID || "-1003722111761";

    if (!botToken) {
      console.warn("TELEGRAM_BOT_TOKEN is not set. Skipping notification.");
      return res.status(500).json({ error: "Notification service not configured" });
    }

    const escapeHTML = (str: string = "") => {
      return String(str)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#39;");
    };

    const message = `
🌐 <b>Yangi ariza kelib tushdi!</b>

👤 <b>Ism:</b> ${escapeHTML(data.firstName)}
👥 <b>Familiya:</b> ${escapeHTML(data.lastName)}
📞 <b>Tel:</b> ${escapeHTML(data.phone)}
📨 <b>Telegram:</b> @${escapeHTML(data.telegram)}
📍 <b>Hudud:</b> ${escapeHTML(data.region)}, ${escapeHTML(data.district)}
🏠 <b>Mahalla:</b> ${escapeHTML(data.neighborhood)}
🎂 <b>Yosh:</b> ${escapeHTML(data.age)}

#yangi_ariza #turon_robotics_park
    `.trim();

    try {
      const response = await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          chat_id: chatId,
          text: message,
          parse_mode: "HTML"
        }),
      });

      const result = await response.json();

      if (response.ok) {
        console.log("Telegram notification sent successfully");
        res.json({ success: true });
      } else {
        console.error("Telegram API error details:", JSON.stringify(result, null, 2));
        res.status(500).json({ 
          error: "Failed to send Telegram notification", 
          details: result.description || "Unknown Telegram error" 
        });
      }
    } catch (error) {
      console.error("Server error during notification:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
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
