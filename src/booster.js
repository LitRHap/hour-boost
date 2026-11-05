import SteamUser from 'steam-user';
import SteamTotp from 'steam-totp';
import readline from 'node:readline/promises';
import { logger } from './logger.js';
import { loadToken, saveToken, clearToken } from './tokenStore.js';

export class HourBooster {
  constructor(config) {
    this.config = config;
    this.client = new SteamUser({ autoRelogin: true, renewRefreshTokens: true });
    this.startedAt = null;
    this.retryDelay = 5_000;
    this.bindEvents();
  }

  get status() {
    return {
      loggedIn: Boolean(this.client.steamID),
      steamID: this.client.steamID?.getSteamID64() ?? null,
      games: this.config.games,
      customGame: this.config.customGame || null,
      uptimeSeconds: this.startedAt ? Math.floor((Date.now() - this.startedAt) / 1000) : 0
    };
  }

  async start() {
    const refreshToken = await loadToken(this.config.tokenFile);
    if (refreshToken) {
      logger.info('Login memakai refresh token tersimpan');
      this.client.logOn({ refreshToken });
    } else {
      logger.info('Login memakai username & password');
      this.client.logOn({
        accountName: this.config.username,
        password: this.config.password
      });
    }
  }

  bindEvents() {
    const c = this.client;

    c.on('steamGuard', async (domain, callback, lastCodeWrong) => {
      if (lastCodeWrong) logger.warn('Kode Steam Guard sebelumnya salah');

      if (this.config.sharedSecret && !lastCodeWrong) {
        const code = SteamTotp.generateAuthCode(this.config.sharedSecret);
        logger.info('Steam Guard: memakai kode otomatis (shared secret)');
        return callback(code);
      }

      const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
      const label = domain ? `email (${domain})` : 'aplikasi Steam Mobile';
      const code = (await rl.question(`Masukkan kode Steam Guard dari ${label}: `)).trim();
      rl.close();
      callback(code);
    });

    c.on('refreshToken', async (token) => {
      await saveToken(this.config.tokenFile, token);
      logger.debug('Refresh token disimpan');
    });

    c.on('loggedOn', () => {
      this.retryDelay = 5_000;
      this.startedAt = Date.now();
      logger.info(`Login berhasil sebagai ${c.steamID.getSteamID64()}`);
      c.setPersona(this.config.persona);
      this.startPlaying();
    });

    // Dipanggil saat ada sesi lain yang sedang main game di akun yang sama
    c.on('playingState', (blocked, playingApp) => {
      if (blocked) {
        logger.warn(`Akun sedang dipakai main (app ${playingApp}) di perangkat lain. Booster menunggu...`);
      } else {
        logger.info('Slot bermain bebas, melanjutkan boost');
        this.startPlaying();
      }
    });

    c.on('disconnected', (eresult, msg) => {
      logger.warn(`Terputus dari Steam (${msg || eresult}). Auto-relogin aktif`);
    });

    c.on('error', async (err) => {
      logger.error(`Steam error: ${err.message}`);

      // Token kedaluwarsa/ditolak -> hapus lalu login ulang dengan password
      if (['InvalidPassword', 'AccessDenied', 'Expired', 'LoggedInElsewhere'].some((k) => err.message.includes(k))) {
        await clearToken(this.config.tokenFile);
      }

      logger.info(`Mencoba login ulang dalam ${this.retryDelay / 1000} detik`);
      setTimeout(() => this.start(), this.retryDelay);
      this.retryDelay = Math.min(this.retryDelay * 2, 5 * 60_000);
    });
  }

  startPlaying() {
    const list = [...this.config.games];
    if (this.config.customGame) list.unshift(this.config.customGame);
    this.client.gamesPlayed(list);
    logger.info(`Boosting: ${list.join(', ')}`);
  }

  stop() {
    logger.info('Menghentikan booster...');
    this.client.gamesPlayed([]);
    this.client.logOff();
  }
}
