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
        const interaction = stuff.interaction
        const client = stuff.client

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

                    interaction.editReply({ content:`Getting UUID of \`${player}\`` })
                    const UUID = await client.getUUID(player)

                    if (!UUID) {
                        return interaction.editReply({ embeds: [ResponseBuilder.error(`This player does not exist! Demotion not logged. (\`${player}\` is probably a nick)`)] })
                    }

                    const logPunishment = await client.db.addGuildPunishment(UUID, player, punishment, reason, interaction.user.id, interaction.user.username, interaction.guild.id)

                    const [message, globalMessage] = await Promise.all([
                        channel.send({ embeds: [ResponseBuilder.localPunishment(punishment, player, reason, interaction)] }),
                        client.globalChannel.send({ embeds: [ResponseBuilder.globalPunishment(punishment, player, reason, interaction)] })
                    ])

                    interaction.editReply({ embeds: [ResponseBuilder.success(`Logged the punishment of \`${player}\` successfully`)] })

                    stuff.client.channels.cache.get('1365334036876365865').setName(`🚫│ʟᴏɢs: ${await client.db.countTotalLogs()}`)
                    
                    break
                }
            
            case 'delete': {

                    if (!client.hasPermission(interaction, 'delete')) {
                        return interaction.editReply({ embeds: [ResponseBuilder('You do not have permission to use this command')] })
                    }
                    
                    const deletePunishment = interaction.options.getString('punishment')

                    interaction.editReply({ content:`Getting UUID of \`${player}\`` })
                    const UUID = await client.getUUID(player)

                    if (!UUID) {
                        return interaction.editReply({ embeds: [ResponseBuilder('This player does not exist! If you think this is a mistake, contact **thecookie__** on Discord.')] })
                    }

                    if (!log[UUID]) {
                        return interaction.editReply({ embeds: [ResponseBuilder(`There is no log for \`${player}\``)] })
                    }

                    if (!log[UUID][deletePunishment] && deletePunishment != 'all') {
                        return interaction.editReply({ embeds: [ReportingObserver(`This player doesn't have a log for being ${deletePunishment}`)] })
                    }

                    const entry = log[UUID]

                    if (deletePunishment == 'all') {
                        for (const thing in entry) {

                            const deleteChannel = stuff.client.channels.cache.get(entry[thing].channelId)
                            if (deleteChannel) {
                                deleteChannel.messages.delete(entry[thing].messageId)
                            }

                            const globalEntry = globalLog[`${UUID}-${interaction.guild.id}`]
                            stuff.client.channels.cache.get('1373319736523358278').messages.delete(globalEntry[thing].messageId)

                        }
                        delete log[UUID]
                        delete globalLog[`${UUID}-${interaction.guild.id}`]

                    } else {

                        const deleteChannel = stuff.client.channels.cache.get(entry[deletePunishment].channelId)
                        if (deleteChannel) {
                            deleteChannel.messages.delete(entry[deletePunishment].messageId)
                        }

                        const globalEntry = globalLog[`${UUID}-${interaction.guild.id}`]
                        stuff.client.channels.cache.get('1373319736523358278').messages.delete(globalEntry[deletePunishment].messageId)

                        delete log[UUID][deletePunishment]

                        if (isEmpty(log[UUID])) {
                            delete log[UUID]
                            delete globalLog[`${UUID}-${interaction.guild.id}`]
                        }
                    }

                    let totalDemotions = 0
                    for (const log in globalLog) {
                        if (globalLog.hasOwnProperty(log)) {
                            totalDemotions++
                        }
                    }

                    stuff.client.channels.cache.get('1365334036876365865').setName(`🚫︱ᴅᴇᴍᴏᴛɪᴏɴs: ${totalDemotions}`)

                    close(log)
                    fs.writeFile(globalLogPath, JSON.stringify(globalLog), (err) => {
                        if (err) console.error('Error writing to global log file:', err)
                    })

                    return interaction.editReply({ content:`:white_check_mark: Deleted the log for \`${player}\` successfully` })

            }
        }
    }
}