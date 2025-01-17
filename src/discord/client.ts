import {Client, GatewayIntentBits} from 'discord.js';
import {events} from "@/utils/events";
import {handlePresenceUpdate} from "@/gateway/events/presence-update";
import {handleReady} from "@/gateway/events/ready";
import { gateway } from '@/gateway';
import {handleClientReady} from "./events/ready";
import {handleInteractionCreate} from "./events/interaction-create";

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildPresences,
    GatewayIntentBits.GuildMembers,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
  ]
});


client.once('ready', handleClientReady);
client.on('interactionCreate', handleInteractionCreate);

gateway.on(events.ready, handleReady);
gateway.on(events.presence_update, handlePresenceUpdate);

process.on('SIGINT', () => {
  gateway.destroy();
  process.exit(0);
});

process.on('SIGTERM', () => {
  gateway.destroy();
  process.exit(0);
});

export { client, gateway };
