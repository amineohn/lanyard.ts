import { Interaction } from "discord.js";
import { Logger } from "#/utils/logger";
import { handleCommand } from "#/bot/commands";

export async function handleInteractionCreate(interaction: Interaction) {
  if (!interaction.isChatInputCommand()) return;

  try {
    await handleCommand(interaction);
  } catch (error) {
    Logger.error(`Error handling command: ${error}`);
    if (interaction.isRepliable()) {
      await interaction.reply({
        content: "There was an error processing your command.",
        ephemeral: true,
      });
    }
  }
}
