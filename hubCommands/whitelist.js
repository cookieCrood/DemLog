const { SlashCommandBuilder } = require("discord.js");
const fs = require('fs')

const { MessageFlags } = require('discord-api-types/v10');
const ResponseBuilder = require("../util/ResponseBuilder");
const ephemeral = MessageFlags.Ephemeral

module.exports = {
    data: new SlashCommandBuilder()
        .setName('whitelist')
        .setDescription('Add/Remove permissions to setup DemLog for a user')
        
        .addUserOption((option) =>
            option
                .setName('user')
                .setDescription('User to add/remove demlog permissions')
                .setRequired(true))
        
        .addStringOption((option) =>
            option
                .setName('action')
                .setDescription('Whether to add or remove permissions')
                .setRequired(true)
                .addChoices([
                    { name:'add', value:'add' },
                    { name:'remove', value:'remove' }
                ])),

    async execute(stuff) {
        const { interaction, client } = stuff
        await interaction.deferReply({ flags: ephemeral })

        if (!(interaction.user.id === '783404892039282709')) {
            return interaction.editReply({ embeds: [ResponseBuilder.error(':x: You do not have permission to execute this command!')] })
        }

        const user = interaction.options.getUser('user')

        switch (interaction.options.getString('action')) {
            case 'add':
                if (await client.db.whiteListCheck(user.id)) {
                    return interaction.editReply({ embeds: [ResponseBuilder.error(`<@${user.id}> is already whitelisted!`)] })
                }

                const addedUser = await client.db.whiteListAdd(user.id, user.tag)

                return interaction.editReply({ embeds: [ResponseBuilder.success(`Added <@${user.id}> to whitelist`)] })
            
            case 'remove':
                if (!(await client.db.whiteListCheck(user.id))) {
                    return interaction.editReply({ embeds: [ResponseBuilder.error(`<@${user.id}> is not whitelisted!`)] })
                }

                const removedUser = await client.db.whiteListRemove(user.id)

                return interaction.editReply({ embeds: [ResponseBuilder.success(`Removed <@${user.id}> from whitelist`)] })

        }
    }
}