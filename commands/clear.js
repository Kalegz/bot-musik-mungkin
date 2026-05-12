const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const LanguageManager = require('../src/LanguageManager');
const ErrorHandler = require('../src/ErrorHandler');
const config = require('../config');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('clear')
        .setDescription('Clears all tracks from the queue'),

    async execute(interaction, client) {
        try {
            const guildId = interaction.guild.id;
            const player = client.players.get(guildId);

            if (!player) {
                const noPlayerMsg = await LanguageManager.getTranslation(guildId, 'commands.clear.no_player');
                return await interaction.reply({ content: noPlayerMsg, ephemeral: true });
            }

            if (!player.queue || player.queue.length === 0) {
                const noQueueMsg = await LanguageManager.getTranslation(guildId, 'commands.clear.no_queue');
                return await interaction.reply({ content: noQueueMsg, ephemeral: true });
            }

            const count = player.queue.length;
            player.clearQueue();

            const successMsg = await LanguageManager.getTranslation(guildId, 'commands.clear.cleared', { count });
            const clearedByMsg = await LanguageManager.getTranslation(guildId, 'commands.clear.cleared_by');

            const embed = new EmbedBuilder()
                .setColor(config.bot.embedColor || '#6366f1')
                .setTitle(await LanguageManager.getTranslation(guildId, 'commands.clear.title'))
                .setDescription(`${successMsg}\n\n${clearedByMsg}: <@${interaction.user.id}>`)
                .setTimestamp();

            await interaction.reply({ embeds: [embed] });

            // Update NP embed to reflect empty queue
            if (global.clients?.musicEmbedManager) {
                global.clients.musicEmbedManager.updateNowPlayingEmbed(player).catch(() => {});
            }

        } catch (error) {
            const errorMsg = await ErrorHandler.handle(error, interaction.guild?.id, 'clear.execute');
            await interaction.reply({ content: errorMsg, ephemeral: true });
        }
    }
};
