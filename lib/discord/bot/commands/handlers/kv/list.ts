import { ChatInputCommandInteraction } from "discord.js";
import { store } from "@/store/presence.store";

export async function handleKVList(interaction: ChatInputCommandInteraction) {
  const userId = interaction.user.id;
  const presence = await store.get(userId);
  const kv = presence?.kv || {}; // Ensure kv is an object

  if (Object.keys(kv).length > 0) {
    const kvList = Object.entries(kv)
      .map(([key, value]) => `${key}=${value}`)
      .join("\n");
    await interaction.reply(`Key-Value pairs:\n\`\`\`\n${kvList}\n\`\`\``);
  } else {
    await interaction.reply("No key-value pairs found");
  }
}
