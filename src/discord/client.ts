import {Client, GatewayIntentBits, Presence} from 'discord.js';
import {presenceStore} from '../store/presence';
import {GatewayClient} from '../gateway/client';
import {Activity} from "../types";
import {config} from "../config";

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

  return {
    track_id: activity.id,
    timestamps: activity.timestamps,
    album: activity.assets?.large_text || '',
    album_art_url: activity.assets?.large_image
        ? `https://i.scdn.co/image/${activity.assets?.large_image.replace('spotify:', '')}`
        : '',
    artist: activity?.name || '',
    song: activity?.details || '',
  };
}


gateway.on('presenceUpdate', async (data: Presence) => {
  const userId = data.user?.id!;
  if (!config.discord.monitoredUsers.includes(userId)) {
    return;
  }
  try {
    const spotifyActivity = data.activities.find((activity) => activity?.type === 2);
    const spotify = parseSpotifyActivity(spotifyActivity as any);

    const existingPresence = await presenceStore.getPresence(userId);
    const kv = existingPresence?.kv || [];
    const badges = existingPresence?.badges || [];
    const user = await client.users.fetch(userId);
    const presence = {
      discord_user: user,
      discord_status: data.status,
      activities: data.activities,
      active_on_discord_web: data.clientStatus?.desktop === 'online',
      active_on_discord_desktop: data.clientStatus?.desktop === 'online',
      active_on_discord_mobile: data.clientStatus?.mobile === 'online',
      listening_to_spotify: Boolean(spotify),
      spotify: spotify || undefined,
      kv: kv,
      badges: badges,
    };

    // @ts-ignore
    await presenceStore.setPresence(userId!, presence);
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