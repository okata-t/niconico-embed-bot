import { SlashCommandBuilder } from 'discord.js';
import fs from 'fs/promises';

export const data = new SlashCommandBuilder()
  .setName("janken")
    .setDescription("ヒカマニじゃんけん");
  
export async function execute(interaction) {
    
    await interaction.reply(`ｼﾞｬﾝｹﾝﾀ~ｲﾑ 行きますよー最初はブンブンじゃんけん...`);
    
    const sleep = ms => new Promise(resolve => setTimeout(resolve, ms));
    await sleep(2000);

  try {
        // ファイルを読み込む
        const data = await fs.readFile('./commands/word.txt', 'utf-8'); // words.txt は同じディレクトリに置く
        const arr = data.split(/\r?\n/).filter(line => line.trim() !== ''); // 空行を除外
        
        const randomIndex = Math.floor(Math.random() * arr.length);
        const word = arr[randomIndex];

        await interaction.followUp(word);
    } catch (err) {
        console.error(err);
        await interaction.followUp('ファイルの読み込みに失敗しました');
    }
}
