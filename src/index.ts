import { Client, Intents, MessageEmbed, TextChannel } from 'discord.js';
import { User } from './user'
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Queue from 'promise-queue';

const client = new Client({ intents: [Intents.FLAGS.GUILDS, Intents.FLAGS.GUILD_MESSAGES, Intents.FLAGS.GUILD_MESSAGE_REACTIONS, Intents.FLAGS.GUILD_MEMBERS] });
dotenv.config();

const meetMessage = (firstMember: string, secondMember: string) =>
`
Hey ${firstMember}, you have been randomly paired with ${secondMember} for a meeting!

Shoot them a DM/friend request when you can to set up a quick 15 minute call.

Feel free to use this short list of questions to get the conversation going: https://bip.so/@superteamdao/-DBiGW
`

const meetRandomMember = async () => {
    setTimeout(meetRandomMember, 6.048e+8);
	const users = await User.find({});
	const userIDs = users.map((user: any) => user.ID);
    const randomUserID = () => userIDs[Math.floor(Math.random() * userIDs.length)];
    const pairs: any[] = []

    userIDs.forEach((userID: any, index: any) => {
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
			try {
				const firstMember = await client.users.cache.get(pair.first);
				const secondMember = await client.users.cache.get(pair.second);
				if (!firstMember || !secondMember) return
				firstMember.send(meetMessage(firstMember.username, secondMember.username))
				console.log(`Sent DM to ${firstMember.username}`);
				secondMember.send(meetMessage(secondMember.username, firstMember.username))
				console.log(`Sent DM to ${secondMember.username}`);
			} catch (e) {
				console.log("Can't DM user");
			}
        }, index * 3000)
    })
}

client.once('ready', async () => {
	console.log('Ready!');
    setTimeout(meetRandomMember, 6.048e+8);
    setTimeout(sendMeme, 2.592e+8);
	const MONGO_URL: any = process.env.MONGO_URL
	const connection = await mongoose.connect(MONGO_URL);
	console.log(`Connected to MongoDB`);
});

let memes: any[] = [];

client.on('messageCreate', async (message) => {
    if (message.author.bot) return;
    if (message.channel.id === process.env['MEME_CHANNEL'] && message.attachments.size > 0) {
        await message.react('👍')
        memes.push({
            message: message,
            count: 0
        })
    } else if (message.content.toLowerCase() === '!meetamember') {
		try {
			const exists = await User.findOne({ ID: message.author.id });
			if (exists) {
				const deleted = await User.deleteOne({ ID: message.author.id });
				message.reply(`Deleted ${message.author.username} from database`);
				return
			}
			const newUser = new User({ ID: message.author.id })
			await newUser.save()
			message.reply('You have been added to the database!')
		} catch (e) {
			console.log(e)
		}
	}
})

client.on('messageReactionAdd', async (reaction) => {
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
            const generalChannel = await client.channels.cache.get('857091161612484632') as TextChannel;
            generalChannel?.send({ embeds: [memeEmbed] });
        })
    })
    memes = [];
    setTimeout(sendMeme, 2.592e+8);
}

client.login(process.env['TOKEN']);

process.on('uncaughtException', (error) => {
    console.log('Uncaught Exception', error);
});