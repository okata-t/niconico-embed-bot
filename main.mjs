import * as cheerio from "cheerio";
import { Client, Collection, EmbedBuilder, GatewayIntentBits } from "discord.js";
import dotenv from "dotenv";
import express from "express";
import fs from "fs";
import path from "path";
import { pathToFileURL } from 'url';

dotenv.config();

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent
  ],
});

client.commands = new Collection();

// ./events フォルダ内の .mjs を読み込む
const eventsPath = path.resolve("./events");
const eventFiles = fs.readdirSync(eventsPath).filter(file => file.endsWith(".mjs"));

for (const file of eventFiles) {
    const filePath = path.join(eventsPath, file);
    const fileUrl = pathToFileURL(filePath).href;

    const imported = await import(fileUrl);
    const event = imported.default ?? imported;

    if (!event?.name || !event?.execute) {
        console.log(`[WARNING] ${file} は正しいイベントモジュールではありません`);
        continue;
    }

    if (event.once) {
        client.once(event.name, (...args) => event.execute(...args, client));
    } else {
        client.on(event.name, (...args) => event.execute(...args, client));
    }

    console.log(`✅ Event ${event.name} を読み込みました`);
}

// ./commands フォルダ内の .mjs を読み込む
const commandsPath = path.resolve('./commands');
const commandFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith('.mjs'));

for (const file of commandFiles) {
    const filePath = path.join(commandsPath, file);
    const fileUrl = pathToFileURL(filePath).href;

    const imported = await import(fileUrl);

    // default形式・名前付き形式の両方に対応
    const command = imported.default ?? imported;

    if (command?.data && command?.execute) {
        console.log(`✅ ${command.data.name} を読み込みました`);
        client.commands.set(command.data.name, command);
    } else {
        console.log(`⚠️ ${file} は正しいコマンドモジュールではありません`);
    }
}

// InteractionCreate
client.on('interactionCreate', async interaction => {
    if (!interaction.isChatInputCommand()) return;

    const command = client.commands.get(interaction.commandName);
    if (!command) return;

    try {
        await command.execute(interaction);
    } catch (error) {
        console.error(error);
        await interaction.reply({ content: 'エラーが発生しました', ephemeral: true });
    }
});


client.once("ready", () => {
  console.log(`Logged in as ${client.user.tag}`);
});

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const DB = path.join(__dirname, "../data/quotes.json");

client.on("messageUpdate", async (oldMessage, newMessage) => {
   if (newMessage.author.id !== "949479338275913799")
              return;

          const attachment = newMessage.attachments.first();
  
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
              messageId: newMessage.id,
              channelId: newMessage.channel.id,
              created: newMessage.createdTimestamp
          });

          await fs.writeFile(DB, JSON.stringify(quotes, null, 4), (err) => {
    if (err) console.error(err);
});

          console.log(`Quote追加: ${attachment.url}`);
});

client.on("messageCreate", async (message) => {


  // nicovideo URL or sm番号を検出
  const match =
    message.content.match(/sm\d+/);

  if (!match) return;

  const videoId = match[0];
  const proxyUrl = `https://nicovideo.gay/watch/${videoId}`;
  const originalUrl = `https://www.nicovideo.jp/watch/${videoId}`;

  try {
    const res = await fetch(proxyUrl, {
      headers: {
        "User-Agent":"Twitterbot/1.0",
        "Accept-Language": "ja-JP"
      }
    });
    const html = await res.text();
    const $ = cheerio.load(html);
    console.log(html)

    const title =
      $('meta[property="og:title"]').attr("content");

    const image =
      $('meta[property="og:image"]').attr("content");
    
    const description =
      $('meta[property="og:description"]').attr("content");
    
    const video =
      $('meta[property="og:video:url"]').attr("content");
    
    const release_date =
      $('meta[property="video:release_date"]').attr("content");
    
    const fixed = release_date.replace(/([+-]\d{2})(\d{2})$/, "$1:$2");

    const date = new Date(fixed);

    await message.suppressEmbeds(true);
    const embed = new EmbedBuilder()
      .setTitle(title)
      .setURL(originalUrl)
      .setDescription(description)
      .setImage(image)
      .setTimestamp(date)
      .setColor(0x52c7ea);

    await message.channel.send(video);
    await message.channel.send({
      embeds: [embed]
    });

  } catch (err) {
    console.error(err);
  }
});

client.on('error', (error) => {
    console.error('❌ Discord クライアントエラー:', error);
});


console.log("TOKEN exists:", !!process.env.DISCORD_TOKEN);


console.log('🔄 Discord に接続中...');
client.login(process.env.DISCORD_TOKEN)
  .catch(err => {
    console.error("❌ Discord login failed:", err);
  });
const app = express();
const port = process.env.PORT || 3000;

// ヘルスチェック用エンドポイント
app.get('/', (req, res) => {
    res.json({
        status: 'Bot is running! 🤖',
        uptime: process.uptime(),
        timestamp: new Date().toISOString()
    });
});

// サーバー起動
app.listen(port, () => {
    console.log(`🌐 Web サーバーがポート ${port} で起動しました`);
});
