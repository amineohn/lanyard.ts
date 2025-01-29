import { ChatInputCommandInteraction } from "discord.js";
import { store } from "#/store/presence.store";

export async function handleKVGet(interaction: ChatInputCommandInteraction) {
  const key = interaction.options.getString("key", true);
  const userId = interaction.user.id;
  const presence = await store.get(userId);
  const kv = presence?.kv || {};

  if (kv[key]) {
    await interaction.reply(`${key}=${kv[key]}`);
  } else {
    await interaction.reply(`Key "${key}" not found`);
  }
}
