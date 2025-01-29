import { Client, Events, GatewayIntentBits } from "discord.js";
import { handlePresenceUpdate } from "#/gateway/events/presence-update";
import { handleReady } from "#/gateway/events/client-ready";
import { gateway } from "#/gateway";
import { handleClientReady } from "#/discord/events/ready";
import { handleInteractionCreate } from "#/discord/events/interaction-create";

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildPresences,
    GatewayIntentBits.GuildMembers,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
  ],
});

client.once("ready", handleClientReady);
client.on("interactionCreate", handleInteractionCreate);

gateway.on(Events.ClientReady, handleReady);
gateway.on(Events.PresenceUpdate, handlePresenceUpdate);

process.on("SIGINT", () => {
  gateway.destroy();
  process.exit(0);
});

process.on("SIGTERM", () => {
  gateway.destroy();
  process.exit(0);
});

export { client, gateway };
