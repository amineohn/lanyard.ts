import { config } from "#/utils/config";
import { client } from "#/bot/client";
import type { Activity, DiscordUser, LanyardData } from "#/types/lanyard";
import { store } from "#/store/presence.store";
import {
  type PresenceUpdateReceiveStatus,
  UserFlagsBitField,
} from "discord.js";
import { Logger } from "#/utils/logger";
import type { GatewayPresenceUpdate } from "discord-api-types/payloads/v10/gateway";
import { parseSpotifyActivity } from "#/utils/parse-spotify-activity";
import { resolveUserFlags } from "#/utils/resolve-user-flags";

function isUserMonitored(userId: string): boolean {
  return (
    config.discord.monitoredUsers.length === 0 ||
    config.discord.monitoredUsers.includes(userId)
  );
}

function createDiscordUser(user: DiscordUser) {
  return {
    id: user.id ?? "",
    bot: user.bot,
    avatar: user.avatar ?? "",
    username: user.username ?? "",
    avatar_decoration_data: null,
    discriminator: user.discriminator ?? "",
    globalName: user.globalName ?? "",
    flags: user.flags || new UserFlagsBitField(0),
  };
}

function isActiveOnPlatform(status?: PresenceUpdateReceiveStatus): boolean {
  return (
    status === "online" ||
    status === "idle" ||
    status === "dnd" ||
    status === "offline"
  );
}

export async function handlePresenceUpdate(data: GatewayPresenceUpdate) {
  const userId = data.user?.id;
  if (!userId || !isUserMonitored(userId)) {
    return;
  }

  try {
    const spotifyActivity = data.activities.find(
      (activity) => activity.type === 2
    ) as Activity | undefined;
    const spotify = spotifyActivity
      ? parseSpotifyActivity(spotifyActivity)
      : null;

    const now = Date.now();
    const isCurrentlyPlaying =
      spotify?.timestamps &&
      now >= spotify.timestamps.start &&
      now <= spotify.timestamps.end;

    const listeningToSpotify = !!spotify && isCurrentlyPlaying;

    // Get existing presence and user data
    const [existingPresence, user] = await Promise.all([
      store.get(userId),
      client.users.fetch(userId),
    ]);

    const discordUser = createDiscordUser(user);
    const badges = resolveUserFlags(discordUser.flags.bitfield);

    const status = data.status as "online" | "idle" | "dnd" | "invisible";
    const clientStatus = data.client_status || {};

    const activeOnDiscord = {
      web: isActiveOnPlatform(clientStatus.web),
      desktop: isActiveOnPlatform(clientStatus.desktop),
      mobile: isActiveOnPlatform(clientStatus.mobile),
    };

    const presence = {
      discord_user: discordUser,
      badges: badges,
      discord_status: status,
      activities: data.activities.filter(
        (activity) => activity.type !== 2
      ) as Activity[],
      listening_to_spotify: listeningToSpotify,
      spotify: listeningToSpotify ? spotify : null,
      active_on_discord_web: activeOnDiscord.web,
      active_on_discord_desktop: activeOnDiscord.desktop,
      active_on_discord_mobile: activeOnDiscord.mobile,
      kv: existingPresence?.kv ?? {},
    } satisfies LanyardData;

    if (!existingPresence) {
      Logger.info(`Adding new user ${userId} to presence store`);
      await store.add(userId, presence);
    } else {
      await store.set(userId, presence);
    }
  } catch (error) {
    Logger.error(
      `Error updating presence for user ${userId}: ${error instanceof Error ? error.message : "Unknown error"}`
    );
  }
}
