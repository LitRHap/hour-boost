# steam-hourboost

Idler jam bermain (playtime) Steam berbasis Node.js.

## Module
- `steam-user` — koneksi & login Steam
- `steam-totp` — kode Steam Guard otomatis via shared secret
- `dotenv` — konfigurasi lewat `.env`
- `pino` + `pino-pretty` — logging
- `node:http` — endpoint health-check

## Pakai
```bash
npm install
cp .env.example .env   # isi kredensial & GAMES
npm start
```
Login pertama akan meminta kode Steam Guard (kecuali `STEAM_SHARED_SECRET` diisi). Setelah itu refresh token disimpan di `data/` sehingga login berikutnya tidak perlu kode lagi.

## Deploy
- **Docker:** `docker build -t steam-hourboost . && docker run --env-file .env -v $(pwd)/data:/app/data steam-hourboost`
- **Heroku/Railway:** pakai `Procfile` (worker) dan set env var.

## Catatan
- Maks 32 game sekaligus.
- Jika kamu main game dari perangkat lain, booster otomatis berhenti dan lanjut lagi saat slot bebas.
- Jangan commit `.env` dan folder `data/`.
