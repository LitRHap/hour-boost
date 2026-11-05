import http from 'node:http';
import { logger } from './logger.js';

export function startHealthServer(port, getStatus) {
  if (!port) return null;
  const server = http.createServer((req, res) => {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify(getStatus()));
  });
  server.listen(port, () => logger.info(`Health endpoint di port ${port}`));
  return server;
}
