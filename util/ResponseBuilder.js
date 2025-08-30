const { EmbedBuilder } = require('discord.js')

class ResponseBuilder {

    static success(message) {
        return new EmbedBuilder()
            .setTitle(':white_check_mark: Success')
            .setDescription(message)
            .setColor('Green')
    }

    static error(message) {
        return new EmbedBuilder()
            .setTitle(':x: Error')
            .setDescription(message)
            .setColor('Red')
    }

    static localPunishment(type, player, reason, interaction) {
        return new EmbedBuilder()
            .setTitle(`${{
                'DEMOTION': ':no_entry_sign:',
                'MUTE': ':mute:',
                'BAN': ':bangbang:'
            }[type]}${type} of \`${player}\``)
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
                value: `for "**${p.reason}**"\nby <@${p.loggedId}> (\`${p.loggedName}\`)`
            })
        }

        return embed.addFields(fields)
    }
}

module.exports = ResponseBuilder