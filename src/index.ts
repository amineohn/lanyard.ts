import { client } from './discord/client';
import { server } from './api/server';
import { config } from './config';
import {Logger} from '@/utils/logger'
async function main() {
  try {
    await client.login(config.discord.token);
    await server.listen({ port: config.api.port, host: '0.0.0.0' });

    Logger.info(`Server listening on port ${config.api.port}`);

  } catch (error) {
    console.error('Failed to start:', error);
    process.exit(1);
  }
}

main();