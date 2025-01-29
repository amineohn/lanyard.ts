import {
  ChatInputCommandInteraction,
  EmbedBuilder,
  ColorResolvable,
} from "discord.js";

export async function handleStatus(interaction: ChatInputCommandInteraction) {
  const monitoredUsers = process.env.MONITORED_USERS?.split(",") || [];
  const userCount = monitoredUsers.length;
  const uptime = Math.floor(process.uptime());

  const embed = new EmbedBuilder()
    .setTitle("Lanyard Status")
    .addFields([
      { name: "Monitored Users", value: userCount.toString(), inline: true },
      { name: "Uptime", value: `${uptime}s`, inline: true },
    ])
    .setColor("#00ff00" as ColorResolvable)
    .setTimestamp();

  await interaction.reply({ embeds: [embed] });
}
