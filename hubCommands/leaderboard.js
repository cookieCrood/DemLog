const { SlashCommandBuilder, EmbedBuilder } = require("discord.js");
const { MessageFlags } = require('discord-api-types/v10');

const ephemeral = MessageFlags.Ephemeral

module.exports = {
    data: new SlashCommandBuilder()
        .setName('leaderboard')
        .setDescription('Get top guilds ordered by amount of logs'),
    
    async execute(stuff) {
        const { interaction, client } = stuff

        await interaction.deferReply({ flags: ephemeral })

        const data = await client.db.leaderboard()
        data.sort((a, b) => { 
            return b.total - a.total
        })

        const fields = [{
            name: 'Guild',
            value: '',
            inline: true
        },
        {
            name: 'Logs',
            value: '',
            inline: true
        }]

        try {
                for (const guild of data) {
                const got = await client.guilds.cache.get(guild.id)
                if (!got) {
                    continue
                }
                fields[0].value += got.name + '\n'
                fields[1].value += guild.total + '\n'
            }
        } catch(e) {
            console.log(e)
            return interaction.editReply({ content:'Something went wrong!' })
        }

        await interaction.editReply({ embeds: [
            new EmbedBuilder()
                .setTitle('Log Leaderboard')
                .setDescription('View top guilds ranked by total logs')
                .addFields(fields)
        ] })
    }
}