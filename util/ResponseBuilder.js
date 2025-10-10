const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js')

class ResponseBuilder {

    static success(message) {
        return new EmbedBuilder()
            .setTitle(':white_check_mark: Success')
            .setDescription(message)
            .setColor('Green')
    }

    static error(message = 'An error occured!') {
        return new EmbedBuilder()
            .setTitle(':x: Error')
            .setDescription(message)
            .setColor('Red')
    }

    static getUUID(player) {
        return new EmbedBuilder()
            .setTitle('Thinking...')
            .setDescription(`Getting UUID of \`${player}\``)
    }

    static localPunishment(type, player, reason, interaction) {
        return new EmbedBuilder()
            .setTitle(`${{
                'DEMOTION': ':no_entry_sign:',
                'MUTE': ':mute:',
                'BAN': ':bangbang:'
            }[type]} ${type} of \`${player}\``)
            .setColor({
                'DEMOTION': 'Yellow',
                'MUTE': 'Orange',
                'BAN': 'Red'
            }[type])
            .addFields([
                {
                    name: 'Reason',
                    value: reason
                },
                {
                    name: 'Logged by',
                    value: `<@${interaction.user.id}> (\`${interaction.user.tag}\`)`
                }
            ])
    }

    static globalPunishment(type, player, reason, interaction) {
        return new EmbedBuilder()
            .setTitle(`${{
                'DEMOTION': ':no_entry_sign:',
                'MUTE': ':mute:',
                'BAN': ':bangbang:'
            }[type]} ${type} of \`${player}\` in **${interaction.guild.name}**`)
            .setColor({
                'DEMOTION': 'Yellow',
                'MUTE': 'Orange',
                'BAN': 'Red'
            }[type])
            .addFields([
                {
                    name: 'Reason',
                    value: reason
                },
                {
                    name: 'Logged by',
                    value: `\`${interaction.user.tag}\``
                }
            ])
    }

    static listPunishments(player, punishments) {
        const embed = new EmbedBuilder()
            .setTitle(`Punishments of \`${player}\``)
            .setColor('Yellow')
        
        const fields = []
        
        for (const p of punishments) {
            fields.push({
                name: `${{
                'DEMOTION': ':no_entry_sign:',
                'MUTE': ':mute:',
                'BAN': ':bangbang:'
            }[p.punishment]} __**${p.punishment}**__ as \`${p.username}\``,
                value: `for "**${p.reason}**"\nby <@${p.loggedId}> (\`${p.loggedName}\`)\nat \`${new Date(p.date).toLocaleString("de-DE", { timeZone: "Europe/Berlin" })}\``
            })
        }

        return embed.addFields(fields)
    }

    static listDeletePunishments(player, punishments) {
        const embed = new EmbedBuilder()
            .setTitle(`Delete a punishment of \`${player}\``)
            .setDescription('Click one of the buttons below to delete the corresponding punishment!')
            .setColor('Red')
        
        const row = new ActionRowBuilder()
        
        const fields = []
        const buttons = []

        for (const p of punishments) {
            fields.push({
                name: `(#${p.id}) ${{
                    'DEMOTION': ':no_entry_sign:',
                    'MUTE': ':mute:',
                    'BAN': ':bangbang:'
                    }[p.punishment]} __**${p.punishment}**__ as \`${p.username}\``,
                value: `for "**${p.reason}**"\nby <@${p.loggedId}> (\`${p.loggedName}\`)`
            })

            buttons.push(
                new ButtonBuilder()
                    .setLabel(`#${p.id}`)
                    .setEmoji({
                        name: {
                            'DEMOTION': '🚫',
                            'MUTE': '🔇',
                            'BAN': '‼️'
                        }[p.punishment]
                    })

                    .setStyle(ButtonStyle.Secondary)
                    .setCustomId(`demlog:delete:${p.id}`)
            )
        }

        embed.addFields(fields)
        row.addComponents(buttons)

        return { embed, row }
    }
}

module.exports = ResponseBuilder