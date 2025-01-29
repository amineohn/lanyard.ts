import { GatewayPresenceUpdate } from "discord-api-types/payloads/v10/gateway";
import { Logger } from "#/utils/logger";

/**
 * Handles the ready event from Discord gateway
 * @param data The ready event data from Discord gateway
 */
export async function handleReady(data: GatewayPresenceUpdate) {
  const username = data.user?.username;
  if (!username) {
    Logger.error("Ready event received but no username found in data");
    return;
  }

  try {
    Logger.success(`Gateway ready! Connected as ${username}`);
  } catch (error) {
    Logger.error(
      `Error handling ready event: ${error instanceof Error ? error.message : "Unknown error"}`
    );
    throw error;
  }
}
