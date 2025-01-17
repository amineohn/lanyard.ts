import { Logger } from '../../utility/logger';
import { Client } from 'discord.js';

export function handleClientReady(client: Client) {
    Logger.success(`Logged in as ${client.user?.tag}!`);
}
