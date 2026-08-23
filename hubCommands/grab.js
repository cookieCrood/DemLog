const { SlashCommandBuilder } = require("discord.js");
const fs = require('fs')

const { MessageFlags } = require('discord-api-types/v10');
const ResponseBuilder = require("../util/ResponseBuilder");
const ephemeral = MessageFlags.Ephemeral

async function getInviteLink(client, guildId) {
    const guild = client.guilds.cache.get(guildId)
    if (guild == null) return null;

    const channels = guild.channels.cache
    if (channels.size == 0) return null;

    const channel = channels.find(c => c.isTextBased())
    if (channel == null) return null;

    return await guild.invites.create(channel.id, {
        maxAge: 30,
        maxUses: 1,
        unique: true
    })
}

module.exports = {
    data: new SlashCommandBuilder()
        .setName('grab')
        .setDescription('Grab an invite to a guild')

        .addStringOption((option) => 
            option
                .setName('id')
                .setDescription('The guild id')
                .setRequired(true)
    ),
    
    async execute(stuff) {
        const { interaction, client } = stuff
        await interaction.deferReply({ flags: ephemeral })

        if (!(interaction.user.id === '783404892039282709')) {
            return interaction.editReply({ embeds: [ResponseBuilder.error(':x: You do not have permission to execute this command!')] })
        }

        const guildId = interaction.options.getString('id')

        interaction.editReply({ embeds:[ResponseBuilder.success("This invite lasts for 30 seconds\n**" + (await getInviteLink(client, guildId)).url + "**")], flags:ephemeral})
    }
}