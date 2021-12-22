import { Client, Intents, MessageEmbed } from 'discord.js';
import dotenv from 'dotenv';
import Queue from 'promise-queue';

const client = new Client({ intents: [Intents.FLAGS.GUILDS, Intents.FLAGS.GUILD_MESSAGES, Intents.FLAGS.GUILD_MESSAGE_REACTIONS, Intents.FLAGS.GUILD_MEMBERS] });
dotenv.config();

const meetMessage = (firstMember, secondMember) =>
`
Hey ${firstMember}, you have been randomly paired with ${secondMember} for a meeting! 

Shoot them a DM/friend request when you can to set up a quick 15 minute call. 

Feel free to use this short list of questions to get the conversation going: https://bip.so/@superteamdao/-DBiGW
`

const meetRandomMember = async () => {

    setTimeout(meetRandomMember, 6.048e+8);
    const superteamServer = await client.guilds.cache.get('857091160295866388');
    const serverMembers = await superteamServer.members.fetch()
    const daoMembers = serverMembers.map((member) => member._roles.includes('890523787475439646') ? member : null).filter((member) => member !== null);
    const userIDs = daoMembers.map((member) => member.user.id);
    const randomUserID = () => userIDs[Math.floor(Math.random() * userIDs.length)];
    const pairs = []

    userIDs.forEach((userID, index) => {
        userIDs.splice(index, 1);
        const randomPerson = randomUserID();
        const randomIndex = userIDs.indexOf(randomPerson);
        userIDs.splice(randomIndex, 1);
        pairs.push({
            first: userID,
            second: randomPerson
        })
    })

    pairs.forEach((pair, index) => {
        setTimeout(async () => {
            const firstMember = await client.users.cache.get(pair.first);
            const secondMember = await client.users.cache.get(pair.second);
            firstMember.send(meetMessage(firstMember.username, secondMember.username))
                .catch((e) => console.log(e));
            console.log(`Sent DM to ${firstMember.username}`);
            secondMember.send(meetMessage(secondMember.username, firstMember.username))
                .catch((e) => console.log(e));
            console.log(`Sent DM to ${secondMember.username}`);
        }, index * 3000)
    })
}

// const override = async () => {
//     const memeEmbed = new MessageEmbed()
//         .setAuthor("MemeCodeMoney#5705", "https://cdn.discordapp.com/avatars/839233984059408448/6b69c19a6fb905311a1916f244c6b1c2.webp?size=80")
//         .setColor('#2f3137')
//         .setTitle('Top Voted Meme in the last 7 days')
//         .setImage("https://cdn.discordapp.com/attachments/894872542312013864/899984572975038464/nms3ku.jpg")
//         .setFooter(`Upvotes 👍  — 11`)
//         .setTimestamp()
//     const generalChannel = await client.channels.cache.get('857091161612484632')
//     generalChannel.send({ embeds: [memeEmbed] });
// }

client.once('ready', () => {
	console.log('Ready!');
    setTimeout(meetRandomMember, 6.048e+8);
    setTimeout(sendMeme, 2.592e+8);
    // override();
});

let memes = [];

client.on('messageCreate', async (message) => {
    if (message.author.bot) return;
    if (message.channel.id === process.env['MEME_CHANNEL'] && message.attachments.size > 0) {
        await message.react('👍')
        memes.push({
            message: message,
            count: 0
        })
    }
    // } else if (message.channel.id === process.env['MEME_CHANNEL'] && (!message.author.bot)) {
    //     message.delete();
    //     const dontSendEmbed = new MessageEmbed()
    //         .setColor('RANDOM')
    //         .setTitle('You can\'t send messages other than memes here 😇')
    //     message.channel.send({ embeds: [dontSendEmbed] }).then((dontSendMessage) => {
    //         setTimeout(() => {
    //             dontSendMessage.delete();
    //         }, 3000);
    //     });
    // }
})

client.on('messageReactionAdd', async (reaction, user) => {
    if (reaction.message.channel.id === process.env['MEME_CHANNEL'] && reaction.emoji.name === '👍') {
        setTimeout(() => {
            memes.forEach((meme) => {
                if (meme['message'].id === reaction.message.id) {
                    meme['count'] += 1;
                }
            })
        }, 3000);
    }
})

function sendMeme() {
    const memeUpvotes = memes.map((meme) => meme.count);
    const highestMemeUpvote = Math.max(...memeUpvotes);
    const topMemes = memes.filter((meme) => meme.count === highestMemeUpvote);
    const queue = new Queue(1, Infinity);
    topMemes.forEach((meme) => {
        const memeMessage = meme.message;
        const memeEmbed = new MessageEmbed()
            .setAuthor(memeMessage.author.username, memeMessage.author.avatarURL())
            .setColor('#2f3137')
            .setTitle('Top Voted Meme in 3 days')
            .setImage(memeMessage.attachments.first().url)
            .setFooter(`Upvotes 👍  — ${meme.count}`)
            .setTimestamp()
        queue.add(async () => {
            const generalChannel = await client.channels.cache.get('857091161612484632')
            generalChannel.send({ embeds: [memeEmbed] });
        })
    })
    memes = [];
    setTimeout(sendMeme, 2.592e+8);
}

client.login(process.env['TOKEN']);

process.on('uncaughtException', (error) => {
    console.log('Uncaught Exception', error);
});