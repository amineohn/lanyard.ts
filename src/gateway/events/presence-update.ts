import {config} from "../../config";
import {client} from "../../discord/client";
import {Activity, DiscordUser, Kv, LanyardData} from "../../types";
import {presenceStore} from "../../store/presence";
import {PresenceUpdateReceiveStatus, UserFlagsBitField} from "discord.js";
import {Logger} from "../../utility/logger";
import {GatewayPresenceUpdate} from "discord-api-types/payloads/v10/gateway";
import {parseSpotifyActivity} from "../../utility/parse-spotify-activity";
import {resolveUserFlags} from "../../utility/resolve-user-flags";

export async function handlePresenceUpdate(data: GatewayPresenceUpdate) {
    const userId = data.user?.id!;
    if (!config.discord.monitoredUsers.includes(userId)) return;

    try {
        const spotifyActivity = data.activities.find((activity) => activity.type === 2) as Activity || undefined;
        const spotify = spotifyActivity ? parseSpotifyActivity(spotifyActivity) : null;

        if (!spotifyActivity) console.log("No Spotify activity found.");
        else if (!spotify.track_id) console.log("Spotify activity found but parsing failed or track is not active:", spotifyActivity);

        const existingPresence = await presenceStore.getPresence(userId);
        const kv = existingPresence?.kv || [];
        const user = await client.users.fetch(userId);

        const flags = user.flags || new UserFlagsBitField(0);
        const badges = resolveUserFlags(flags.bitfield);

        const discordUser: DiscordUser = {
            username: user.username ?? '',
            globalName: user.globalName ?? '',
            flags,
            id: user.id ?? '',
            discriminator: user.discriminator ?? '',
            bot: user.bot,
            avatar: user.avatar ?? '',
            avatar_decoration_data: null,
        };

        const isActiveOnPlatform = (status?: PresenceUpdateReceiveStatus) =>
            status === 'online' || status === 'idle' || status === 'dnd' || status === 'offline';

        const status = data.status as 'online' | 'idle' | 'dnd' | 'invisible';
        const clientStatus = data.client_status || {};
        const activeOnDiscord = {
            web: isActiveOnPlatform(clientStatus?.web),
            desktop: isActiveOnPlatform(clientStatus?.desktop),
            mobile: isActiveOnPlatform(clientStatus?.mobile),
        };

        const presence: LanyardData = {
            discord_user: discordUser,
            discord_status: status,
            activities: data.activities.filter((activity) => activity.type !== 2) as Activity[],
            listening_to_spotify: !!spotifyActivity,
            spotify,
            active_on_discord_web: activeOnDiscord.web,
            active_on_discord_desktop: activeOnDiscord.desktop,
            active_on_discord_mobile: activeOnDiscord.mobile,
            kv: kv as Kv,
            badges,
        };

        await presenceStore.setPresence(userId, presence);
    } catch (error) {
        Logger.error(`Error updating presence for user ${userId}: ${error.message}`);
    }
}
