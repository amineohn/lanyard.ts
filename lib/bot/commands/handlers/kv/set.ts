import { ChatInputCommandInteraction } from "discord.js";
import { store } from "#/store/presence.store";

export async function handleKVSet(interaction: ChatInputCommandInteraction) {
  const key = interaction.options.getString("key", true);
  const value = interaction.options.getString("value", true);
  const userId = interaction.user.id;

  await store.setKV(userId, key, value);
  await interaction.reply(`Set ${key}=${value}`);
}
