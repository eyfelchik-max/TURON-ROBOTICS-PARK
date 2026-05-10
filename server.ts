import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import { fileURLToPath } from "url";
import dotenv from "dotenv";
import { templates } from "./src/services/telegramService";

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
    const botToken = process.env.TELEGRAM_BOT_TOKEN || "8761040668:AAGbty5rJDkDzZwL-AHGaGbWHj0o3ynivTk";
    const chatId = process.env.TELEGRAM_CHAT_ID || "-1003722111761";

    if (!botToken) {
      console.warn("TELEGRAM_BOT_TOKEN is not set.");
      return res.status(500).json({ 
        error: "Telegram Bot configured emas", 
        details: "TELEGRAM_BOT_TOKEN muhit o'zgaruvchisi topilmadi. Iltimos, AI Studio Settings'da ushbu turni qo'shing." 
      });
    }

    const message = templates.newRegistration(data);

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
        res.status(response.status).json({ 
          error: "Telegram xabari yuborilmadi", 
          details: result.description || "Noma'lum Telegram xatoligi",
          raw: result
        });
      }
    } catch (error) {
      console.error("Server error during notification:", error);
      res.status(500).json({ error: "Server xatoligi", details: error instanceof Error ? error.message : "Noma'lum xato" });
    }
  });

  // Test Telegram notification
  app.post("/api/test-telegram", async (req, res) => {
    const botToken = process.env.TELEGRAM_BOT_TOKEN || "8761040668:AAGbty5rJDkDzZwL-AHGaGbWHj0o3ynivTk";
    const chatId = process.env.TELEGRAM_CHAT_ID || "-1003722111761";

    if (!botToken) {
      return res.status(500).json({ error: "Bot token topilmadi" });
    }

    try {
      const response = await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          chat_id: chatId,
          text: templates.testMessage(),
          parse_mode: "HTML"
        }),
      });

      const result = await response.json();
      if (response.ok) {
        res.json({ success: true });
      } else {
        res.status(response.status).json({ error: result.description });
      }
    } catch (error) {
      res.status(500).json({ error: error instanceof Error ? error.message : "Xatolik" });
    }
  });

  // Health check for admin to see if bot is configured
  app.get("/api/bot-status", (req, res) => {
    const isTokenSet = !!(process.env.TELEGRAM_BOT_TOKEN || "8761040668:AAGbty5rJDkDzZwL-AHGaGbWHj0o3ynivTk");
    res.json({
      isConfigured: isTokenSet,
      chatId: (process.env.TELEGRAM_CHAT_ID || "-1003722111761") ? "O'rnatilgan" : "O'rnatilmagan"
    });
  });

  // API 404 Handler - MUST be before Vite/Static middleware
  app.all("/api/*", (req, res) => {
    res.status(404).json({ error: "API yo'li topilmadi", path: req.path });
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
