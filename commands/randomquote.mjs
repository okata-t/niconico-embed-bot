import {
    SlashCommandBuilder
} from "discord.js";

import fs from "fs/promises";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DB = path.join(__dirname, "../data/quotes.json");

export default {
    data: new SlashCommandBuilder()
        .setName("randomquote")
        .setDescription("ランダムなQuote画像を表示"),

    async execute(interaction) {

        let quotes = [];

        try {
            quotes = JSON.parse(await fs.readFile(DB, "utf8"));
        } catch {
            return interaction.reply("データがありません。");
        }

        if (!quotes.length)
            return interaction.reply("画像がありません。");

        const quote =
            quotes[Math.floor(Math.random() * quotes.length)];

        await interaction.reply({
            files: [quote.url]
        });
    }
};
