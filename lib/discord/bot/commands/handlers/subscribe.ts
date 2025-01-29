import { ChatInputCommandInteraction, MessageFlags } from "discord.js";
import { config } from "@/utils/config";
import { store } from "@/store/presence.store";
import { Logger } from "@/utils/logger";

export async function handleSubscribe(
  interaction: ChatInputCommandInteraction
) {
  const user = interaction.options.getUser("user");
  if (!user) {
    await interaction.reply({
      content: "Please specify a valid user",
      ephemeral: true,
    });
    return;
  }

  try {
    if (config.discord.monitoredUsers.includes(user.id)) {
      await interaction.reply({
        content: `Already monitoring ${user.username}`,
        ephemeral: true,
      });
      return;
    }
    config.discord.monitoredUsers.push(user.id);

    const initialPresence = await store.get(user.id);
    if (!initialPresence) {
      await store.get(user.id);
    }

    await interaction.reply({
      content: `Now monitoring ${user.username}`,
      ephemeral: true,
    });
    Logger.info(`Started monitoring user: ${user.username} (${user.id})`);
  } catch (error) {
    Logger.error(
      `Error in handleSubscribe: ${error instanceof Error ? error.message : "Unknown error"}`
    );
    await interaction.reply({
      content:
        "An error occurred while processing your request. Please try again later.",
      flags: MessageFlags.Ephemeral,
    });
  }
}
