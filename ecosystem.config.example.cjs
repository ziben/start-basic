/**
 * PM2 Ecosystem Configuration Example
 * 
 * Copy this file to ecosystem.config.cjs and adjust for your environment.
 */

module.exports = {
    apps: [
        {
            name: 'zi-start-basic',

            // On Windows with Bun:
            // Option 1 (Stable): script: 'bun', args: 'run server.ts', interpreter: 'none'
            // Option 2 (If Option 1 fails): Use absolute path to bun.exe for 'script'
            script: 'bun',
            args: 'run server.ts',
            interpreter: 'none',

            instances: 1,
            exec_mode: 'fork', // Recommended for Bun on Windows

            // Adjust to your project root if needed
            // cwd: 'C:\\path\\to\\project',

            watch: false,
            max_memory_restart: '500M',
            autorestart: true,

            env_production: {
                NODE_ENV: 'production',
                PORT: 3000,
            },
            env_development: {
                NODE_ENV: 'development',
                PORT: 3000,
            },

            error_file: './logs/pm2-error.log',
            out_file: './logs/pm2-out.log',
            log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
            merge_logs: true,

            kill_timeout: 5000,
            wait_ready: false,
        },
    ],
}
