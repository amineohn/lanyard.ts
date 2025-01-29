import { SlashCommandBuilder } from "discord.js";
import { kvSetSubcommand } from "#/bot/commands/kv/set";
import { kvGetSubcommand } from "#/bot/commands/kv/get";
import { kvDeleteSubcommand } from "#/bot/commands/kv/delete";
import { kvListSubcommand } from "#/bot/commands/kv/list";

export const kvCommand = new SlashCommandBuilder()
  .setName("kv")
  .setDescription("Manage key-value pairs")
  .addSubcommand(kvSetSubcommand)
  .addSubcommand(kvGetSubcommand)
  .addSubcommand(kvDeleteSubcommand)
  .addSubcommand(kvListSubcommand)
  .toJSON();
