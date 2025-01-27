import { ChatInputCommandInteraction } from "discord.js";
import { store } from "@/store/presence.store";

export async function handleKVDelete(interaction: ChatInputCommandInteraction) {
  const key = interaction.options.getString("key", true);
  const userId = interaction.user.id;
  const presence = await store.get(userId);

  if (presence?.kv) {
    delete presence.kv[key];
    await store.set(userId, presence);
    await interaction.reply(`Deleted key "${key}"`);
  } else {
    await interaction.reply(`Key "${key}" not found`);
  }
}
