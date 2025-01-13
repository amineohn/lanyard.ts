import {Client, GatewayIntentBits, Interaction, Presence, UserFlagsBitField} from 'discord.js';
import {presenceStore} from '../store/presence';
import {GatewayClient} from '../gateway/client';
import {Activity, DiscordUser, Kv, LanyardData, Timestamps} from "../types";
import {config} from "../config";
import {handleCommand} from "./commands";

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildPresences,
    GatewayIntentBits.GuildMembers,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
  ]
});

const gateway = new GatewayClient();

function parseSpotifyActivity(activity: Activity) {
  if (activity?.type !== 2 || !activity.id) return undefined;

  const timestamps: Timestamps = {
    start: activity.timestamps?.start ?? null,
    end: activity.timestamps?.end ?? null,
  };

  return {
    track_id: activity.id,
    timestamps,
    album: activity.assets?.large_text,
    album_art_url: activity.assets?.large_image
        ? `https://i.scdn.co/image/${activity.assets?.large_image.replace('spotify:', '')}`
        : '',
    artist: activity?.name,
    song: activity?.details,
  };
}


client.once('ready', () => {
  console.log(`Logged in as ${client.user?.tag}!`);
});

client.on('interactionCreate', async (interaction: Interaction) => {
  if (!interaction.isChatInputCommand()) return;

  try {
    await handleCommand(interaction);
  } catch (error) {
    console.error('Error handling command:', error);
    if (interaction.isRepliable()) {
      await interaction.reply({
        content: 'There was an error processing your command.',
        ephemeral: true,
      });
    }
  }
});

gateway.on('presenceUpdate', async (data: Presence) => {
  const userId = data.user?.id!;
  if (!config.discord.monitoredUsers.includes(userId)) {
    return;
  }
  try {
    const spotifyActivity = data.activities.find((activity) => activity.type === 2) as unknown as Activity;
    if (!spotifyActivity) {
      return;
    }

    const spotify = parseSpotifyActivity(spotifyActivity)
    const existingPresence = await presenceStore.getPresence(userId);
    const kv = existingPresence?.kv || [];
    const user = await client.users.fetch(userId)

    const resolveFlags = (flags: number) => {
      const badgeList: string[] = [];

      const FLAG_STAFF = 1 << 0; // 1
      const FLAG_PARTNER = 1 << 1; // 2
      const FLAG_HYPESQUAD = 1 << 2; // 4
      const FLAG_BUGHUNTER = 1 << 3; // 8
      const FLAG_HYPESQUAD_EVENTS = 1 << 6; // 64
      const FLAG_PREFERRED_LANGUAGE = 1 << 7; // 128
      const FLAG_NOTIFICATIONS = 1 << 8; // 256

      if (flags & FLAG_STAFF) badgeList.push('STAFF');
      if (flags & FLAG_PARTNER) badgeList.push('PARTNER');
      if (flags & FLAG_HYPESQUAD) badgeList.push('HYPESQUAD');
      if (flags & FLAG_BUGHUNTER) badgeList.push('BUGHUNTER');
      if (flags & FLAG_HYPESQUAD_EVENTS) badgeList.push('HYPESQUAD_EVENTS');
      if (flags & FLAG_PREFERRED_LANGUAGE) badgeList.push('PREFERRED_LANGUAGE');
      if (flags & FLAG_NOTIFICATIONS) badgeList.push('NOTIFICATIONS');

      return badgeList;
    };

    const flags = user.flags || new UserFlagsBitField(0);

    const badges = resolveFlags(flags.bitfield);

    const discordUser = {
      username: user.username ?? '',
      globalName: user.globalName ?? '',
      flags: flags,
      id: user.id ?? '',
      discriminator: user.discriminator ?? '',
      bot: user.bot,
      avatar: user.avatar ?? '',
      avatar_decoration_data: null,
    } satisfies DiscordUser

    const status = data.status as 'online' | 'idle' | 'dnd' | 'invisible';

    const presence = {
      discord_user: discordUser,
      discord_status: status,
      activities: data.activities as unknown as Activity[],
      spotify: spotify,
      listening_to_spotify: Boolean(spotify),
      active_on_discord_web: data.clientStatus?.web === 'online',
      active_on_discord_desktop: data.clientStatus?.desktop === 'online',
      active_on_discord_mobile: data.clientStatus?.mobile === 'online',
      kv: kv as Kv,
      badges,
    } satisfies LanyardData

    await presenceStore.setPresence(userId, presence);
  } catch (error) {
    console.error('Error updating presence:', error);
  }
});

gateway.on('ready', (data: Presence) => {
  console.log(`Gateway ready! Connected as ${data.user?.username}`);
});

process.on('SIGINT', () => {
  gateway.destroy();
  process.exit(0);
});

process.on('SIGTERM', () => {
  gateway.destroy();
  process.exit(0);
});

export { client, gateway };