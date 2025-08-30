const { SlashCommandBuilder, EmbedBuilder, Colors } = require("discord.js");
const fs = require('fs')

const { MessageFlags } = require('discord-api-types/v10');
const ephemeral = MessageFlags.Ephemeral

function getGuilds(client) {

    let idList = ''
    let nameList = ''
    let ownerList = ''

    const embed = new EmbedBuilder()
        .setColor(Colors.Red)
        .setTitle('List of DemLog Guilds')
        .setDescription('test')

    const guilds = client.guilds.cache
    for (let guild of guilds) {
        guild = guild[1]
        
        idList += `${guild.id}\n`
        nameList += `${guild.name}\n`
        ownerList += `${client.users.cache.get(guild.ownerId).username}\n`

    }

    nameList = nameList.replace(/([*_~`>\\|])/g, '\\$1')
    ownerList = ownerList.replace(/([*_~`>\\|])/g, '\\$1')

    embed.addFields(
        { name:'Guild ID', value:idList, inline:true },
        { name:'Guild Name', value:nameList, inline:true },
        { name:'Guild Owner', value:ownerList, inline:true }
    )

    return embed
}

module.exports = {
    data: new SlashCommandBuilder()
        .setName('get-guilds')
        .setDescription('Get a list of guilds DemLog is in'),
    
    async execute(stuff) {
        const interaction = stuff.interaction

        if (!(interaction.user.id === '783404892039282709')) {
            return interaction.reply({ content: ':x: You do not have permission to execute this command!', flags:ephemeral })
        }

        getGuilds(stuff.client)

        interaction.reply({ embeds:[getGuilds(stuff.client)], flags:ephemeral})


    }
}