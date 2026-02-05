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

// ./commands フォルダ内の .mjs を読み込む
const commandsPath = path.resolve('./commands');
const commandFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith('.mjs'));

for (const file of commandFiles) {
    const filePath = path.join(commandsPath, file);
    const fileUrl = pathToFileURL(filePath).href; // ← Windows対応＆エスケープ済み URL
    const module = await import(fileUrl);
    if ('data' in module && 'execute' in module) {
        client.commands.set(module.data.name, module);
    } else {
        console.log(`[WARNING] ${file} は正しいコマンドモジュールではありません`);
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

client.on("messageCreate", async (message) => {
  if (message.author.bot) return;

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
