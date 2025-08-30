const { SlashCommandBuilder } = require("discord.js");
const { MessageFlags } = require('discord-api-types/v10');

const ephemeral = MessageFlags.Ephemeral


function sortJsonByValue(jsonObj) {
    const entries = Object.entries(jsonObj);
    
    entries.sort((a, b) => b[1] - a[1]);
    
    const sortedObj = Object.fromEntries(entries);
    
    return entries

}

module.exports = {
    data: new SlashCommandBuilder()
        .setName('count')
        .setDescription('Get various DemLog stats for your server')
        .addSubcommand((subCommand) =>
            subCommand
                .setName('total')
                .setDescription('Get total count of demotions in your server'))



        .addSubcommand((subCommand) =>
            subCommand
                .setName('user')
                .setDescription('Get the demotion count of a user')
                .addUserOption((option) =>
                    option
                        .setName('user')
                        .setDescription('The user to get the demotion count of')
                        .setRequired(true)))
        
        
        
        .addSubcommand((subCommand) =>
            subCommand
                .setName('leaderboard')
                .setDescription('Get the top x loggers in your server')
                
                .addNumberOption((option) =>
                    option
                        .setName('display')
                        .setDescription('Amount of users to display')
                        .setRequired(true)
                        .addChoices([
                            { name:'5', value:5 },
                            { name:'10', value:10 },
                            { name:'15', value:15 },
                            { name:'20', value:20 }
                        ]))),
    
    async execute(stuff) {
        const interaction = stuff.interaction
        const client = stuff.client

        const log = client.logs[interaction.guild.id]

        switch(interaction.options.getSubcommand()) {
            case 'total':
                return interaction.reply({ content: `:scroll: Total demotions in this server: **${Object.keys(log).length}**\n-# Note: This only displays the amount of players punished`, flags:ephemeral })
            case 'user':
                const user = interaction.options.getUser('user')

                const s1 = JSON.stringify(log)
                console.log(s1)
                const s2 = `"loggedId":"${user.id}"`;
                const count = (s1.match(new RegExp(s2, "g")) || []).length;

                return interaction.reply({ content:`:scroll: Demotions by <@${user.id}>: **${count}**\n-# Note: This displays the total amount of punishments (demotion, mute, ban, temporary) this player has logged`, flags:ephemeral })
            case 'leaderboard':
                function add(map, id) {
                    if (map[id]) {
                        map[id] += 1
                    } else {
                        map[id] = 1
                    }
                }

                const display = interaction.options.getNumber('display')

                const map = {}

                for (const key in log) {
                    const entry = log[key]
                    for (const p in entry) {
                        if (p == 'temporaries') {
                            for (const id in entry.temporaries) {
                                if (id != 'maxId') add(map, entry.temporaries[id].loggedId)
                            }
                            continue
                        }
                        add(map, entry[p].loggedId)
                    }
                }
                const sorted = sortJsonByValue(map)
                let message = `
# LOGGING LEADERBOARD
:first_place: ${sorted.length > 0 ? `<@${sorted[0][0]}>` : '(-)'} with **${sorted.length > 0 ? sorted[0][1] : '(-)'}** logs
:second_place: ${sorted.length > 1 ? `<@${sorted[1][0]}>` : '(-)'} with **${sorted.length > 1 ? sorted[1][1] : '(-)'}** logs
:third_place: ${sorted.length > 2 ? `<@${sorted[2][0]}>` : '(-)'} with **${sorted.length > 2 ? sorted[2][1] : '(-)'}** logs
`
                for (let i = 3; i < display; i++) {
                    message += `${sorted.length > i ? `<@${sorted[i][0]}>` : '(-)'} with **${sorted.length > i ? sorted[i][1] : '(-)'}** logs\n`
                }
                interaction.reply({ content:message, flags:ephemeral })
        }
    }
}