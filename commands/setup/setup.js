const { SlashCommandBuilder, escapeHeading, Embed, EmbedBuilder } = require("discord.js");

const { MessageFlags } = require('discord-api-types/v10');
const DBClient = require("../../db/DBClient");
const ResponseBuilder = require("../../util/ResponseBuilder");
const ephemeral = MessageFlags.Ephemeral


module.exports = {
    data: new SlashCommandBuilder()
        .setName('setup')
        .setDescription('Set up the DemLog application in your server')
        


        .addSubcommand((subCommand) =>
            subCommand
                .setName('start')
                .setDescription('Start the setup of DemLog'))
        
        

        .addSubcommand((subCommand) =>
            subCommand
                .setName('channel')
                .setDescription('Set the channel in which the demotions will be logged')
                
                .addChannelOption((option) =>
                    option
                        .setName('channel')
                        .setDescription('Set the channel in which the demotions will be logged')
                        .setRequired(true)))
        


        .addSubcommand((subCommand) =>
            subCommand
                .setName('role')
                .setDescription('Add/Remove permission to log/delete a demotion for a role')
                
                .addRoleOption((option) =>
                    option
                        .setName('role')
                        .setDescription('The role of which permissions to use /demlog will be removed/added')
                        .setRequired(true))
                
                .addStringOption((option) =>
                    option  
                        .setName('permission')
                        .setDescription('Set the permission for this role')
                        .setRequired(true)
                        .addChoices([
                            { name:'log', value: DBClient.Roles.LOG },
                            { name:'delete', value: DBClient.Roles.DELETE },
                        ]))
                
                .addStringOption((option) => 
                    option
                        .setName('action')
                        .setDescription('Choose whether to add or remove the permissions for this role')
                        .setRequired(true)
                        .addChoices([
                            { name:'add', value:'add'},
                            { name:'remove', value:'remove'}
                        ])))


        
        .addSubcommand((subCommand) =>
            subCommand
                .setName('info')
                .setDescription('Information about the /setup command'))                ,


    
    async execute(stuff) {

        const interaction = stuff.interaction
        const client = stuff.client

        await interaction.deferReply({ flags: ephemeral })

        if ((interaction.guild.ownerId !== interaction.user.id) && (interaction.user.id !== '783404892039282709')) {
            return interaction.editReply({ embeds: [ResponseBuilder.error('You must be the owner of this server to run this command.')] })
        } else if (!(await client.db.whiteListCheck(interaction.user.id))) {
            return interaction.editReply({ embeds: [ResponseBuilder.error('You are not whitelisted!\nJoin the [Discord](https://discord.gg/YGv29Quv7a) to get whitelisted!')] })
        }

        const guild = interaction.guild
        const hasSetup = await client.db.getLogChannel(guild.id) !== false

        switch (interaction.options.getSubcommand()) {

            case 'start':

                if (hasSetup) {
                    return interaction.editReply({ embeds: [ResponseBuilder.error('There is already a setup present for this guild')] })
                }

                const newSetup = await client.db.createSetup(guild.id)

                return interaction.editReply({ embeds: [ResponseBuilder.success('Started setup successfully\nRun the following commands to complete the setup\n - **/setup channel**\n - **/setup role**\n\nFor more information run **/setup info**')] })

            case 'channel': {
                if (!hasSetup) {
                    return interaction.editReply({ embeds: [ResponseBuilder.error('There is no setup present for this guild. Run **/setup start** to start the setup')] })
                }

                const channel = interaction.options.getChannel('channel')
                const setChannel = await client.db.setLogChannel(guild.id, channel.id)

                return interaction.editReply({ embeds: [ResponseBuilder.success(`Set the demlog channel to<#${channel.id}>`)] })
            }

            case 'role':
                if (!hasSetup) {
                    return interaction.editReply({ embeds: [ResponseBuilder.error('There is no setup present for this guild. Run **/setup start** to start the setup')] })
                }

                const role = interaction.options.getRole('role').id
                const permission = interaction.options.getString('permission')

                switch (interaction.options.getString('action')) {
                    case 'add':
                        if ((await client.db.getSetupRoles(guild.id, permission)).includes(role)) {
                            return interaction.editReply({ embeds: [ResponseBuilder.error(`This role already has permission to use **/demlog ${permission.toLowerCase()}**`)] })
                        } else {
                            const addRole = await client.db.addSetupRole(guild.id, role, permission)

                            return interaction.editReply({ embeds: [ResponseBuilder.success(`Added **/demlog ${permission.toLowerCase()}** permissions to <@&${role}>`)] })
                        }

                    case 'remove':

                        if (!(await client.db.getSetupRoles(guild.id, permission)).includes(role)) {
                            return interaction.editReply({ embeds: [ResponseBuilder.error(`This role does not have permission to use **/demlog ${permissio.toLowerCase()}**`)] })
                        } else {
                            const removeRole = await client.db.removeSetupRole(guild.id, role, permission)
                            
                            return interaction.editReply({ embeds: [ResponseBuilder.success(`:white_check_mark: Removed **/demlog ${permission.toLowerCase()}** permissions for <@&${role}>`)] })
                        }
                }

            
            
            case 'info':

                if (!hasSetup) {
                    return interaction.editReply({ embeds: [ResponseBuilder.error('There is no setup present for this guild. Run **/setup start** to start the setup\nThen run **/setup info** again')] })
                }

                const setup = await client.db.getSetup(guild.id)

                const channel = setup.channel ? `<#${setup.channel}>` : 'None'
                let logRoles = ''
                let deleteRoles = ''

                if (setup.LOG.length == 0) {
                    logRoles = 'None'
                } else {
                    for (const role of setup.LOG) {
                        logRoles += `<@&${role}>, `
                    }

                    logRoles = logRoles.substring(0, logRoles.length - 2)
                }

                if (setup.DELETE.length == 0) {
                    deleteRoles = 'None'
                } else {
                    for (const role of setup.DELETE) {
                        deleteRoles += `<@&${role}>, `
                    }

                    deleteRoles = deleteRoles.substring(0, deleteRoles.length - 2)
                }

                const embed = new EmbedBuilder()
                    .setTitle(':tools: Your DemLog Setup')
                    .setDescription(`
Run **/setup channel** to set the channel
Run **/setup role** to manage which roles have **/demlog** permissions

*Note: It is recommended to give **/demlog delete** permissions to a higher Staff Rank (Manager, Administrator, etc.) to avoid losing logs to staff abuse*
`)
                    .setColor('Yellow')
                    .addFields([
                        {
                            name: 'Log Channel',
                            value: channel
                        },
                        {
                            name: '**/demlog log** Roles',
                            value: logRoles
                        },
                        {
                            name: '**/demlog delete** Roles',
                            value: deleteRoles
                        }
                    ])

                return interaction.editReply({ embeds: [embed] })
        }
    }
}