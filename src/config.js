import 'dotenv/config';
import SteamUser from 'steam-user';

const personaMap = {
  online: SteamUser.EPersonaState.Online,
  invisible: SteamUser.EPersonaState.Invisible,
  away: SteamUser.EPersonaState.Away,
  busy: SteamUser.EPersonaState.Busy,
  snooze: SteamUser.EPersonaState.Snooze
};

const required = (key) => {
  const v = process.env[key]?.trim();
  if (!v) throw new Error(`Environment variable ${key} wajib diisi (lihat .env.example)`);
  return v;
};

const games = (process.env.GAMES || '')
  .split(',')
  .map((s) => parseInt(s.trim(), 10))
  .filter((n) => Number.isInteger(n) && n > 0);

const customGame = process.env.CUSTOM_GAME?.trim() || '';

if (!games.length && !customGame) {
  throw new Error('Isi minimal satu AppID di GAMES atau set CUSTOM_GAME');
}
if (games.length > 32) {
  throw new Error('Steam hanya mengizinkan maksimal 32 game sekaligus');
}

export const config = {
  username: required('STEAM_USERNAME'),
  password: required('STEAM_PASSWORD'),
  sharedSecret: process.env.STEAM_SHARED_SECRET?.trim() || null,
  games,
  customGame,
  persona: personaMap[(process.env.PERSONA_STATE || 'invisible').toLowerCase()] ?? personaMap.invisible,
  port: process.env.PORT ? parseInt(process.env.PORT, 10) : null,
  tokenFile: 'data/refresh-token.json'
};
