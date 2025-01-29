import { SlashCommandSubcommandBuilder } from "discord.js";

export const kvSetSubcommand = new SlashCommandSubcommandBuilder()
  .setName("set")
  .setDescription("Set a key-value pair")
  .addStringOption((option) =>
    option.setName("key").setDescription("The key to set").setRequired(true)
  )
  .addStringOption((option) =>
    option.setName("value").setDescription("The value to set").setRequired(true)
  );
