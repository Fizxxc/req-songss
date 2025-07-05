import { initializeApp } from "firebase/app";
import { getDatabase, ref, push } from "firebase/database";

// === Firebase Configuration (hardcoded) ===
const firebaseConfig = {
  apiKey: "AIzaSyCSKBHxE8YIDFsEW-8TpGSOHuZJ5CliIkg",
  authDomain: "fingerpinauth.firebaseapp.com",
  databaseURL: "https://fingerpinauth-default-rtdb.firebaseio.com",
  projectId: "fingerpinauth",
  storageBucket: "fingerpinauth.appspot.com",
  messagingSenderId: "395896869935",
  appId: "1:395896869935:web:f05223a2c140bd88d662da",
  measurementId: "G-6S5NHHLFW0"
};

// === Telegram Configuration (ENV) ===
const TELEGRAM_TOKEN = process.env.TELEGRAM_TOKEN;
const TELEGRAM_CHAT_ID = process.env.TELEGRAM_CHAT_ID;

// === Init Firebase ===
const app = initializeApp(firebaseConfig);
const db = getDatabase(app);

export default async function handler(req) {
  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405
    });
  }

  let data;
  try {
    data = await req.json();
  } catch (err) {
    return new Response(JSON.stringify({ error: "Invalid JSON" }), {
      status: 400
    });
  }

  if (!data.title || !data.artist) {
    return new Response(JSON.stringify({ error: "Data tidak lengkap." }), {
      status: 400
    });
  }

  const payload = {
    title: data.title,
    artist: data.artist,
    nama: data.nama || "Anonim",
    status: "pending",
    time: Date.now()
  };

  try {
    await push(ref(db, "requests"), payload);

    // Kirim ke Telegram
    if (TELEGRAM_TOKEN && TELEGRAM_CHAT_ID) {
      const message = `🎵 *Request Lagu Masuk*\n\n` +
        `🎶 *${payload.title}* oleh *${payload.artist}*\n` +
        `👤 Pengirim: ${payload.nama}\n` +
        `🕒 ${new Date(payload.time).toLocaleString()}`;

      await fetch(`https://api.telegram.org/bot${TELEGRAM_TOKEN}/sendMessage`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          chat_id: TELEGRAM_CHAT_ID,
          text: message,
          parse_mode: "Markdown"
        })
      });
    }

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { "Content-Type": "application/json" }
    });
  } catch (error) {
    console.error("Gagal kirim ke Firebase atau Telegram:", error);
    return new Response(JSON.stringify({ error: "Server error" }), {
      status: 500
    });
  }
}
