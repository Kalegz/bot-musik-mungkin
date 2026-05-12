const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const { getVoiceConnection } = require('@discordjs/voice');
const MusicPlayer = require('../src/MusicPlayer');
const LanguageManager = require('../src/LanguageManager');
const ErrorHandler = require('../src/ErrorHandler');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('247')
        .setDescription('Toggles 24/7 mode - Bot stays in voice channel forever'),

    async execute(interaction, client) {
        const guildId = interaction.guild?.id;
        if (!guildId) return;

        try {
            await interaction.deferReply();
            const member = interaction.member;
            const voiceChannel = member.voice.channel;

            if (!voiceChannel) {
                const errorMsg = await LanguageManager.getTranslation(guildId, 'play.voice_channel_required');
                return await interaction.editReply({ content: errorMsg });
            }

            // Reset koneksi jika ada yang tersangkut
            const existingConn = getVoiceConnection(guildId);
            if (existingConn) {
                existingConn.destroy();
                await new Promise(resolve => setTimeout(resolve, 1000));
            }

            let player = client.players.get(guildId);
            if (!player) {
                player = new MusicPlayer(interaction.guild, interaction.channel, voiceChannel);
                client.players.set(guildId, player);
            }

            // Memanggil fungsi connect() 
            try {
                await player.connect(voiceChannel);
            } catch (e) {
                console.error("Connect Error:", e);
                return await interaction.editReply({ content: "❌ Gagal bergabung ke channel suara! Pastikan saya punya izin Connect dan Speak." });
            }

            player.mode247 = !player.mode247;
            
            if (player.mode247) {
                player.clearInactivityTimer(false);
            } else {
                if (player.queue.length === 0 && !player.currentTrack) {
                    player.startInactivityTimer();
                }
            }

            await player.persistState('247-toggle', true);

            const statusKey = player.mode247 ? 'commands.247.enabled' : 'commands.247.disabled';
            const descKey = player.mode247 ? 'commands.247.enabled_desc' : 'commands.247.disabled_desc';
            
            const title = await LanguageManager.getTranslation(guildId, statusKey);
            const description = await LanguageManager.getTranslation(guildId, descKey);

            const embed = new EmbedBuilder()
                .setColor(player.mode247 ? '#00FF00' : '#FF0000')
                .setTitle(title)
                .setDescription(description)
                .setTimestamp();

            await interaction.editReply({ embeds: [embed] });

        } catch (error) {
            const errorMsg = await ErrorHandler.handle(error, guildId, '247.execute');
            if (interaction.deferred) {
                await interaction.editReply({ content: errorMsg });
            } else {
                await interaction.reply({ content: errorMsg, ephemeral: true });
            }
        }
    }
};
