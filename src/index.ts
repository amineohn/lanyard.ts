import { client } from './discord/client';
import { server } from './api/server';
import { config } from './config';

async function main() {
  try {
    await client.login(config.discord.token);
    await server.listen({ port: config.api.port, host: '0.0.0.0' });

    console.log(`Server listening on port ${config.api.port}`);
  } catch (error) {
    console.error('Failed to start:', error);
    process.exit(1);
  }
}

main();