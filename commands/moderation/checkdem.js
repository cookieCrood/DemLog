const { SlashCommandBuilder, ButtonBuilder, ActionRowBuilder } = require("discord.js");
const fs = require('fs')

const { MessageFlags, ButtonStyle } = require('discord-api-types/v10');
const { checkPrimeSync } = require("crypto");
const ResponseBuilder = require("../../util/ResponseBuilder");
const ephemeral = MessageFlags.Ephemeral

async function checkDem(interaction, player, client) {

    interaction.editReply({ content:`Getting UUID of \`${player}\`` })
    const UUID = await client.getUUID(player)

    if (!UUID) {
        return interaction.editReply({ embeds: [ResponseBuilder.error(`Couldn't find the UUID of \'player\'! (It might be a nick)`)] })
    }

    const punishments = await client.db.getGuildPunishments(UUID, interaction.guild.id)

    if (punishments === null) {
        return interaction.editReply({ embeds: [ResponseBuilder.error(`Couldn't find any punishments for \`${player}\` (check for typos and try with other names they had: [NameMC](https://namemc.com/profile/${player}))`)] })
    }

    interaction.editReply({ embeds: [ResponseBuilder.listPunishments(player, punishments)] })

}

module.exports = {
    data: new SlashCommandBuilder()
        .setName('checkdem')
        .setDescription('Check the reason for a players demotion')
        
        .addStringOption((option) =>
            option
                .setName('player')
                .setDescription('The player whose demotion will be checked')
                .setRequired(true)),
        
    async execute(stuff) {
        const interaction = stuff.interaction
        await interaction.deferReply({ flags:ephemeral })
        const player = interaction.options.getString('player').toLowerCase()

        checkDem(interaction, player, stuff.client)
        
    },

    async buttons(stuff) {
        const interaction = stuff.interaction
        await interaction.deferReply({ flags:ephemeral })
        const args = interaction.customId.split(':')

        checkDem(interaction, args[1], stuff.client)
        
    }
}