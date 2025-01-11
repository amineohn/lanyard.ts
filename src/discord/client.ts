import {Client, GatewayIntentBits, Presence} from 'discord.js';
import {config } from '../config';
import {presenceStore} from '../store/presence';
import {GatewayClient} from '../gateway/client';
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
  if (activity.type !== 2 || !activity.application_id) return null;

  return {
    track_id: activity.spotify.track_id,
    timestamps: activity.spotify.timestamps,
    album: activity.spotify.large_text || '',
    album_art_url: activity.spotify.large_image
      ? `https://i.scdn.co/image/${activity.spotify.large_image.replace('spotify:', '')}`
      : '',
    artist: activity.spotify.artist || '',
    song: activity.spotify.song || '',
  };
}

gateway.on('presenceUpdate', async (data: Presence) => {
  const userId = data.user?.id;
  if (!config.discord.monitoredUsers.includes(userId!)) {
    return;
  }

  try {
    const spotifyActivity = data.activities.find((activity: { type: number; }) => activity.type === 2);
    const spotify = spotifyActivity ? parseSpotifyActivity(spotifyActivity as any) : undefined;

    const existingPresence = await presenceStore.getPresence(userId!);
    const kv = existingPresence?.kv || [];
    const badges = existingPresence?.badges || [];
    const presence = {
      discord_user: {
        id: userId,
        username: data.user?.username,
        discriminator: data.user?.discriminator,
        avatar: data.user?.avatar,
        global_name: data.user?.globalName,
      },
      discord_status: data.status,
      activities: data.activities,
      active_on_discord_web: data.clientStatus?.web === 'online',
      active_on_discord_desktop: data.clientStatus?.desktop === 'online',
      active_on_discord_mobile: data.clientStatus?.mobile === 'online',
      listening_to_spotify: Boolean(spotify),
      spotify,
      kv,
      badges
    };

    await presenceStore.setPresence(userId!, presence as any);
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