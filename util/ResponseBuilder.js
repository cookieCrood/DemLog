const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, Embed } = require('discord.js')

class ResponseBuilder {

    static EMOJI_MAP = {
        'DEMOTION': ':no_entry_sign:',
        'WARN': ':warning:',
        'MUTE': ':mute:',
        'BAN': ':bangbang:',
        'NOTE': ':scroll:'
    }

    static COLOR_MAP = {
        'DEMOTION': 'Yellow',
        'WARN': 'Yellow',
        'MUTE': 'Orange',
        'BAN': 'Red',
        'NOTE': 'White'
    }

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
            .setTitle(`${this.EMOJI_MAP[type]} ${type} of \`${player}\``)
            .setColor(this.COLOR_MAP[type])
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
            .setTitle(`${this.EMOJI_MAP[type]} ${type} of \`${player}\` in **${interaction.guild.name}**`)
            .setColor(this.COLOR_MAP[type])
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
                name: `${this.EMOJI_MAP[p.punishment]} __**${p.punishment}**__ as \`${p.username}\``,
                value: `for "**${p.reason}**"\nby <@${p.loggedId}> (\`${p.loggedName}\`)\nat ${p.date ? `<t:${Math.floor(p.date / 1_000)}:f>` : "`No date :/`"}`
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
                name: `(#${p.id}) ${this.EMOJI_MAP[p.punishment]} __**${p.punishment}**__ as \`${p.username}\``,
                value: `for "**${p.reason}**"\nby <@${p.loggedId}> (\`${p.loggedName}\`)\nat ${p.date ? `<t:${Math.floor(p.date / 1_000)}:f>` : "`No date :/`"}`
            })

            buttons.push(
                new ButtonBuilder()
                    .setLabel(`#${p.id}`)
                    .setEmoji({
                        name: {
                            'DEMOTION': '🚫',
                            'WARN': '⚠️',
                            'MUTE': '🔇',
                            'BAN': '‼️',
                            'NOTE': '📜'
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

    static makeLeaderboard(data) {
        const embed = new EmbedBuilder()
            .setTitle('Log leaderboard')
            .setDescription('List of top punishment loggers')
            .setColor('Green')
        
        const fields = [
            { name: 'User', value: '', inline: true },
            { name: 'Logs', value: '', inline: true }
        ]

        console.log(data)
        
        for (const d of data) {
            fields[0].value += `<@${d.id}>\n`
            fields[1].value += `${d.count}\n`
        }

        embed.addFields(fields)

        return embed
    }
}

module.exports = ResponseBuilder