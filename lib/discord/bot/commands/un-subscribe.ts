import { SlashCommandBuilder } from "discord.js";

export const unSubscribeCommand = new SlashCommandBuilder()
  .setName("unsubscribe")
  .setDescription("Unsubscribe from presence updates for a user")
  .addUserOption((option) =>
    option
      .setName("user")
      .setDescription("The user to unsubscribe from")
      .setRequired(true)
  )
  .toJSON();
