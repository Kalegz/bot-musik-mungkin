# 🎵 EUEkafka Music Bot - 24/7 Update Walkthrough

Pembaruan ini fokus pada stabilitas jangka panjang dan fitur persistensi suara.

## ✨ Fitur Baru & Perbaikan
1.  **Mode 24/7 (`/247`):**
    - Memungkinkan bot untuk tetap berada di Voice Channel secara permanen.
    - Status tersimpan di database; bot akan otomatis kembali ke VC setelah restart.
    - Logika cerdas: Bot otomatis masuk ke VC saat perintah dijalankan meskipun musik belum diputar.
2.  **Manajemen Stop Kondisional:**
    - Jika `/stop` ditekan saat mode 24/7 **aktif**, musik berhenti tapi bot **tetap di channel**.
    - Jika `/stop` ditekan saat mode 24/7 **mati**, bot akan berhenti dan **keluar dari channel**.
3.  **Fix Memory Leak:**
    - Menghentikan peringatan `AsyncEventEmitter memory leak`.
    - Membersihkan semua listener lama pada `VoiceConnection` sebelum mendaftarkan yang baru saat terjadi rekoneksi.

## 🛠️ Cara Penggunaan di VPS
Jika Anda melakukan perubahan di lokal, pastikan untuk:
1.  `git push` dari komputer lokal.
2.  `git pull` di VPS.
3.  `pm2 restart all` untuk menerapkan perubahan.

## ⏱️ Target Operasional
Bot kini telah dioptimasi untuk berjalan **1000+ jam** tanpa penurunan performa RAM.
