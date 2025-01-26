import { config } from "@/utils/config";
import { client } from "@/discord/client";
import { Activity, DiscordUser, LanyardData } from "@/types/lanyard";
import { store } from "@/store/presence.store";
import { PresenceUpdateReceiveStatus, UserFlagsBitField } from "discord.js";
import { Logger } from "@/utils/logger";
import { GatewayPresenceUpdate } from "discord-api-types/payloads/v10/gateway";
import { parseSpotifyActivity } from "@/utils/parse-spotify-activity";
import { resolveUserFlags } from "@/utils/resolve-user-flags";

/**
 * Handles Discord presence updates for monitored users
 * @param data The presence update data from Discord gateway
 */
export async function handlePresenceUpdate(data: GatewayPresenceUpdate) {
  const userId = data.user?.id;
  if (!userId || !config.discord.monitoredUsers.includes(userId)) {
    return;
  }

  try {
    const spotifyActivity = data.activities.find(
      (activity) => activity.type === 2,
    ) as Activity | undefined;

    const spotify = spotifyActivity
      ? parseSpotifyActivity(spotifyActivity)
      : null;

    if (!spotifyActivity) {
      return;
    }

    if (!spotify?.track_id) {
      return;
    }

    // Get existing presence and user data
    const [existingPresence, user] = await Promise.all([
      store.getPresence(userId),
      client.users.fetch(userId),
    ]);

    const flags = user.flags || new UserFlagsBitField(0);
    const badges = resolveUserFlags(flags.bitfield);

    const discordUser = {
      id: user.id ?? "",
      bot: user.bot,
      avatar: user.avatar ?? "",
      username: user.username ?? "",
      avatar_decoration_data: null,
      discriminator: user.discriminator ?? "",
      globalName: user.globalName ?? "",
      flags: flags,
    } satisfies DiscordUser;

    const isActiveOnPlatform = (status?: PresenceUpdateReceiveStatus) =>
      status === "online" ||
      status === "idle" ||
      status === "dnd" ||
      status === "offline";

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
        (activity) => activity.type !== 2,
      ) as Activity[],
      listening_to_spotify: !!spotifyActivity,
      spotify: spotify,
      active_on_discord_web: activeOnDiscord.web,
      active_on_discord_desktop: activeOnDiscord.desktop,
      active_on_discord_mobile: activeOnDiscord.mobile,
      kv: existingPresence?.kv ?? {},
    } satisfies LanyardData;

    await store.setPresence(userId, presence);
  } catch (error) {
    Logger.error(
      `Error updating presence for user ${userId}: ${error instanceof Error ? error.message : "Unknown error"}`,
    );
    throw error;
  }
}
