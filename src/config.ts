import { z } from 'zod';
import dotenv from 'dotenv';
import {Logger} from "./utility/logger";
dotenv.config();

const ConfigSchema = z.object({
  discord: z.object({
    token: z.string().nonempty("DISCORD_TOKEN is required"),
    monitoredUsers: z.array(z.string()).default([]),
  }),
  redis: z.object({
    url: z.string().url("Invalid REDIS_URL format"),
  }),
  api: z.object({
    port: z.number().int().positive("PORT must be a positive integer"),
  }),
});

export const config = ConfigSchema.parse({
  discord: {
    token: process.env.DISCORD_TOKEN,
    monitoredUsers: (process.env.MONITORED_USERS || '').split(',').filter(Boolean),
  },
  redis: {
    url: process.env.REDIS_URL || 'redis://localhost:6379',
  },
  api: {
    port: parseInt(process.env.PORT || '3000', 10),
  },
});

try {
  Logger.info("Config loaded successfully");
} catch (error) {
  if (error instanceof z.ZodError) {
    console.error("Configuration validation error:", error.errors);
    process.exit(1);
  } else {
    throw error;
  }
}
