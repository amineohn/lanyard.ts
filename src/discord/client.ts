import {
  Client,
  GatewayIntentBits,
  Interaction,
  PresenceUpdateReceiveStatus,
  UserFlagsBitField
} from 'discord.js';
import {presenceStore} from '../store/presence';
import {GatewayClient} from '../gateway/client';
import {Activity, DiscordUser, Kv, LanyardData} from "../types";
import {config} from "../config";
import {handleCommand} from "./commands";
import {Logger} from "../utility/logger";
import {GatewayPresenceUpdate} from "discord-api-types/payloads/v10/gateway";

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
  if (activity?.type !== 2 || !activity.id) {
    return undefined;
  }

  const timestamps = {
    start: activity.timestamps?.start ?? null,
    end: activity.timestamps?.end ?? null,
  };

  if (!timestamps.start || !timestamps.end || Date.now() < timestamps.start || Date.now() > timestamps.end) {
    console.log("Spotify activity detected but not playing a valid track.");
    return undefined;
  }

  return {
    track_id: activity.id,
    timestamps,
    album: activity.assets?.large_text ?? 'Unknown Album',
    album_art_url: activity.assets?.large_image
        ? `https://i.scdn.co/image/${activity.assets.large_image.replace('spotify:', '')}`
        : '',
    artist: activity.state ?? 'Unknown Artist',
    song: activity.details ?? 'Unknown Song',
  };
}


client.once('ready', () => {
  Logger.success(`Logged in as ${client.user?.tag}!`);
});

client.on('interactionCreate', async (interaction: Interaction) => {
  if (!interaction.isChatInputCommand()) return;

  try {
    await handleCommand(interaction);
  } catch (error) {
    Logger.error(`Error handling command: ${error}`);
    if (interaction.isRepliable()) {
      await interaction.reply({
        content: 'There was an error processing your command.',
        ephemeral: true,
      });
    }
  }
});

gateway.on('presenceUpdate', async (data: GatewayPresenceUpdate) => {
  const userId = data.user?.id!;
  if (!config.discord.monitoredUsers.includes(userId)) {
    return;
  }

  try {
    const spotifyActivity = data.activities.find((activity) => activity.type === 2) as unknown as Activity | undefined;
    const spotify = spotifyActivity ? parseSpotifyActivity(spotifyActivity) : null

    if (!spotifyActivity) {
      console.log("No Spotify activity found.");
    } else if (!spotify.track_id) {
      console.log("Spotify activity found but parsing failed or track is not active:", spotifyActivity);
    }

    const existingPresence = await presenceStore.getPresence(userId);
    const kv = existingPresence?.kv || [];
    const user = await client.users.fetch(userId);

    const resolveFlags = (flags: number): string[] => {
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
      flags,
      id: user.id ?? '',
      discriminator: user.discriminator ?? '',
      bot: user.bot,
      avatar: user.avatar ?? '',
      avatar_decoration_data: null,
    } satisfies DiscordUser
    const isActiveOnPlatform = (status?: PresenceUpdateReceiveStatus) => {
      return status === 'online' || status === 'idle' || status === 'dnd' || status === 'offline';
    };
    const status = data.status as 'online' | 'idle' | 'dnd' | 'invisible';
    const clientStatus = data.client_status || {}
    const active_on_discord_web = isActiveOnPlatform(clientStatus?.web);
    const active_on_discord_desktop = isActiveOnPlatform(clientStatus?.desktop);
    const active_on_discord_mobile = isActiveOnPlatform(clientStatus?.mobile);
    const presence = {
      discord_user: discordUser,
      discord_status: status,
      activities: data.activities.filter((activity) => activity.type !== 2) as unknown as Activity[],
      listening_to_spotify: !!spotifyActivity,
      spotify,
      active_on_discord_web: active_on_discord_web,
      active_on_discord_desktop: active_on_discord_desktop,
      active_on_discord_mobile: active_on_discord_mobile,
      kv: kv as Kv,
      badges,
    } satisfies LanyardData

    await presenceStore.setPresence(userId, presence);
  } catch (error) {
    Logger.error(`Error updating presence for user ${userId}: ${error.message}`);
  }
});


gateway.on('ready', (data: GatewayPresenceUpdate) => {
  Logger.success(`Gateway ready! Connected as ${data.user?.username}`);
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