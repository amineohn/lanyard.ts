import { SlashCommandBuilder } from "discord.js";
import { kvSetSubcommand } from "@/discord/bot/commands/kv/set";
import { kvGetSubcommand } from "@/discord/bot/commands/kv/get";
import { kvDeleteSubcommand } from "@/discord/bot/commands/kv/delete";
import { kvListSubcommand } from "@/discord/bot/commands/kv/list";

export const kvCommand = new SlashCommandBuilder()
  .setName("kv")
  .setDescription("Manage key-value pairs")
  .addSubcommand(kvSetSubcommand)
  .addSubcommand(kvGetSubcommand)
  .addSubcommand(kvDeleteSubcommand)
  .addSubcommand(kvListSubcommand)
  .toJSON();
