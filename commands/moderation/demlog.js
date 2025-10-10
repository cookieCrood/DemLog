const { SlashCommandBuilder, ButtonBuilder, Component, ActionRowBuilder } = require("discord.js");
const fs = require('fs')
const DBClient = require('../../db/DBClient')

const { MessageFlags, ButtonStyle } = require('discord-api-types/v10');
const ResponseBuilder = require("../../util/ResponseBuilder");
const ephemeral = MessageFlags.Ephemeral

let logPath
let globalLogPath = './commands/moderation/logs/global-log.json'

function close(log) {
    fs.writeFile(logPath, JSON.stringify(log), (err) => {
        if (err) console.error('Error writing to log file:', err)
    })
}

function isEmpty(obj) {
    return !Object.keys(obj).length > 0;
}

module.exports = {
    data: new SlashCommandBuilder()
        .setName('demlog')
        .setDescription('Manage the logs of this freebuild')
        
        .addSubcommand((subCommand) =>
            subCommand
                .setName('log')
                .setDescription('Log a demotion of a player')
                
                .addStringOption((option) =>
                    option
                        .setName('player')
                        .setDescription('The punished player')
                        .setRequired(true))
                
                .addStringOption((option) =>
                    option
                        .setName('reason')
                        .setDescription('The reason for the punishment')
                        .setRequired(true))
                
                .addStringOption((option) =>
                    option
                        .setName('punishment')
                        .setDescription('OPTIONAL Provide a punishment type that is not a demotion')
                        .addChoices([
                            { name:'mute', value: DBClient.PunishmentTypes.MUTE },
                            { name:'ban', value: DBClient.PunishmentTypes.BAN }
                        ])))
        
        
        
        .addSubcommand((subCommand) =>
            subCommand
                .setName('delete')
                .setDescription('Delete a log for a player')
                
                .addStringOption((option) => option
                    .setName('player')
                    .setDescription('Player whose log will be removed')
                    .setRequired(true))),

    async execute(stuff) {
        const { interaction, client } = stuff

        await interaction.deferReply({ flags:ephemeral })

        const logChannel = await client.db.getLogChannel(interaction.guild.id)

        if (logChannel === undefined) {
            return interaction.editReply({ embeds: [ResponseBuilder.error('There is no log channel present for this guild. Run **/setup channel** to set the channel.')] })
        } else if (logChannel === false) {
            return interaction.editReply({ embeds: [ResponseBuilder.error('There is no setup present for this guild. Run **/setup start** to start the DemLog setup.')] })
        }

        const player = interaction.options.getString('player').toLowerCase()

        switch (interaction.options.getSubcommand()) {
            case 'log': {

                    if (!(await client.hasPermission(interaction, DBClient.Roles.LOG))) {
                        return interaction.editReply({ embeds: [ResponseBuilder.error('You do not have permission to use this command')] })
                    }

                    const channel = client.channels.cache.get(logChannel)

                    const reason = interaction.options.getString('reason')
                    const punishment = interaction.options.getString('punishment') || DBClient.PunishmentTypes.DEMOTION

                    interaction.editReply({ embeds: [ResponseBuilder.getUUID(player)] })
                    const UUID = await client.getUUID(player)

                    if (!UUID) {
                        return interaction.editReply({ embeds: [ResponseBuilder.error(`This player does not exist! Demotion not logged. (\`${player}\` is probably a nick)`)] })
                    }

                    const [message, globalMessage] = await Promise.all([
                        channel.send({ embeds: [ResponseBuilder.localPunishment(punishment, player, reason, interaction)] }),
                        client.globalChannel.send({ embeds: [ResponseBuilder.globalPunishment(punishment, player, reason, interaction)] })
                    ])

                    const date = Date.now()

                    const logPunishment = await client.db.addGuildPunishment(UUID, player, punishment, reason, interaction.user.id, interaction.user.username, interaction.guild.id, message.id, globalMessage.id, date)

                    interaction.editReply({ embeds: [ResponseBuilder.success(`Logged the punishment of \`${player}\` successfully`)] })

                    stuff.client.channels.cache.get('1365334036876365865').setName(`🚫│ʟᴏɢs: ${await client.db.countTotalLogs()}`)
                    
                    break
                }
            
            case 'delete': {

                    if (!client.hasPermission(interaction, DBClient.Roles.DELETE)) {
                        return interaction.editReply({ embeds: [ResponseBuilder('You do not have permission to use this command')] })
                    }
                    
                    interaction.editReply({ embeds: [ResponseBuilder.getUUID(player)] })
                    const UUID = await client.getUUID(player)

                    if (!UUID) {
                        return interaction.editReply({ embeds: [ResponseBuilder('This player does not exist! If you think this is a mistake, contact **thecookie__** on Discord.')] })
                    }

                    const punishments = await client.db.getGuildPunishments(UUID, interaction.guild.id)
                    if (!punishments) {
                        return interaction.editReply({ embeds: [ResponseBuilder.error(`Couldn't find any punishments for \`${player}\` (check for typos!)`)] })
                    }

                    const { embed, row} = ResponseBuilder.listDeletePunishments(player, punishments)

                    interaction.editReply({ content: '', embeds: [embed], components: [row] })
            }
        }
    },

    async buttons(stuff) {
        const { interaction, client } = stuff
        await interaction.deferReply({ flags: ephemeral })

        const args = interaction.customId.split(':')
        const id = args[2]

        const log = await client.db.getPunishmentById(id)
        if (!log) return interaction.editReply({ embeds: [ResponseBuilder.error()] })

        const { messageId, globalMessageId } = log

        try {
            const logChannel = client.channels.cache.get(
                await client.db.getLogChannel(interaction.guild.id)
            )

            await Promise.all([
                client.globalChannel.messages.delete(globalMessageId),
                logChannel.messages.delete(messageId)
            ])

        } catch(e) {
            console.log(e)
        }

        await client.db.deleteGuildPunishment(interaction.guild.id, id)

        interaction.editReply({ embeds: [ResponseBuilder.success(`Deleted punishment #${id} successfully!`)] })

        stuff.client.channels.cache.get('1365334036876365865').setName(`🚫│ʟᴏɢs: ${await client.db.countTotalLogs()}`)
    }
}