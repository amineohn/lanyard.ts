import { ChatInputCommandInteraction } from "discord.js";

export async function handleUnsubscribe(
  interaction: ChatInputCommandInteraction
) {
  const user = interaction.options.getUser("user");
  if (!user) {
    await interaction.reply("Please specify a valid user");
    return;
  }

  const monitoredUsers = process.env.MONITORED_USERS?.split(",") || [];
  const index = monitoredUsers.indexOf(user.id);
  if (index > -1) {
    monitoredUsers.splice(index, 1);
    process.env.MONITORED_USERS = monitoredUsers.join(",");
    await interaction.reply(`Stopped monitoring ${user.username}`);
  } else {
    await interaction.reply(`Was not monitoring ${user.username}`);
  }
}
