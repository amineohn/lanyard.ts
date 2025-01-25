import {
  ChatInputCommandInteraction,
  SlashCommandBuilder,
  EmbedBuilder,
  ColorResolvable,
} from "discord.js";
import { presenceStore } from "@/store/presence.store";

export const commands = [
  new SlashCommandBuilder()
    .setName("subscribe")
    .setDescription("Subscribe to presence updates for a user")
    .addUserOption((option) =>
      option
        .setName("user")
        .setDescription("The user to subscribe to")
        .setRequired(true),
    ),

  new SlashCommandBuilder()
    .setName("unsubscribe")
    .setDescription("Unsubscribe from presence updates for a user")
    .addUserOption((option) =>
      option
        .setName("user")
        .setDescription("The user to unsubscribe from")
        .setRequired(true),
    ),

  new SlashCommandBuilder()
    .setName("status")
    .setDescription("Get current status of the bot"),

  new SlashCommandBuilder()
    .setName("kv")
    .setDescription("Manage key-value pairs")
    .addSubcommand((subcommand) =>
      subcommand
        .setName("set")
        .setDescription("Set a key-value pair")
        .addStringOption((option) =>
          option
            .setName("key")
            .setDescription("The key to set")
            .setRequired(true),
        )
        .addStringOption((option) =>
          option
            .setName("value")
            .setDescription("The value to set")
            .setRequired(true),
        ),
    )
    .addSubcommand((subcommand) =>
      subcommand
        .setName("get")
        .setDescription("Get a value by key")
        .addStringOption((option) =>
          option
            .setName("key")
            .setDescription("The key to get")
            .setRequired(true),
        ),
    )
    .addSubcommand((subcommand) =>
      subcommand
        .setName("delete")
        .setDescription("Delete a key-value pair")
        .addStringOption((option) =>
          option
            .setName("key")
            .setDescription("The key to delete")
            .setRequired(true),
        ),
    )
    .addSubcommand((subcommand) =>
      subcommand.setName("list").setDescription("List all key-value pairs"),
    ),
].map((command) => command.toJSON());

export async function handleCommand(
  interaction: ChatInputCommandInteraction,
): Promise<void> {
  const userId = interaction.user.id;

  switch (interaction.commandName) {
    case "subscribe": {
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
      break;
    }

    case "unsubscribe": {
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
      break;
    }

    case "status": {
      const monitoredUsers = process.env.MONITORED_USERS?.split(",") || [];
      const userCount = monitoredUsers.length;
      const uptime = Math.floor(process.uptime());

      const embed = new EmbedBuilder()
        .setTitle("Lanyard Status")
        .addFields([
          {
            name: "Monitored Users",
            value: userCount.toString(),
            inline: true,
          },
          {
            name: "Uptime",
            value: `${uptime}s`,
            inline: true,
          },
        ])
        .setColor("#00ff00" as ColorResolvable)
        .setTimestamp();

      await interaction.reply({ embeds: [embed] });
      break;
    }

    case "kv": {
      const subcommand = interaction.options.getSubcommand();

      switch (subcommand) {
        case "set": {
          const key = interaction.options.getString("key", true);
          const value = interaction.options.getString("value", true);

          await presenceStore.setKV(userId, key, value);
          await interaction.reply(`Set ${key}=${value}`);
          break;
        }

        case "get": {
          const key = interaction.options.getString("key", true);
          const presence = await presenceStore.getPresence(userId);
          const kv = presence?.kv || {};

          if (kv[key]) {
            await interaction.reply(`${key}=${kv[key]}`);
          } else {
            await interaction.reply(`Key "${key}" not found`);
          }
          break;
        }

        case "delete": {
          const key = interaction.options.getString("key", true);
          const presence = await presenceStore.getPresence(userId);

          if (presence?.kv) {
            delete presence.kv[key];
            await presenceStore.setPresence(userId, presence);
            await interaction.reply(`Deleted key "${key}"`);
          } else {
            await interaction.reply(`Key "${key}" not found`);
          }
          break;
        }

        case "list": {
          const presence = await presenceStore.getPresence(userId);
          const kv = presence?.kv || {}; // Ensure kv is an object

          if (Object.keys(kv).length > 0) {
            const kvList = Object.entries(kv)
              .map(([key, value]) => `${key}=${value}`)
              .join("\n");
            await interaction.reply(
              `Key-Value pairs:\n\`\`\`\n${kvList}\n\`\`\``,
            );
          } else {
            await interaction.reply("No key-value pairs found");
          }
          break;
        }
      }
    }
  }
}
