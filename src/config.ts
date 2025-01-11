import dotenv from 'dotenv';
dotenv.config();

export const config = {
  discord: {
    token: process.env.DISCORD_TOKEN!,
    monitoredUsers: (process.env.MONITORED_USERS || '').split(','),
  },
  redis: {
    url: process.env.REDIS_URL || 'redis://localhost:6379',
  },
  api: {
    port: parseInt(process.env.PORT || '3000', 10),
  },
} as const;