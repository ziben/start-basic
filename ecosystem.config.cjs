/**
 * PM2 Ecosystem Configuration - Windows Bun Compatibility
 */

module.exports = {
    apps: [
        {
            name: 'zi-start-basic',
            // Directly use the executable as the script with 'interpreter: none'
            script: 'bun',
            args: 'run server.ts',
            interpreter: 'none',

            instances: 1,
            exec_mode: 'fork',

            cwd: 'z:\\labs\\start-basic',
            watch: false,

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
        },
    ],
}
