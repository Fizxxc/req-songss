import { initializeApp } from "firebase/app";
import { getDatabase, ref, push } from "firebase/database";

// === Firebase Configuration (hardcoded) ===
const firebaseConfig = {
  apiKey: "AIzaSyCSKBHxE8YIDFsEW-8TpGSOHuZJ5CliIkg",
  authDomain: "fingerpinauth.firebaseapp.com",
  databaseURL: "https://fingerpinauth-default-rtdb.firebaseio.com",
  projectId: "fingerpinauth",
  storageBucket: "fingerpinauth.firebasestorage.app",
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

// === Serverless Handler ===
export default async function handler(req) {
  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405
    });
  }

  const data = await req.json();

  if (!data.title || !data.artist) {
    return new Response(JSON.stringify({ error: "Data tidak lengkap." }), {
      status: 400
    });
  }

  // Simpan ke Realtime Database
  await push(ref(db, "requests"), {
    title: data.title,
    artist: data.artist,
    nama: data.nama || "Anonim",
    status: "pending",
    time: Date.now()
  });

  // Kirim ke Telegram jika token disediakan
  if (TELEGRAM_TOKEN && TELEGRAM_CHAT_ID) {
    const message = `🎵 Request Lagu Masuk:\n\n📌 *${data.title}* oleh *${data.artist}*\n👤 Pengirim: ${data.nama || "Anonim"}`;

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
}
