import { SlashCommandBuilder } from "discord.js";

export const statusCommand = new SlashCommandBuilder()
  .setName("status")
  .setDescription("Get current status of the bot")
  .toJSON();
