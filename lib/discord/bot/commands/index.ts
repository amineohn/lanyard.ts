import { ChatInputCommandInteraction } from "discord.js";

import { subscribeCommand } from "#/discord/bot/commands/subscribe";
import { unSubscribeCommand } from "#/discord/bot/commands/un-subscribe";
import { statusCommand } from "#/discord/bot/commands/status";
import { kvCommand } from "#/discord/bot/commands/kv";

import { handleSubscribe } from "#/discord/bot/commands/handlers/subscribe";
import { handleUnsubscribe } from "#/discord/bot/commands/handlers/un-subscribe";
import { handleStatus } from "#/discord/bot/commands/handlers/status";
import { handleKVSet } from "#/discord/bot/commands/handlers/kv/set";
import { handleKVDelete } from "#/discord/bot/commands/handlers/kv/delete";
import { handleKVGet } from "#/discord/bot/commands/handlers/kv/get";
import { handleKVList } from "#/discord/bot/commands/handlers/kv/list";

export const commands = [
  subscribeCommand,
  unSubscribeCommand,
  statusCommand,
  kvCommand,
];

export async function handleCommand(
  interaction: ChatInputCommandInteraction
): Promise<void> {
  switch (interaction.commandName) {
    case "subscribe":
      await handleSubscribe(interaction);
      break;

    case "unsubscribe":
      await handleUnsubscribe(interaction);
      break;

    case "status":
      await handleStatus(interaction);
      break;

    case "kv": {
      const subcommand = interaction.options.getSubcommand();
      switch (subcommand) {
        case "set":
          await handleKVSet(interaction);
          break;

        case "get":
          await handleKVGet(interaction);
          break;

        case "delete":
          await handleKVDelete(interaction);
          break;

        case "list":
          await handleKVList(interaction);
          break;

        default:
          await interaction.reply("Unknown KV subcommand");
          break;
      }
      break;
    }

    default:
      await interaction.reply("Unknown command");
      break;
  }
}
