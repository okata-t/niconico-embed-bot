import fs from "fs/promises";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const DB = path.join(__dirname, "../data/quotes.json");

const BOT_ID = "949479338275913799";

export default {

    name: "messageCreate",

    async execute(message) {

        if (message.author.id !== BOT_ID)
            return;

        const attachment = message.attachments.first();

        if (!attachment)
            return;

        const isImage =
            attachment.name?.match(/\.(png|jpg|jpeg|gif|webp)$/i);

        if (!isImage)
            return;

        let quotes = [];

        try {
            quotes = JSON.parse(await fs.readFile(DB, "utf8"));
        } catch {}

        if (quotes.some(q => q.url === attachment.url))
            return;

        quotes.push({
            url: attachment.url,
            messageId: message.id,
            channelId: message.channel.id,
            created: message.createdTimestamp
        });

        await fs.writeFile(
            DB,
            JSON.stringify(quotes, null, 4)
        );

        console.log(`Quote追加: ${attachment.url}`);
    }
};
