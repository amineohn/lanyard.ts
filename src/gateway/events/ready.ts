import { GatewayPresenceUpdate } from 'discord-api-types/payloads/v10/gateway';
import { Logger } from '../../utility/logger';

export async function handleReady(data: GatewayPresenceUpdate) {
    Logger.success(`Gateway ready! Connected as ${data.user?.username}`);
}