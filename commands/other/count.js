const { SlashCommandBuilder } = require("discord.js");
const { MessageFlags } = require('discord-api-types/v10');

const ephemeral = MessageFlags.Ephemeral



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
        const { interaction, client } = stuff


        switch(interaction.options.getSubcommand()) {
            case 'total':
                return interaction.reply({ content: `:scroll: Total demotions in this server: **${await client.db.countGuild(interaction.guild.id)}**`, flags:ephemeral })
            case 'user':
                return
                // TODO
            case 'leaderboard':
                return 
                // TODO
        }
    }
}