import { Client, Intents, MessageEmbed } from 'discord.js';
import dotenv from 'dotenv';
import Queue from 'promise-queue';

const client = new Client({ intents: [Intents.FLAGS.GUILDS, Intents.FLAGS.GUILD_MESSAGES, Intents.FLAGS.GUILD_MESSAGE_REACTIONS] });
dotenv.config();

client.once('ready', () => {
	console.log('Ready!');
    setTimeout(sendDailyMeme, 8.64e+7);
});

let memes = [];

client.on('messageCreate', async (message) => {
    if (message.author.bot) return;
    if (message.channel.id === process.env['MEME_CHANNEL'] && message.attachments.size > 0) {
        await message.react('👍')
        memes.push({
            message: message.id,
            count: 0
        })
    } else if (message.channel.id === process.env['MEME_CHANNEL']) {
        message.delete();
        const dontSendEmbed = new MessageEmbed()
            .setColor('RANDOM')
            .setTitle('You can\'t send messages other than memes here 😇')
        message.channel.send({ embeds: [dontSendEmbed] }).then((dontSendMessage) => {
            setTimeout(() => {
                dontSendMessage.delete();
            }, 3000);
        });
    }
})

client.on('messageReactionAdd', async (reaction, user) => { 
    if (reaction.message.channel.id === process.env['MEME_CHANNEL'] && reaction.emoji.name === '👍') {
        setTimeout(() => {
            memes.forEach((meme) => {
                if (meme['message'] === reaction.message.id) {
                    meme['count'] += 1;
                }
            })
        }, 3000);
    }
})

function sendDailyMeme() {
    const memeUpvotes = memes.map((meme) => meme.count);
    const highestMemeUpvote = Math.max(...memeUpvotes);
    const topMemes = memes.filter((meme) => meme.count === highestMemeUpvote);
    const queue = new Queue(1, Infinity);
    topMemes.forEach((meme) => {
        const memeMessage = client.channels.cache.get(process.env['MEME_CHANNEL']).messages.cache.get(meme.message);
        const memeEmbed = new MessageEmbed()
            .setAuthor(memeMessage.author.username, memeMessage.author.avatarURL())
            .setColor('#2f3137')
            .setTitle('Top Voted Meme for Today')
            .setImage(memeMessage.attachments.first().url)
            .setFooter(`Upvotes 👍  — ${meme.count}`)
            .setTimestamp()
        queue.add(() => {
            memeMessage.channel.send({ embeds: [memeEmbed] });
        })
    })
    memes = [];
    setTimeout(sendDailyMeme, 8.64e+7);
}

client.login(process.env['TOKEN']);

process.on('uncaughtException', () => {
    console.log('Uncaught Exception');
    process.exit(1);
});