import { initializeApp } from "firebase/app";
import { getDatabase, ref, push } from "firebase/database";

// === KONFIGURASI ===
const SPOTIFY_CLIENT_ID = process.env.SPOTIFY_CLIENT_ID;
const SPOTIFY_CLIENT_SECRET = process.env.SPOTIFY_CLIENT_SECRET;
const TELEGRAM_TOKEN = process.env.TELEGRAM_TOKEN;
const TELEGRAM_CHAT_ID = process.env.TELEGRAM_CHAT_ID;

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

const app = initializeApp(firebaseConfig);
const db = getDatabase(app);

// === HANDLER ===
export default async (req) => {
  const data = await req.json();

  // Simpan ke Firebase
  await push(ref(db, "requests"), {
    ...data,
    time: Date.now(),
    status: "pending"
  });

  // Kirim Notifikasi Telegram
  const message = `🎵 Request Lagu Masuk:\n\nLagu: ${data.title}\nArtist: ${data.artist}\nOleh: ${data.nama}`;
  await fetch(`https://api.telegram.org/bot${TELEGRAM_TOKEN}/sendMessage`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      chat_id: TELEGRAM_CHAT_ID,
      text: message,
    })
  });

  return new Response(JSON.stringify({ success: true }), { status: 200 });
};
