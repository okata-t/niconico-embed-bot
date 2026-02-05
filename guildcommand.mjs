import { REST, Routes } from 'discord.js';
import 'dotenv/config';
import fs from 'fs';
import path from 'path';
import { pathToFileURL } from 'url';

const commands = [];
const commandsPath = path.resolve('./commands');
const commandFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith('.mjs'));

for (const file of commandFiles) {
    const module = await import(pathToFileURL(path.join(commandsPath, file)).href);
    if ('data' in module) {
        commands.push(module.data.toJSON());
    }
}

const rest = new REST({ version: '10' }).setToken(process.env.DISCORD_TOKEN);

try {
    console.log('Started refreshing application (/) commands.');
    await rest.put(
        // Routes.applicationGuildCommands(process.env.CLIENT_ID, process.env.GUILD_ID),
       Routes.applicationCommands(process.env.CLIENT_ID),
        { body: commands }
    );
    console.log('Successfully reloaded application (/) commands.');
} catch (error) {
    console.error(error);
}
