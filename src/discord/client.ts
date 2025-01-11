import { Client, GatewayIntentBits } from 'discord.js';
import { config } from '../config';
import { presenceStore } from '../store/presence';
import { GatewayClient } from '../gateway/client';
import {Activity} from "../types";

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
  if (activity.type !== 2 || !activity.syncId) return null;

  return {
    track_id: activity.syncId,
    timestamps: activity.timestamps,
    album: activity.spotify?.largeText || '',
    album_art_url: activity.spotify?.largeImage
      ? `https://i.scdn.co/image/${activity.spotify.largeImage.replace('spotify:', '')}`
      : '',
    artist: activity.state || '',
    song: activity.details || '',
  };
}

gateway.on('presenceUpdate', async (data:any) => {
  const userId = data.user.id;
  if (!config.discord.monitoredUsers.includes(userId)) {
    return;
  }

  try {
    const spotifyActivity = data.activities.find((activity: { type: number; }) => activity.type === 2);
    const spotify = spotifyActivity ? parseSpotifyActivity(spotifyActivity) : undefined;

    const existingPresence = await presenceStore.getPresence(userId);
    const kv = existingPresence?.kv || [];
    const badges = existingPresence?.badges || [];
    const presence = {
      discord_user: {
        id: userId,
        username: data.user.username,
        discriminator: data.user.discriminator,
        avatar: data.user.avatar || '',
        global_name: data.user.global_name,
      },
      discord_status: data.status,
      activities: data.activities,
      active_on_discord_web: data.client_status?.web === 'online',
      active_on_discord_desktop: data.client_status?.desktop === 'online',
      active_on_discord_mobile: data.client_status?.mobile === 'online',
      listening_to_spotify: Boolean(spotify),
      spotify,
      kv,
      badges
    };

    await presenceStore.setPresence(userId, presence as any);
  } catch (error) {
    console.error('Error updating presence:', error);
  }
});

gateway.on('ready', (data) => {
  console.log(`Gateway ready! Connected as ${data.user.username}`);
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