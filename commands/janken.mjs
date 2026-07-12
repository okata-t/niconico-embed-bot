import { SlashCommandBuilder } from "discord.js";
import fs from "fs/promises";

export default {
    data: new SlashCommandBuilder()
        .setName("janken")
        .setDescription("ヒカマニじゃんけん"),

    async execute(interaction) {

        await interaction.reply(
            "ｼﾞｬﾝｹﾝﾀ~ｲﾑ 行きますよー最初はブンブンじゃんけん..."
        );

        const sleep = ms => new Promise(resolve => setTimeout(resolve, ms));
        await sleep(2000);

        try {
            const data = await fs.readFile("./commands/word.txt", "utf8");

            const arr = data
                .split(/\r?\n/)
                .filter(line => line.trim());

            const word = arr[Math.floor(Math.random() * arr.length)];

            await interaction.followUp(word);

        } catch (err) {
            console.error(err);
            await interaction.followUp("ファイルの読み込みに失敗しました");
        }
    }
};
