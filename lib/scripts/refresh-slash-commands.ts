import { REST, Routes } from 'discord.js';
import {commands} from "@/discord/bot/commands";

const rest = new REST({ version: '10' }).setToken(process.env.DISCORD_TOKEN!);

(async () => {
    try {
        console.log('Refreshing slash commands...');
        await rest.put(
            Routes.applicationCommands('1320110014408425492'),
            { body: commands }
        );
        console.log('Slash commands registered successfully.');
    } catch (error) {
        console.error('Error registering commands:', error);
    }
})();
