const { Client, Events, GatewayIntentBits, ActionRowBuilder, ButtonBuilder, Collection } = require("discord.js");
const {token} = require("./config.json")
const fs = require('node:fs')
const DBClient = require('./db/DBClient')

const { MessageFlags, ButtonStyle } = require('discord-api-types/v10');
const ephemeral = MessageFlags.Ephemeral

const client = new Client({
	intents: [
		GatewayIntentBits.Guilds,
		GatewayIntentBits.GuildMessages,
		GatewayIntentBits.MessageContent,
		GatewayIntentBits.GuildMembers,
        GatewayIntentBits.GuildMessageReactions,
        GatewayIntentBits.GuildPresences
	],
});

client.db = new DBClient()

client.commands = getCommands('./commands');
client.hubCommands = getCommands('./hubCommands')

client.logQueue = []

client.getUUID = async (username) => {
    const url = `https://playerdb.co/api/player/minecraft/${username}`
    const data = await fetch(url).then(response => response.json())
    
    try {
        if (data.success && data.data?.player) {
            return data.data.player.id.replaceAll('-', '')
        } else {
            return undefined
        }

    } catch (error) {
        console.error('Error fetching UUID:', error)
    }
}

client.hasPermission = async (interaction, permissionType) => {
    const memberRoles = interaction.member.roles.cache
    const dbRoles = await client.db.getSetupRoles(interaction.guild.id, permissionType)

    for (const role of dbRoles) {
        if (memberRoles.has(role)) {
            return true
        }
    }
    return false
}

client.log = async () => {
    if (client.logQueue.length) client.consoleChannel.send(`\`\`\`ansi\n${client.logQueue.join('\n')}\n\`\`\``)
    client.logQueue = []
}

client.logInteraction = async (interaction) => {
    client.logQueue.push(`\u001b[0;1;31m${interaction.customId ? "Button" : "Interaction"} \u001b[0;1m${interaction.customId ? interaction.customId : interaction}\u001b[0;31m ran by \u001b[0;1m${interaction.user.tag} \u001b[0;34m[${interaction.user.id}] \u001b[0;31min \u001b[0;1m${interaction.guild.name}`)
}

client.once(Events.ClientReady, (c) => {
    console.log(`Logged in as ${c.user.tag}`);
    client.globalChannel = client.channels.cache.get('1373319736523358278')
    client.consoleChannel = client.channels.cache.get('1385866262449750147')
    client.welcomeChannel = client.channels.cache.get('1364881499354304572')
    require('./api/api')(client)
    setTimeout(loopLog, 30_000)
});

client.on(Events.InteractionCreate, (interaction) => {

    try {

        console.log(`Interaction: ${interaction.customId || interaction} | ran by ${interaction.user.tag} or ${interaction.user.id} | in ${interaction.guild.name}`)
        client.logInteraction(interaction)

        if (!interaction.isChatInputCommand()) {
            buttons({interaction, client })
            return
        }

        let command = client.commands.get(interaction.commandName);
        if (!command) {
            command = client.hubCommands.get(interaction.commandName)
        }

        try{
            if(interaction.replied) return;
            command.execute({ interaction, client });
        } catch (error) {
            console.error(error);
        }
    } catch(e) {
        client.log(e)
        console.log(e)
    }

});

client.on(Events.GuildMemberAdd, (member) => {

    if (member.guild.id === '1362845194759700692') {
        client.welcomeChannel.send(`:hand_splayed: Welcome <@${member.id}> to the **DemLog Hub**!`)
    }
})

client.login(token);

function buttons(stuff) {

    if (stuff.interaction.customId) {

        client.commands.get(stuff.interaction.customId.split(':')[0]).buttons(stuff)

    }
}

function getCommands(dir) {
    let commands = new Collection();
    const commandFiles = getFiles(dir)

    for (const commandFile of commandFiles) {
        const command = require(commandFile);
        commands.set(command.data.toJSON().name, command)
    }
    return commands;
}

function getFiles(dir) {

    const files = fs.readdirSync(dir, {
        withFileTypes: true
    })
    let commandFiles = [];

    for (const file of files) {
        if(file.isDirectory()) {
            commandFiles = [
                ...commandFiles,
                ...getFiles(`${dir}/${file.name}`)
            ]
        } else if (file.name.endsWith(".js")) {
            commandFiles.push(`${dir}/${file.name}`)
        }
    }
    return commandFiles;
}

module.exports = {
    client
}

function loopLog() {
    client.log()
    setTimeout(loopLog, 30_000)
}