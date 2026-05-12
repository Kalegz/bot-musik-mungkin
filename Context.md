# Context

## Architecture & Design Patterns
- **Bot Framework**: discord.js with `discord-player` / custom `MusicPlayer` class for audio streaming.
- **Audio Extraction**: `youtube-dl-exec` (wrapping `yt-dlp`) for YouTube, Spotify (via YouTube search), and SoundCloud (via YouTube search). Direct links are fetched and transcoded using `ffmpeg`.
- **Platform Strategy**: YouTube is the primary source of audio. Spotify and SoundCloud track information is fetched, but audio extraction delegates to YouTube searches to bypass DRM.
- **Authentication**: YouTube extraction frequently encounters bot protection. Configuration supports Browser Cookies, `cookies.txt`, and PO Tokens.
- **Resilience**: The `MusicPlayer` implements voice connection health checks, automatic recovery, and caching downloaded tracks as `.opus` files to avoid re-downloading.
- **Monitoring**: Integrated Express-based metric exporter in the Shard Manager to expose real-time shard health, guild counts, and system resources to a local dashboard.

## Known Constraints & Workarounds
- **YouTube Bot Protection**: `yt-dlp` requires valid tokens/cookies on some IPs. Previously used `player_client=ios` to bypass limits, but YouTube started requiring PO Tokens for iOS clients as well, leading to `Requested format is not available` errors. Default yt-dlp clients are now preferred when unauthenticated.

## Recent Changes
- 10 May 2026 12:00: Removed hardcoded `youtube:player_client=ios` fallback from `src/YouTube.js` since iOS client now requires PO tokens and was causing format extraction errors.
- 11 May 2026 02:40: Fixed authorization race condition in `MusicEmbedManager.js`.
- 11 May 2026 03:10: Overhauled Autoplay system to use YouTube Mix algorithms and removed Skip permission restrictions.
- 11 May 2026 03:15: Fixed Autoplay transition logic to correctly trigger playback when queue is empty.
- 11 May 2026 14:50: Implemented `/247` mode and mitigated `AsyncEventEmitter` memory leak by cleaning up voice connection listeners before registration.
- 12 May 2026 12:00: Implemented Local Monitoring System with VPS-side Metric Exporter and Local Glassmorphism Dashboard.
