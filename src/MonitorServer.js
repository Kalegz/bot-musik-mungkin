const express = require('express');
const config = require('../config');
const chalk = require('chalk');

/**
 * Metric Server for local monitoring
 * Aggregates data from all shards
 */
class MonitorServer {
    constructor(source) {
        this.source = source; // Can be ShardingManager or Client
        this.app = express();
        this.port = config.monitoring.port;
        this.apiKey = config.monitoring.apiKey;

        this.setupMiddleware();
        this.setupRoutes();
    }

    setupMiddleware() {
        this.app.use(express.json());
        
        // Simple API Key Auth
        this.app.use((req, res, next) => {
            const authHeader = req.headers['authorization'];
            const queryKey = req.query.key;
            if (authHeader === `Bearer ${this.apiKey}` || queryKey === this.apiKey) {
                return next();
            }
            console.log(chalk.yellow(`[MONITOR] Blocked unauthorized request from ${req.ip}`));
            res.status(401).json({ error: 'Unauthorized' });
        });

        // CORS for local dashboard
        this.app.use((req, res, next) => {
            res.header('Access-Control-Allow-Origin', '*');
            res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
            next();
        });
    }

    setupRoutes() {
        this.app.get('/api/stats', async (req, res) => {
            try {
                let shardResults;
                
                // Check if source is ShardingManager (has broadcastEval) or Client
                if (this.source.broadcastEval && typeof this.source.broadcastEval === 'function') {
                    // ShardingManager mode
                    shardResults = await this.source.broadcastEval(client => {
                        return {
                            id: client.shard.ids[0],
                            ready: client.readyAt !== null,
                            uptime: client.uptime,
                            guilds: client.guilds.cache.size,
                            users: client.users.cache.size,
                            players: client.players.size,
                            memory: process.memoryUsage().rss / 1024 / 1024, // MB
                            ping: client.ws.ping
                        };
                    });
                } else {
                    // Single Client mode (Non-sharded)
                    const client = this.source;
                    shardResults = [{
                        id: client.shard?.ids[0] ?? 0,
                        ready: client.readyAt !== null,
                        uptime: client.uptime,
                        guilds: client.guilds.cache.size,
                        users: client.users.cache.size,
                        players: client.players.size,
                        memory: process.memoryUsage().rss / 1024 / 1024,
                        ping: client.ws.ping
                    }];
                }

                // Aggregate totals
                const totals = shardResults.reduce((acc, shard) => {
                    acc.guilds += shard.guilds;
                    acc.users += shard.users;
                    acc.players += shard.players;
                    acc.memory += shard.memory;
                    return acc;
                }, { guilds: 0, users: 0, players: 0, memory: 0 });

                res.json({
                    status: 'online',
                    timestamp: Date.now(),
                    shards: shardResults,
                    totals: {
                        ...totals,
                        shardCount: shardResults.length,
                        processUptime: process.uptime()
                    }
                });
            } catch (error) {
                console.error(chalk.red('[MONITOR] Error fetching stats:'), error);
                res.status(500).json({ error: 'Failed to fetch metrics' });
            }
        });

        // Restart Bot Action
        this.app.post('/api/action/restart', (req, res) => {
            const { exec } = require('child_process');
            console.log(chalk.yellow(`[MONITOR] Restart command received from ${req.ip}`));
            
            res.json({ message: 'Restarting bot...' });

            // Execute restart after a small delay to ensure response is sent
            setTimeout(() => {
                exec('pm2 restart music-bot', (error) => {
                    if (error) console.error(chalk.red(`[MONITOR] Restart failed: ${error.message}`));
                });
            }, 1000);
        });

        // Fetch Logs Action
        this.app.get('/api/action/logs', async (req, res) => {
            const { exec } = require('child_process');
            // Ambil 100 baris terakhir dari out log dan error log
            exec('pm2 logs music-bot --lines 100 --nostream --raw', (error, stdout, stderr) => {
                if (error) {
                    return res.status(500).json({ error: 'Failed to fetch logs' });
                }
                res.json({ logs: stdout || stderr });
            });
        });

        this.app.get('/api/ping', (req, res) => {
            res.json({ status: 'pong', timestamp: Date.now() });
        });
    }

    start() {
        this.app.listen(this.port, '::', () => {
            console.log(chalk.green(`\n📊 [MONITOR] Metric Server is running on port ${this.port}`));
            console.log(chalk.cyan(`📊 [MONITOR] Endpoint: http://YOUR_VPS_IP:${this.port}/api/stats`));
            console.log(chalk.cyan(`📊 [MONITOR] Security: Bearer Token or ?key query param enabled\n`));
        });
    }
}

module.exports = MonitorServer;
