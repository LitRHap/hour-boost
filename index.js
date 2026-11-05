import { config } from './src/config.js';
import { logger } from './src/logger.js';
import { HourBooster } from './src/booster.js';
import { startHealthServer } from './src/health.js';

const booster = new HourBooster(config);
startHealthServer(config.port, () => booster.status);
await booster.start();

const shutdown = () => {
  booster.stop();
  setTimeout(() => process.exit(0), 1500);
};
process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);
process.on('unhandledRejection', (e) => logger.error(e, 'Unhandled rejection'));
