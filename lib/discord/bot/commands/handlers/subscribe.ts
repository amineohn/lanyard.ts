import { ChatInputCommandInteraction } from "discord.js";

export async function handleSubscribe(
  interaction: ChatInputCommandInteraction
) {
  const user = interaction.options.getUser("user");
  if (!user) {
    await interaction.reply("Please specify a valid user");
    return;
  }

  const monitoredUsers = process.env.MONITORED_USERS?.split(",") || [];
  if (!monitoredUsers.includes(user.id)) {
    monitoredUsers.push(user.id);
    process.env.MONITORED_USERS = monitoredUsers.join(",");
    await interaction.reply(`Now monitoring ${user.username}`);
  } else {
    await interaction.reply(`Already monitoring ${user.username}`);
  }
}
