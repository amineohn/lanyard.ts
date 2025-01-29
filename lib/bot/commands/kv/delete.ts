import { SlashCommandSubcommandBuilder } from "discord.js";

export const kvDeleteSubcommand = new SlashCommandSubcommandBuilder()
  .setName("delete")
  .setDescription("Delete a key-value pair")
  .addStringOption((option) =>
    option.setName("key").setDescription("The key to delete").setRequired(true)
  );
