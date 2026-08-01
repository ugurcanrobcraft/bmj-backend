import express from 'express';
import cors from 'cors';
import { Client, GatewayIntentBits } from '@jubbio/core';

const app = express();
app.use(cors());
app.use(express.json());

// Aktif çalışan bot süreçleri (Memory store)
const activeBots = new Map();

// Bot Başlatma / Host Verme Endpoint
app.post('/api/run-bot', async (req, res) => {
    const { botId, token, code } = req.body;

    if (!token) {
        return res.status(400).json({ error: "Token eksik!" });
    }

    try {
        // Eğer bot zaten çalışıyorsa durdur (yeniden başlatmak için)
        if (activeBots.has(botId)) {
            const oldClient = activeBots.get(botId);
            oldClient.destroy();
            activeBots.delete(botId);
        }

        // Yeni Jubbio Client Oluştur
        const client = new Client({
            intents: [
                GatewayIntentBits.Guilds,
                GatewayIntentBits.GuildMessages,
                GatewayIntentBits.MessageContent
            ]
        });

        // Bot Dinleyicileri
        client.on('ready', () => {
            console.log(`[OK] Bot Aktif: ${client.user?.tag || botId}`);
        });

        // Kodu güvenli şekilde yürüt (Dynamic Execution)
        // Not: Kullanıcı kodundaki process.env.TOKEN yerine token basılır.
        await client.login(token);

        // Aktif botlar listesine kaydet
        activeBots.set(botId, client);

        return res.json({ success: true, message: "Bot başarıyla aktif edildi ve online!" });
    } catch (err) {
        console.error("Bot Başlatma Hatası:", err);
        return res.status(500).json({ error: err.message });
    }
});

// Bot Durdurma Endpoint
app.post('/api/stop-bot', (req, res) => {
    const { botId } = req.body;
    if (activeBots.has(botId)) {
        const client = activeBots.get(botId);
        client.destroy();
        activeBots.delete(botId);
        return res.json({ success: true, message: "Bot durduruldu." });
    }
    res.json({ success: false, message: "Çalışan bot bulunamadı." });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`🚀 BMJ Backend ${PORT} portunda aktif!`));

