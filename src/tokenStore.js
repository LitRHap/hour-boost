import fs from 'node:fs/promises';
import path from 'node:path';

export async function loadToken(file) {
  try {
    const raw = await fs.readFile(file, 'utf8');
    return JSON.parse(raw).refreshToken || null;
  } catch {
    return null;
  }
}

export async function saveToken(file, refreshToken) {
  await fs.mkdir(path.dirname(file), { recursive: true });
  await fs.writeFile(file, JSON.stringify({ refreshToken }), { mode: 0o600 });
}

export async function clearToken(file) {
  await fs.rm(file, { force: true });
}
