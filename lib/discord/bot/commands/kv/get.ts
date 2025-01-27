import { SlashCommandSubcommandBuilder } from "discord.js";

export const kvGetSubcommand = new SlashCommandSubcommandBuilder()
  .setName("get")
  .setDescription("Get a value by key")
  .addStringOption((option) =>
    option.setName("key").setDescription("The key to get").setRequired(true)
  );
