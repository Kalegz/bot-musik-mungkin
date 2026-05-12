const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const LanguageManager = require('../src/LanguageManager');
const ErrorHandler = require('../src/ErrorHandler');
const config = require('../config');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('remove')
        .setDescription('Removes a specific track from the queue')
        .addIntegerOption(option =>
            option.setName('index')
                .setDescription('The number of the track in the queue (e.g. 1, 2, 3...)')
                .setRequired(true)
        ),

    async execute(interaction, client) {
        try {
            const guildId = interaction.guild.id;
            const player = client.players.get(guildId);

            if (!player) {
                const noPlayerMsg = await LanguageManager.getTranslation(guildId, 'commands.remove.no_player');
                return await interaction.reply({ content: noPlayerMsg, ephemeral: true });
            }

            if (!player.queue || player.queue.length === 0) {
                const noQueueMsg = await LanguageManager.getTranslation(guildId, 'commands.remove.no_queue');
                return await interaction.reply({ content: noQueueMsg, ephemeral: true });
            }

            const index = interaction.options.getInteger('index');
            
            // Validate index (1-based for user)
            if (index < 1 || index > player.queue.length) {
                const invalidIndexMsg = await LanguageManager.getTranslation(guildId, 'commands.remove.invalid_index', { max: player.queue.length });
                return await interaction.reply({ content: invalidIndexMsg, ephemeral: true });
            }

            // Remove from queue (removeFromQueue uses 0-based index)
            const removedTrack = player.removeFromQueue(index - 1);

            if (removedTrack) {
                const title = removedTrack.title || 'Unknown Title';
                const successMsg = await LanguageManager.getTranslation(guildId, 'commands.remove.removed', { title });
                const removedByMsg = await LanguageManager.getTranslation(guildId, 'commands.remove.removed_by');

                const embed = new EmbedBuilder()
                    .setColor(config.bot.embedColor || '#6366f1')
                    .setTitle(await LanguageManager.getTranslation(guildId, 'commands.remove.title'))
                    .setDescription(`${successMsg}\n\n${removedByMsg}: <@${interaction.user.id}>`)
                    .setTimestamp();

                await interaction.reply({ embeds: [embed] });
                
                // Update NP embed to reflect shorter queue if it has a footer with count
                if (global.clients?.musicEmbedManager) {
                    global.clients.musicEmbedManager.updateNowPlayingEmbed(player).catch(() => {});
                }
            } else {
                const errorMsg = await LanguageManager.getTranslation(guildId, 'commands.remove.error');
                await interaction.reply({ content: errorMsg, ephemeral: true });
            }

        } catch (error) {
            const errorMsg = await ErrorHandler.handle(error, interaction.guild?.id, 'remove.execute');
            await interaction.reply({ content: errorMsg, ephemeral: true });
        }
    }
};
