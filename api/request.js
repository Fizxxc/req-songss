import { initializeApp } from "firebase/app";
import { getDatabase, ref, push } from "firebase/database";

// === Firebase Configuration (hardcoded for frontend compatibility) ===
const firebaseConfig = {
  apiKey: "AIzaSyCSKBHxE8YIDFsEW-8TpGSOHuZJ5CliIkg",
  authDomain: "fingerpinauth.firebaseapp.com",
  databaseURL: "https://fingerpinauth-default-rtdb.firebaseio.com",
  projectId: "fingerpinauth",
  storageBucket: "fingerpinauth.appspot.com",
  messagingSenderId: "395896869935",
  appId: "1:395896869935:web:f05223a2c140bd88d662da"
};

// === Telegram Notification (from environment variables in Vercel) ===
const TELEGRAM_TOKEN = process.env.TELEGRAM_TOKEN;
const TELEGRAM_CHAT_ID = process.env.TELEGRAM_CHAT_ID;

// === Initialize Firebase ===
const app = initializeApp(firebaseConfig);
const db = getDatabase(app);

// === API Route Handler ===
export default async function handler(req) {
  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers: { "Content-Type": "application/json" }
    });
  }

  let data;
  try {
    data = await req.json();
  } catch (err) {
    return new Response(JSON.stringify({ error: "Invalid JSON body" }), {
      status: 400,
      headers: { "Content-Type": "application/json" }
    });
  }

  const { title, artist, nama, preview_url } = data;

  if (!title || !artist) {
    return new Response(JSON.stringify({ error: "Title dan artist wajib diisi." }), {
      status: 400,
      headers: { "Content-Type": "application/json" }
    });
  }

  const payload = {
    title,
    artist,
    nama: nama || "Anonim",
    preview_url: preview_url || null,
    status: "pending",
    time: Date.now()
  };

  try {
    await push(ref(db, "requests"), payload);

    // Kirim notifikasi ke Telegram (jika tersedia)
    if (TELEGRAM_TOKEN && TELEGRAM_CHAT_ID) {
      const msg = `🎧 *Request Lagu Masuk*\n\n🎵 *${title}* oleh *${artist}*\n👤 Pengirim: ${payload.nama}\n\n🕒 ${new Date(payload.time).toLocaleString("id-ID")}`;
      await fetch(`https://api.telegram.org/bot${TELEGRAM_TOKEN}/sendMessage`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          chat_id: TELEGRAM_CHAT_ID,
          text: msg,
          parse_mode: "Markdown"
        })
      });
    }

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { "Content-Type": "application/json" }
    });

  } catch (err) {
    console.error("🔥 Error saat simpan/kirim:", err);
    return new Response(JSON.stringify({ error: "Server Error" }), {
      status: 500,
      headers: { "Content-Type": "application/json" }
    });
  }
}
