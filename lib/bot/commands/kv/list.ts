import { SlashCommandSubcommandBuilder } from "discord.js";

export const kvListSubcommand = new SlashCommandSubcommandBuilder()
  .setName("list")
  .setDescription("List all key-value pairs");
