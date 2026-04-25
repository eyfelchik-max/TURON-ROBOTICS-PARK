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

    const message = `
🌐 <b>Web saytdan yuborildi</b>
🆕 Yangi ro'yxatdan o'tish!

👤 Ism: ${data.firstName}
👥 Familiya: ${data.lastName}
📞 Tel: ${data.phone}
📨 Telegram: @${data.telegram}
📍 Hudud: ${data.region}, ${data.district}
🏠 Mahalla: ${data.neighborhood}
🎂 Yosh: ${data.age}
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

      if (response.ok) {
        res.json({ success: true });
      } else {
        const errData = await response.json();
        console.error("Telegram API error:", errData);
        res.status(500).json({ error: "Failed to send Telegram notification" });
      }
    } catch (error) {
      console.error("Server error:", error);
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
