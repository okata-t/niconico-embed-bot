import {
    ChannelType,
    PermissionFlagsBits,
    SlashCommandBuilder
} from "discord.js";

import fs from "fs/promises";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const DB = path.join(__dirname, "../data/quotes.json");

const BOT_ID = "949479338275913799";

export default {

    data: new SlashCommandBuilder()
        .setName("scanquotes")
        .setDescription("Make it a Quote画像を収集")
        .setDefaultMemberPermissions(
            PermissionFlagsBits.Administrator
        ),

    async execute(interaction) {

        await interaction.deferReply();

        let quotes = [];

        try {
            quotes = JSON.parse(await fs.readFile(DB, "utf8"));
        } catch {}

        const exists = new Set(quotes.map(q => q.url));

        const channels = interaction.guild.channels.cache.filter(
            c =>
                c.type === ChannelType.GuildText &&
                c.viewable
        );

        let scanned = 0;
        let added = 0;

        for (const [, channel] of channels) {

            await interaction.editReply(
                `📂 ${channel.name} をスキャン中...`
            );

            let before;

            while (true) {

                let messages;

                try {
                    messages = await channel.messages.fetch({
                        limit: 100,
                        before
                    });
                } catch {
                    break;
                }

                if (!messages.size)
                    break;

                scanned += messages.size;

                for (const msg of messages.values()) {

                    if (msg.author.id !== BOT_ID)
                        continue;

                    const attachment = msg.attachments.first();

                    if (!attachment)
                        continue;

                    const isImage =
                        attachment.name?.match(/\.(png|jpg|jpeg|gif|webp)$/i);

                    if (!isImage)
                        continue;

                    if (exists.has(attachment.url))
                        continue;

                    exists.add(attachment.url);

                    quotes.push({
                        url: attachment.url,
                        messageId: msg.id,
                        channelId: channel.id,
                        created: msg.createdTimestamp
                    });

                    added++;
                }

                before = messages.last().id;
            }
        }

        await fs.writeFile(
            DB,
            JSON.stringify(quotes, null, 4)
        );

        await interaction.editReply(
            `✅ 完了\nスキャン:${scanned}\n追加:${added}\n合計:${quotes.length}`
        );
    }
};
