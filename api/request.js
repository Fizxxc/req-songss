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

// === Telegram (gunakan ENV untuk keamanan tetap) ===
const TELEGRAM_TOKEN = process.env.TELEGRAM_TOKEN;
const TELEGRAM_CHAT_ID = process.env.TELEGRAM_CHAT_ID;

// === Firebase Init ===
const app = initializeApp(firebaseConfig);
const db = getDatabase(app);

// === Handler ===
export default async function handler(req) {
  try {
    // Pastikan method POST
    if (req.method !== "POST") {
      return new Response(JSON.stringify({ error: "Method not allowed" }), {
        status: 405,
        headers: { "Content-Type": "application/json" }
      });
    }

    // Ambil dan validasi body
    const data = await req.json();

    if (!data || !data.title || !data.artist) {
      return new Response(JSON.stringify({ error: "Data tidak lengkap" }), {
        status: 400,
        headers: { "Content-Type": "application/json" }
      });
    }

    // Simpan ke Firebase Realtime Database
    await push(ref(db, "requests"), {
      title: data.title,
      artist: data.artist,
      nama: data.nama || "Anonim",
      status: "pending",
      time: Date.now()
    });

    // Kirim Notifikasi Telegram (jika tersedia)
    if (TELEGRAM_TOKEN && TELEGRAM_CHAT_ID) {
      const message = `🎵 *Request Lagu Baru*\n\n🎶 *${data.title}*\n🎤 ${data.artist}\n👤 Pengirim: ${data.nama || "Anonim"}`;
      try {
        await fetch(`https://api.telegram.org/bot${TELEGRAM_TOKEN}/sendMessage`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            chat_id: TELEGRAM_CHAT_ID,
            text: message,
            parse_mode: "Markdown"
          })
        });
      } catch (err) {
        console.error("❌ Telegram Error:", err.message);
        // Telegram error tidak menghentikan proses utama
      }
    }

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { "Content-Type": "application/json" }
    });

  } catch (error) {
    console.error("❌ Internal Error:", error);
    return new Response(JSON.stringify({ error: "Internal server error" }), {
      status: 500,
      headers: { "Content-Type": "application/json" }
    });
  }
}
