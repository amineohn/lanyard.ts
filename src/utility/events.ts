import { z } from 'zod';
import { Events } from 'discord.js';

const EventSchema = z.enum([Events.ClientReady, Events.PresenceUpdate]);

export const events = {
    ready: EventSchema.parse(Events.ClientReady),
    presence_update: EventSchema.parse(Events.PresenceUpdate),
};
