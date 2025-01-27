import { SlashCommandBuilder } from "discord.js";

export const subscribeCommand = new SlashCommandBuilder()
  .setName("subscribe")
  .setDescription("Subscribe to presence updates for a user")
  .addUserOption((option) =>
    option
      .setName("user")
      .setDescription("The user to subscribe to")
      .setRequired(true)
  )
  .toJSON();
